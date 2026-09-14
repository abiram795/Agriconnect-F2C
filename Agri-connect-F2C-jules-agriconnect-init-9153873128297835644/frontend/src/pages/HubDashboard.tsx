import { useState, useEffect } from "react";
import { Building2, CheckCircle2, Package, ArrowDownRight, TrendingUp, AlertTriangle, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function HubDashboard() {
  const navigate = useNavigate();
  const [hubId] = useState("HUB-CBE-01");
  const [hubName] = useState("Coimbatore Central City Hub");
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [hubInventory, setHubInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const hubWorkerName = localStorage.getItem("agriconnect_user_name") || "Hub Worker";

  useEffect(() => {
    fetchHubData();
  }, [hubId]);

  const fetchHubData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, invRes] = await Promise.all([
        fetch(getApiUrl(`/api/hubs/transfers/pending?hub_id=${hubId}`)),
        fetch(getApiUrl(`/api/hubs/${hubId}/inventory`))
      ]);

      if (pendingRes.ok) {
        setPendingTransfers(await pendingRes.json());
      }
      if (invRes.ok) {
        setHubInventory(await invRes.json());
      }
    } catch (err) {
      console.error("Failed to load hub data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReceipt = async (transferId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/hubs/transfers/${transferId}/confirm`), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setActionSuccess("Stock confirmed received and added to Hub inventory!");
        setTimeout(() => setActionSuccess(""), 4000);
        fetchHubData();
      } else {
        alert("Failed to confirm receipt");
      }
    } catch (err) {
      console.error(err);
      alert("Network error confirming stock receipt");
    }
  };

  const handleRejectReceipt = async (transferId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/hubs/transfers/${transferId}/reject`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejection_reason: rejectReason || "Quality check issue" })
      });
      if (res.ok) {
        setActionSuccess("Transfer rejected. Farmer inventory restored.");
        setRejectingId(null);
        setRejectReason("");
        setTimeout(() => setActionSuccess(""), 4000);
        fetchHubData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("agriconnect_user_id");
    localStorage.removeItem("agriconnect_user_role");
    localStorage.removeItem("agriconnect_user_name");
    navigate("/");
  };

  const totalSold = hubInventory.reduce((acc, i) => acc + floatVal(i.quantity_sold), 0);
  const totalRevenue = hubInventory.reduce((acc, i) => acc + (floatVal(i.quantity_sold) * floatVal(i.hub_price)), 0);

  function floatVal(val: any): number {
    const p = parseFloat(val);
    return isNaN(p) ? 0 : p;
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1F2937] font-sans pb-12">
      {/* Top Header */}
      <header className="bg-[#0B6B3A] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2E8B57] rounded-lg">
              <Building2 className="w-7 h-7 text-[#F4B400]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{hubName}</h1>
              <p className="text-xs text-green-100 font-medium">AgriConnect City Distribution Hub • ID: {hubId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-[#2E8B57] px-3 py-1.5 rounded-full font-medium">
              Worker: <span className="font-bold">{hubWorkerName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {actionSuccess && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Pending Receipts</span>
              <ArrowDownRight className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600">{pendingTransfers.length}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting physical verification</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Available Stock</span>
              <Package className="w-5 h-5 text-[#0B6B3A]" />
            </div>
            <p className="text-3xl font-extrabold text-[#0B6B3A]">
              {hubInventory.reduce((acc, i) => acc + floatVal(i.quantity_remaining), 0).toFixed(1)} <span className="text-lg">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Active items ready for consumers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Total Sold</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600">
              {totalSold.toFixed(1)} <span className="text-lg">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Dispatched to consumers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Hub Revenue</span>
              <span className="text-[#F4B400] font-bold text-lg">₹</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-800">
              ₹{totalRevenue.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Transparent sales total</p>
          </div>
        </div>

        {/* SECTION 1: PENDING RECEIPTS */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ArrowDownRight className="w-6 h-6 text-amber-500" />
                Pending Farmer Stock Receipts
              </h2>
              <p className="text-sm text-gray-500">Confirm physical produce delivered to the Hub</p>
            </div>
            <button
              onClick={fetchHubData}
              className="flex items-center gap-1 text-sm font-semibold text-[#0B6B3A] hover:underline"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="text-center py-8 text-gray-500 font-medium">Loading pending receipts...</p>
          ) : pendingTransfers.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-dashed border-gray-300">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-gray-700">No pending receipts</p>
              <p className="text-xs">All farmer shipments for this Hub have been verified and processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTransfers.map((t) => {
                const farmerName = t.users?.name || "Verified Farmer";
                const farmerPhone = t.users?.phone || "";
                return (
                  <div key={t.id} className="border-2 border-amber-200 bg-amber-50/40 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300">
                          Awaiting Receipt
                        </span>
                        <span className="text-xs text-gray-500 font-mono">ID: {t.id ? String(t.id).substring(0, 8) : ""}</span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-1">{t.product_name}</h3>
                      <p className="text-sm font-semibold text-gray-700">
                        Farmer: <span className="text-emerald-700 font-bold">{farmerName}</span> {farmerPhone ? `(${farmerPhone})` : ""}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm bg-white p-3 rounded-lg border border-amber-200">
                        <div>
                          <span className="text-gray-500 text-xs block">Quantity Sent:</span>
                          <span className="text-lg font-extrabold text-gray-800">{t.quantity_sent} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">Farmer Price:</span>
                          <span className="text-lg font-extrabold text-emerald-700">₹{t.farmer_price}/kg</span>
                        </div>
                      </div>
                    </div>

                    {rejectingId === t.id ? (
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <input
                          type="text"
                          placeholder="Reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full text-sm p-2 border border-gray-300 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectReceipt(t.id)}
                            className="flex-1 bg-red-600 text-white font-bold text-sm py-2 rounded-lg hover:bg-red-700"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleConfirmReceipt(t.id)}
                          className="flex-1 bg-[#0B6B3A] hover:bg-[#2E8B57] text-white font-extrabold py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2 text-base transition"
                        >
                          <CheckCircle2 className="w-5 h-5 text-[#F4B400]" />
                          Confirm Received
                        </button>
                        <button
                          onClick={() => setRejectingId(t.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-4 py-3 rounded-xl text-sm transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: CURRENT HUB INVENTORY */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-[#0B6B3A]" />
              Hub Stock & Pricing Transparency
            </h2>
            <p className="text-sm text-gray-500">Live produce inventory available for consumer purchase</p>
          </div>

          {hubInventory.length === 0 ? (
            <p className="text-center py-8 text-gray-500 font-medium">No active stock in Hub inventory.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Produce Item</th>
                    <th className="py-3 px-4">Source Farmer</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4">Sold</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Farmer Price</th>
                    <th className="py-3 px-4">Operating Cost</th>
                    <th className="py-3 px-4">Hub Consumer Price</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {hubInventory.map((item) => {
                    const rem = floatVal(item.quantity_remaining);
                    const isLow = rem > 0 && rem < 10;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{item.product_name}</td>
                        <td className="py-3 px-4 font-medium text-emerald-800">{item.users?.name || "Verified Farmer"}</td>
                        <td className="py-3 px-4 text-gray-700">{floatVal(item.quantity_received).toFixed(1)} kg</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">{floatVal(item.quantity_sold).toFixed(1)} kg</td>
                        <td className="py-3 px-4 font-extrabold text-gray-900">
                          {rem.toFixed(1)} kg
                          {isLow && (
                            <span className="ml-2 inline-flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">₹{floatVal(item.farmer_price).toFixed(2)}/kg</td>
                        <td className="py-3 px-4 text-gray-500">₹{floatVal(item.operating_cost_component || 8.0).toFixed(2)}/kg</td>
                        <td className="py-3 px-4 font-extrabold text-gray-900 bg-emerald-50">₹{floatVal(item.hub_price).toFixed(2)}/kg</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${rem > 0 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                            {rem > 0 ? "AVAILABLE" : "OUT OF STOCK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
