import { useState, useEffect } from "react";
import { Building2, CheckCircle2, Package, ArrowDownRight, TrendingUp, AlertTriangle, LogOut, RefreshCw, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../config/api";
import ReceiptModal from "../components/ReceiptModal";

export default function HubDashboard() {
  const navigate = useNavigate();
  const [hubId] = useState("COIMBATORE-HUB-001");
  const [hubName] = useState("Coimbatore Hub");
  const [activeTab, setActiveTab] = useState<"incoming" | "sales" | "inventory">("incoming");

  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [hubInventory, setHubInventory] = useState<any[]>([]);
  const [incomingReceipts, setIncomingReceipts] = useState<any[]>([]);
  const [salesReceipts, setSalesReceipts] = useState<any[]>([]);
  const [farmersList, setFarmersList] = useState<any[]>([]);

  const [, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Modals state
  const [showAddIncomingModal, setShowAddIncomingModal] = useState(false);
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [selectedReceiptType, setSelectedReceiptType] = useState<"INCOMING" | "SALE">("INCOMING");

  // Form states - Add Incoming
  const [incFarmerId, setIncFarmerId] = useState("");
  const [incProductName, setIncProductName] = useState("");
  const [incQuantity, setIncQuantity] = useState("");
  const [incFarmerPrice, setIncFarmerPrice] = useState("");
  const [incSourceRef, setIncSourceRef] = useState("");
  const [isSubmittingInc, setIsSubmittingInc] = useState(false);

  // Form states - New Sale
  const [saleInventoryId, setSaleInventoryId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("");
  const [saleUnitPrice, setSaleUnitPrice] = useState("");
  const [saleConsumerRef, setSaleConsumerRef] = useState("");
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const hubWorkerName = localStorage.getItem("agriconnect_user_name") || "Coimbatore Hub Manager";

  useEffect(() => {
    const userId = localStorage.getItem("agriconnect_user_id");
    const role = localStorage.getItem("agriconnect_user_role");
    if (!userId || (role !== "hub_worker" && role !== "hub")) {
      navigate("/hub-login");
      return;
    }
    fetchHubData();
    fetchFarmers();
  }, [hubId]);

  const fetchFarmers = async () => {
    try {
      const res = await fetch(getApiUrl("/api/farmers/all/list"));
      if (res.ok) setFarmersList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHubData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes1, pendingRes2, invRes1, invRes2, incRes, saleRes] = await Promise.all([
        fetch(getApiUrl(`/api/hubs/transfers/pending?hub_id=COIMBATORE-HUB-001`)),
        fetch(getApiUrl(`/api/hubs/transfers/pending?hub_id=HUB-CBE-01`)),
        fetch(getApiUrl(`/api/hubs/COIMBATORE-HUB-001/inventory`)),
        fetch(getApiUrl(`/api/hubs/HUB-CBE-01/inventory`)),
        fetch(getApiUrl(`/api/hubs/receipts/incoming?hub_id=${hubId}`)),
        fetch(getApiUrl(`/api/hubs/receipts/sales?hub_id=${hubId}`))
      ]);

      let pending: any[] = [];
      let inv: any[] = [];

      if (pendingRes1.ok) pending = pending.concat(await pendingRes1.json());
      if (pendingRes2.ok) pending = pending.concat(await pendingRes2.json());
      if (invRes1.ok) inv = inv.concat(await invRes1.json());
      if (invRes2.ok) inv = inv.concat(await invRes2.json());

      const uniquePending = Array.from(new Map(pending.map(item => [item.id, item])).values());
      const uniqueInv = Array.from(new Map(inv.map(item => [item.id, item])).values());

      setPendingTransfers(uniquePending);
      setHubInventory(uniqueInv);

      if (incRes.ok) setIncomingReceipts(await incRes.json());
      if (saleRes.ok) setSalesReceipts(await saleRes.json());
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

  const handleAddIncomingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!incFarmerId || !incProductName || !incQuantity || !incFarmerPrice) {
      setActionError("Please fill all required fields.");
      return;
    }

    setIsSubmittingInc(true);
    try {
      const res = await fetch(getApiUrl("/api/hubs/receipts/incoming"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: incFarmerId,
          product_name: incProductName,
          quantity: parseFloat(incQuantity),
          unit: "kg",
          hub_id: hubId,
          farmer_price: parseFloat(incFarmerPrice),
          operating_cost_component: 8.0,
          source_reference: incSourceRef || "Direct Farmer Stock Deposit"
        })
      });

      if (res.ok) {
        const createdReceipt = await res.json();
        setActionSuccess(`Incoming receipt ${createdReceipt.receipt_number} created successfully! Inventory updated.`);
        setShowAddIncomingModal(false);
        setIncFarmerId("");
        setIncProductName("");
        setIncQuantity("");
        setIncFarmerPrice("");
        setIncSourceRef("");
        fetchHubData();

        // Open Receipt Modal automatically for viewing / printing
        setSelectedReceipt(createdReceipt);
        setSelectedReceiptType("INCOMING");
        setTimeout(() => setActionSuccess(""), 5000);
      } else {
        const errData = await res.json();
        setActionError(errData.detail || "Failed to create incoming receipt");
      }
    } catch (e) {
      console.error(e);
      setActionError("Network error creating incoming receipt");
    } finally {
      setIsSubmittingInc(false);
    }
  };

  const handleAddSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!saleInventoryId || !saleQuantity || !saleUnitPrice) {
      setActionError("Please select product item and enter quantity and selling price.");
      return;
    }

    const selectedInv = hubInventory.find(i => i.id === saleInventoryId);
    if (selectedInv && parseFloat(saleQuantity) > floatVal(selectedInv.quantity_remaining)) {
      setActionError(`Cannot sell ${saleQuantity} kg. Only ${selectedInv.quantity_remaining} kg available in stock.`);
      return;
    }

    setIsSubmittingSale(true);
    try {
      const res = await fetch(getApiUrl("/api/hubs/receipts/sale"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hub_inventory_id: saleInventoryId,
          quantity: parseFloat(saleQuantity),
          unit_price: parseFloat(saleUnitPrice),
          consumer_reference: saleConsumerRef || "Direct Hub Counter Sale",
          payment_status: "PAID"
        })
      });

      if (res.ok) {
        const createdSale = await res.json();
        setActionSuccess(`Sales receipt ${createdSale.receipt_number} generated! Hub stock updated.`);
        setShowAddSaleModal(false);
        setSaleInventoryId("");
        setSaleQuantity("");
        setSaleUnitPrice("");
        setSaleConsumerRef("");
        fetchHubData();

        // Open Sales Receipt Modal automatically
        setSelectedReceipt(createdSale);
        setSelectedReceiptType("SALE");
        setTimeout(() => setActionSuccess(""), 5000);
      } else {
        const errData = await res.json();
        setActionError(errData.detail || "Failed to create sales receipt");
      }
    } catch (e) {
      console.error(e);
      setActionError("Network error creating sales receipt");
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("agriconnect_user_id");
    localStorage.removeItem("agriconnect_user_role");
    localStorage.removeItem("agriconnect_user_name");
    navigate("/");
  };

  const totalSold = hubInventory.reduce((acc, i) => acc + floatVal(i.quantity_sold), 0);
  const totalRevenue = salesReceipts.reduce((acc, r) => acc + floatVal(r.total_price), 0);

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
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Pending Stock Receipts</span>
              <ArrowDownRight className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600">{pendingTransfers.length}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting physical verification</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Available Hub Stock</span>
              <Package className="w-5 h-5 text-[#0B6B3A]" />
            </div>
            <p className="text-3xl font-extrabold text-[#0B6B3A]">
              {hubInventory.reduce((acc, i) => acc + floatVal(i.quantity_remaining), 0).toFixed(1)} <span className="text-lg">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Active produce ready for sale</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Total Dispatched / Sold</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600">
              {totalSold.toFixed(1)} <span className="text-lg">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Sold at Hub counter</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center text-gray-500 mb-2">
              <span className="text-sm font-semibold">Total Sales Revenue</span>
              <span className="text-[#F4B400] font-bold text-lg">₹</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-800">
              ₹{totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Hub receipts billing</p>
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition ${
              activeTab === "incoming" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ArrowDownRight className="w-5 h-5" /> INCOMING STOCK & RECEIPTS
          </button>

          <button
            onClick={() => setActiveTab("sales")}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition ${
              activeTab === "sales" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <TrendingUp className="w-5 h-5" /> HUB SALES & BILLING
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition ${
              activeTab === "inventory" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Package className="w-5 h-5" /> INVENTORY OVERVIEW
          </button>
        </div>

        {/* TAB 1: INCOMING STOCK & RECEIPTS */}
        {activeTab === "incoming" && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Incoming Product Receipts</h2>
                <p className="text-xs text-gray-500">Record farmer produce received at the Hub and generate verified incoming receipts.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddIncomingModal(true)}
                  className="bg-[#0B6B3A] hover:bg-[#2E8B57] text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Plus className="w-5 h-5 text-[#F4B400]" /> + Add Incoming Product
                </button>
                <button onClick={fetchHubData} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2.5 rounded-xl">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pending Transfers Inspection */}
            {pendingTransfers.length > 0 && (
              <div className="bg-amber-50/60 border-2 border-amber-300 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" /> Pending Farmer Submissions ({pendingTransfers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingTransfers.map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-amber-200 space-y-3">
                      <div className="flex justify-between">
                        <span className="font-extrabold text-base text-gray-900">{t.product_name}</span>
                        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Awaiting Receipt</span>
                      </div>
                      <p className="text-xs text-gray-600">Farmer: <span className="font-bold text-emerald-800">{t.users?.name || "Verified Farmer"}</span></p>
                      <div className="flex justify-between text-xs font-bold bg-gray-50 p-2.5 rounded">
                        <span>Quantity: {t.quantity_sent} kg</span>
                        <span className="text-emerald-700">Farmer Price: ₹{t.farmer_price}/kg</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleConfirmReceipt(t.id)} className="flex-1 bg-[#0B6B3A] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#2E8B57]">
                          Confirm & Generate Stock
                        </button>
                        <button onClick={() => handleRejectReceipt(t.id)} className="bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-lg border border-red-200">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incoming Receipts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 text-base mb-3">Verified Incoming Product Receipts</h3>
              {incomingReceipts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-xl">No incoming receipts recorded yet. Click "+ Add Incoming Product" to register new stock.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <th className="p-3">Receipt #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Source Farmer</th>
                        <th className="p-3">Product Item</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Farmer Price</th>
                        <th className="p-3">Total Value</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incomingReceipts.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 font-semibold">
                          <td className="p-3 font-mono font-extrabold text-[#0B6B3A]">{r.receipt_number}</td>
                          <td className="p-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="p-3 text-emerald-800 font-bold">{r.farmer_name || r.users?.name || "Verified Farmer"}</td>
                          <td className="p-3 text-gray-900 font-bold">{r.product_name}</td>
                          <td className="p-3 text-gray-800">{r.quantity} {r.unit || "kg"}</td>
                          <td className="p-3 text-emerald-700">₹{r.farmer_price}/kg</td>
                          <td className="p-3 font-extrabold text-gray-900">₹{(r.total_value || r.quantity * r.farmer_price).toFixed(2)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                              {r.status || "RECEIVED & VERIFIED"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedReceipt(r);
                                setSelectedReceiptType("INCOMING");
                              }}
                              className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-extrabold px-3 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View / Print Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HUB SALES & BILLING */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Hub Sales & Billing System</h2>
                <p className="text-xs text-gray-500">Generate sales receipts for counter buyers. Every sale maintains mandatory source farmer attribution.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddSaleModal(true)}
                  className="bg-[#0B6B3A] hover:bg-[#2E8B57] text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Plus className="w-5 h-5 text-[#F4B400]" /> + Record New Sale
                </button>
                <button onClick={fetchHubData} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2.5 rounded-xl">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sales Receipts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 text-base mb-3">Issued Sales Receipts</h3>
              {salesReceipts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-xl">No Hub sales receipts recorded yet. Click "+ Record New Sale" to issue a sale receipt.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <th className="p-3">Receipt #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Item Purchased</th>
                        <th className="p-3">Qty Sold</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3">Total Paid</th>
                        <th className="p-3">Source Farmer Attribution</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesReceipts.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 font-semibold">
                          <td className="p-3 font-mono font-extrabold text-[#0B6B3A]">{s.receipt_number}</td>
                          <td className="p-3 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="p-3 text-gray-900 font-bold">{s.product_name}</td>
                          <td className="p-3 text-gray-800">{s.quantity} {s.unit || "kg"}</td>
                          <td className="p-3 text-gray-700">₹{s.unit_price}/kg</td>
                          <td className="p-3 font-black text-[#0B6B3A] text-sm">₹{floatVal(s.total_price).toFixed(2)}</td>
                          <td className="p-3 text-emerald-800 font-bold">
                            <span className="inline-block bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              🌱 {s.farmer_name || s.users?.name || "Verified Farmer"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full">
                              {s.payment_status || "PAID"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedReceipt(s);
                                setSelectedReceiptType("SALE");
                              }}
                              className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-extrabold px-3 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View / Print Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY OVERVIEW */}
        {activeTab === "inventory" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-[#0B6B3A]" />
                Hub Produce Stock & Transparent Pricing
              </h2>
              <p className="text-sm text-gray-500">Live produce inventory available for consumer purchase with full farmer attribution</p>
            </div>

            {hubInventory.length === 0 ? (
              <p className="text-center py-8 text-gray-500 font-medium">No active stock in Hub inventory.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Produce Item</th>
                      <th className="py-3 px-4">Source Farmer</th>
                      <th className="py-3 px-4">Received Qty</th>
                      <th className="py-3 px-4">Sold Qty</th>
                      <th className="py-3 px-4">Remaining Qty</th>
                      <th className="py-3 px-4">Farmer Price</th>
                      <th className="py-3 px-4">Operating Fee</th>
                      <th className="py-3 px-4">Hub Consumer Price</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hubInventory.map((item) => {
                      const rem = floatVal(item.quantity_remaining);
                      const isLow = rem > 0 && rem < 10;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 font-semibold">
                          <td className="py-3 px-4 font-extrabold text-gray-900">{item.product_name}</td>
                          <td className="py-3 px-4 font-bold text-emerald-800">{item.users?.name || "Verified Farmer"}</td>
                          <td className="py-3 px-4 text-gray-700">{floatVal(item.quantity_received).toFixed(1)} {item.unit || "kg"}</td>
                          <td className="py-3 px-4 font-semibold text-blue-600">{floatVal(item.quantity_sold).toFixed(1)} {item.unit || "kg"}</td>
                          <td className="py-3 px-4 font-extrabold text-gray-900">
                            {rem.toFixed(1)} {item.unit || "kg"}
                            {isLow && (
                              <span className="ml-2 inline-flex items-center text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-700">₹{floatVal(item.farmer_price).toFixed(2)}/kg</td>
                          <td className="py-3 px-4 text-gray-500">₹{floatVal(item.operating_cost_component || 8.0).toFixed(2)}/kg</td>
                          <td className="py-3 px-4 font-extrabold text-gray-900 bg-emerald-50">₹{floatVal(item.hub_price).toFixed(2)}/kg</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-full ${rem > 0 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
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
        )}
      </main>

      {/* MODAL 1: ADD INCOMING PRODUCT */}
      {showAddIncomingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#0B6B3A]" /> Register Incoming Product
            </h2>
            <p className="text-xs text-gray-600 mb-4">Add farmer deposit stock and generate verified incoming receipt.</p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-bold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddIncomingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Source Farmer *</label>
                <select
                  value={incFarmerId}
                  onChange={(e) => setIncFarmerId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  required
                >
                  <option value="">-- Choose Verified Farmer --</option>
                  {farmersList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.village || f.district || "Tamil Nadu"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Produce Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Tomatoes, Country Onions..."
                  value={incProductName}
                  onChange={(e) => setIncProductName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quantity Received (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="Enter kg..."
                    value={incQuantity}
                    onChange={(e) => setIncQuantity(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Farmer Price (₹/kg) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Enter rate..."
                    value={incFarmerPrice}
                    onChange={(e) => setIncFarmerPrice(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Source / Transfer Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Direct Farmer Delivery / Vehicle KA-05-1234"
                  value={incSourceRef}
                  onChange={(e) => setIncSourceRef(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-1 text-emerald-900">
                <p className="font-bold">Automatic Transparent Pricing:</p>
                <p>• Farmer Price: ₹{incFarmerPrice || 0}/kg</p>
                <p>• Hub Operating Fee: ₹8.00/kg</p>
                <p className="font-black text-emerald-950">
                  = Hub Consumer Price: ₹{(parseFloat(incFarmerPrice || "0") + 8).toFixed(2)}/kg
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIncomingModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInc}
                  className="flex-1 py-2.5 bg-[#0B6B3A] hover:bg-[#2E8B57] text-white rounded-lg font-bold text-xs disabled:opacity-50 transition"
                >
                  {isSubmittingInc ? "Generating..." : "Generate Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD NEW HUB SALE */}
      {showAddSaleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#0B6B3A]" /> Record Hub Sale
            </h2>
            <p className="text-xs text-gray-600 mb-4">Issue sales receipt with automatic farmer attribution and inventory deduction.</p>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-bold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Hub Inventory Produce *</label>
                <select
                  value={saleInventoryId}
                  onChange={(e) => {
                    const sel = hubInventory.find(i => i.id === e.target.value);
                    setSaleInventoryId(e.target.value);
                    if (sel) setSaleUnitPrice(String(sel.hub_price));
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  required
                >
                  <option value="">-- Choose Stock Item --</option>
                  {hubInventory.filter(i => floatVal(i.quantity_remaining) > 0).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.product_name} ({i.quantity_remaining} {i.unit || "kg"} remaining @ ₹{i.hub_price}/kg • Sourced from: {i.users?.name || "Farmer"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sale Quantity (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="Enter kg..."
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="Enter price..."
                    value={saleUnitPrice}
                    onChange={(e) => setSaleUnitPrice(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Consumer / Counter Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Counter Cash Sale / Order #1042"
                  value={saleConsumerRef}
                  onChange={(e) => setSaleConsumerRef(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              {/* Total Calculation Banner */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex justify-between items-center text-xs">
                <span className="font-bold text-blue-900">Total Calculated Bill:</span>
                <span className="text-xl font-black text-blue-950">
                  ₹{((parseFloat(saleQuantity || "0")) * (parseFloat(saleUnitPrice || "0"))).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSaleModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="flex-1 py-2.5 bg-[#0B6B3A] hover:bg-[#2E8B57] text-white rounded-lg font-bold text-xs disabled:opacity-50 transition"
                >
                  {isSubmittingSale ? "Issuing Sale..." : "Issue Sales Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT VIEW / PRINT / PDF MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          type={selectedReceiptType}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
