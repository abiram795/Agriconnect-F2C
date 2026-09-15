import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, Users, ArrowLeft, Bell, MapPin, DollarSign, Activity, Navigation, Truck, Star, X, BarChart2, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getApiUrl } from "../config/api";
import MarketAnalysisModal from "../components/MarketAnalysisModal";
import FarmerIVRMenuModal from "../components/FarmerIVRMenuModal";

export default function FarmerDashboard() {
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState("");
  const [farmerData, setFarmerData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [farmerReviews, setFarmerReviews] = useState<{
    reviews: any[];
    average_rating: number;
    total_reviews: number;
  }>({ reviews: [], average_rating: 0, total_reviews: 0 });
  const [bulkRequests, setBulkRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [ivrData, setIvrData] = useState<any>(null);
  const [isIVRModalOpen, setIsIVRModalOpen] = useState(false);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<string>("");

  const [showHubModal, setShowHubModal] = useState(false);
  const [hubStockData, setHubStockData] = useState<any>({ transfers: [], inventory: [], summary: {} });
  const [selectedHubProductId, setSelectedHubProductId] = useState("");
  const [hubTransferQty, setHubTransferQty] = useState("");
  const [selectedCityHub, setSelectedCityHub] = useState("HUB-CBE-01");
  const [isSubmittingHubTransfer, setIsSubmittingHubTransfer] = useState(false);
  const [hubTransferMessage, setHubTransferMessage] = useState("");
  const [profileTab, setProfileTab] = useState<"profile" | "farm" | "verification" | "selling" | "delivery" | "account">("profile");
  const [showReVerificationNotice, setShowReVerificationNotice] = useState(false);

  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => {
          setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const userId = localStorage.getItem('agriconnect_user_id');
    if (!userId) {
      alert("Your session has expired. Please log in again.");
      window.location.href = '/farmer-login';
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/api/farmers/${userId}`));
      if (res.ok) {
        const data = await res.json();
        setFarmerData(data);
      }
      
      const pRes = await fetch(getApiUrl(`/api/farmers/${userId}/products`));
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
      }

      const oRes = await fetch(getApiUrl(`/api/orders/farmer/${userId}`));
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
      }

      const nRes = await fetch(getApiUrl(`/api/notifications/${userId}`));
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData);
      }

      const rRes = await fetch(getApiUrl(`/api/reviews/FARMER/${userId}`));
      if (rRes.ok) {
        const rData = await rRes.json();
        setFarmerReviews(rData);
      }

      const bRes = await fetch(getApiUrl(`/api/bulk-requests/farmer/${userId}`));
      if (bRes.ok) {
        const bData = await bRes.json();
        setBulkRequests(bData);
      }

      const hRes = await fetch(getApiUrl(`/api/hubs/farmer/${userId}/stock`));
      if (hRes.ok) {
        setHubStockData(await hRes.json());
      }

      const ivrRes = await fetch(getApiUrl(`/api/ivr/farmer/${userId}/access`), {
        headers: { "X-User-Id": userId }
      });
      if (ivrRes.ok) {
        const ivrInfo = await ivrRes.json();
        setIvrData(ivrInfo);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFarmerBulkResponse = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      const userId = localStorage.getItem('agriconnect_user_id');
      const res = await fetch(getApiUrl(`/api/bulk-requests/${requestId}/farmer-response`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: userId, action })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(action === 'ACCEPT' ? 'Contribution accepted and inventory reserved!' : 'Contribution request declined.');
        fetchData();
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        alert(data.detail || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing response");
    }
  };

  const markNotificationsRead = async () => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unread.length === 0) return;

    try {
      await fetch(getApiUrl('/api/notifications/read'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: unread })
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markNotificationsRead();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background p-8 text-center">Loading dashboard...</div>;
  }

  const status = farmerData?.verification_status || 'Pending';
  
  const currentProduce = products.filter(p => p.status === 'Available');
  const farmerName = farmerData?.users?.name || "Farmer";

  // Calculations for Sales Overview
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length;
  const totalEarnings = orders
    .filter(o => o.status === 'Completed' || o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalQuantitySold = orders
    .filter(o => o.status === 'Completed' || o.status === 'Delivered')
    .reduce((sum, o) => sum + (o.quantity || 0), 0);

  // Sales Locations
  const salesLocations = Array.from(new Set(orders
    .map(o => o.delivery_address?.city || o.delivery_address?.state)
    .filter(Boolean)
  ));

  const handleVerifyOtp = async (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      setOtpError("Please enter a 4-digit OTP.");
      return;
    }
    setOtpError("");
    try {
      const farmerId = localStorage.getItem('agriconnect_user_id');
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/verify-otp`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, farmer_id: farmerId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Delivery verified successfully!");
        fetchData();
      } else {
        setOtpError(data.detail || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setOtpError("An error occurred during verification");
    }
  };

  const handleSendToHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('agriconnect_user_id');
    if (!userId || !selectedHubProductId || !hubTransferQty) return;

    const targetProd = products.find(p => p.id === selectedHubProductId);
    if (!targetProd) return;

    setIsSubmittingHubTransfer(true);
    try {
      const res = await fetch(getApiUrl('/api/hubs/transfers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: userId,
          product_id: selectedHubProductId,
          hub_id: selectedCityHub,
          product_name: targetProd.name,
          quantity_sent: parseFloat(hubTransferQty),
          farmer_price: targetProd.price
        })
      });
      if (res.ok) {
        setHubTransferMessage(`Successfully submitted ${hubTransferQty} kg of ${targetProd.name} to ${selectedCityHub}! Awaiting Hub receipt verification.`);
        setShowHubModal(false);
        setHubTransferQty("");
        fetchData();
        setTimeout(() => setHubTransferMessage(""), 6000);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to submit Hub transfer");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting Hub transfer");
    } finally {
      setIsSubmittingHubTransfer(false);
    }
  };

  if (showProfile) {
    const activeProducts = products.filter(p => p.status === 'Available' || p.status === 'Pending Verification');
    const transfers = hubStockData.transfers || [];
    const summary = hubStockData.summary || {};

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <button onClick={() => setShowProfile(false)} className="mb-6 flex items-center text-primary hover:underline font-bold text-base">
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
        </button>
        
        {/* Profile Top Summary Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-100 rounded-full text-[#0B6B3A]">
                <User className="w-9 h-9" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{farmerName}</h1>
                <p className="text-sm font-semibold text-gray-500">{farmerData?.village}, {farmerData?.district}, {farmerData?.state}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600"/> {farmerData?.verification_status || status}
              </span>
            </div>
          </div>

          {/* Profile Section Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-4">
            <button
              onClick={() => setProfileTab("profile")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "profile" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              MY PROFILE
            </button>
            <button
              onClick={() => setProfileTab("farm")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "farm" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              FARM DETAILS
            </button>
            <button
              onClick={() => setProfileTab("verification")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "verification" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              VERIFICATION
            </button>
            <button
              onClick={() => setProfileTab("selling")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "selling" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              MY SELLING & HUB STOCK
            </button>
            <button
              onClick={() => setProfileTab("delivery")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "delivery" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              DELIVERY
            </button>
            <button
              onClick={() => setProfileTab("account")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "account" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              ACCOUNT
            </button>
          </div>
        </div>

        {/* TAB 1: MY PROFILE */}
        {profileTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0B6B3A]" /> My Profile Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div><span className="text-gray-500 block text-xs">Full Name</span><span className="font-extrabold text-base text-gray-900">{farmerName}</span></div>
              <div><span className="text-gray-500 block text-xs">Mobile Number</span><span className="font-extrabold text-base text-gray-900">{farmerData?.users?.phone}</span></div>
              <div><span className="text-gray-500 block text-xs">Preferred Language</span><span className="font-extrabold text-base text-gray-900">{farmerData?.languages || "Tamil, English"}</span></div>
            </div>
          </div>
        )}

        {/* TAB 2: FARM DETAILS */}
        {profileTab === "farm" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0B6B3A]" /> Farm & Land Details
              </h2>
              <button
                onClick={() => setShowReVerificationNotice(true)}
                className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-100"
              >
                Edit Verified Land Information
              </button>
            </div>

            {showReVerificationNotice && (
              <div className="bg-amber-100 border border-amber-400 text-amber-900 p-4 rounded-xl text-sm font-semibold space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-700" /> Admin Re-Verification Required
                </p>
                <p>Verified land area, acreage, and ownership records cannot be silently changed after approval. Submitting changes will require Admin re-verification.</p>
                <button
                  onClick={() => setShowReVerificationNotice(false)}
                  className="bg-amber-800 text-white px-3 py-1 rounded text-xs font-bold"
                >
                  Got it
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div><span className="text-gray-500 block text-xs">Total Land Area</span><span className="font-bold text-gray-900">{farmerData?.land_area || "N/A"}</span></div>
              <div><span className="text-gray-500 block text-xs">Acreage</span><span className="font-bold text-gray-900">{farmerData?.acreage || 0} acres</span></div>
              <div><span className="text-gray-500 block text-xs">Ownership Status</span><span className="font-bold text-gray-900">{farmerData?.ownership_status || "Owned"}</span></div>
              <div><span className="text-gray-500 block text-xs">Document Type</span><span className="font-bold text-gray-900">{farmerData?.document_type || "Patta / Chitta"}</span></div>
              <div><span className="text-gray-500 block text-xs">Village / Town</span><span className="font-bold text-gray-900">{farmerData?.village || "N/A"}</span></div>
              <div><span className="text-gray-500 block text-xs">District</span><span className="font-bold text-gray-900">{farmerData?.district || "N/A"}</span></div>
              <div><span className="text-gray-500 block text-xs">State</span><span className="font-bold text-gray-900">{farmerData?.state || "Tamil Nadu"}</span></div>
              <div><span className="text-gray-500 block text-xs">Farm Size Category</span><span className="font-bold text-gray-900">{farmerData?.farm_size || "Small Farmer"}</span></div>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFICATION */}
        {profileTab === "verification" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0B6B3A]" /> Farmer Account Verification Status
            </h2>
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Verification Status:</span>
                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full">{farmerData?.verification_status || status}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Land Document Status:</span>
                <span className="font-bold text-gray-900">{farmerData?.document_path ? "Uploaded & Verified" : "Verified by Admin"}</span>
              </div>
              {farmerData?.admin_remarks && (
                <div className="pt-2 border-t border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-900">Admin Remarks: </span>
                  <span className="text-emerald-800">{farmerData.admin_remarks}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MY SELLING & HUB STOCK */}
        {profileTab === "selling" && (
          <div className="space-y-6">
            {/* Hub Stock Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0B6B3A]" /> AgriConnect City Hub Stock & Sales Summary
                </h2>
                <button
                  onClick={() => setShowHubModal(true)}
                  className="bg-[#0B6B3A] hover:bg-[#2E8B57] text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition"
                >
                  + Send Produce to Hub
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500 font-semibold block">Total Sent to Hub</span>
                  <span className="text-2xl font-extrabold text-gray-900">{summary.total_sent_kg || 0} kg</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500 font-semibold block">Confirmed Received</span>
                  <span className="text-2xl font-extrabold text-emerald-700">{summary.total_received_kg || 0} kg</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500 font-semibold block">Total Sold at Hub</span>
                  <span className="text-2xl font-extrabold text-blue-600">{summary.total_sold_kg || 0} kg</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500 font-semibold block">Hub Earnings</span>
                  <span className="text-2xl font-extrabold text-[#0B6B3A]">₹{summary.total_hub_earnings || 0}</span>
                </div>
              </div>

              {transfers.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="font-bold text-sm text-gray-700 mb-2">Products Sent to Hub</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 font-bold uppercase">
                        <th className="p-2">Item</th>
                        <th className="p-2">Hub</th>
                        <th className="p-2">Qty Sent</th>
                        <th className="p-2">Farmer Price</th>
                        <th className="p-2">Hub Price</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transfers.map((t: any) => (
                        <tr key={t.id}>
                          <td className="p-2 font-bold">{t.product_name}</td>
                          <td className="p-2 font-semibold text-emerald-800">{t.hub_id}</td>
                          <td className="p-2 font-bold">{t.quantity_sent} kg</td>
                          <td className="p-2">₹{t.farmer_price}/kg</td>
                          <td className="p-2 font-bold text-emerald-700">₹{t.hub_price}/kg</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              t.status === 'Confirmed Received' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Direct Produce Listings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Direct Marketplace Produce Listings</h2>
              {activeProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">No direct produce currently listed.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {activeProducts.map(p => (
                    <li key={p.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">Listed: {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700">₹{p.price}/{p.unit}</p>
                        <p className="text-xs text-gray-600">{p.quantity_available} {p.unit} available</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERY */}
        {profileTab === "delivery" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#0B6B3A]" /> Delivery Method Preferences
            </h2>
            <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span className="font-bold text-gray-800">1. Self Pickup by Consumer</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">Supported</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span className="font-bold text-gray-800">2. AgriConnect City Hub Delivery</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">Supported</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <span className="font-bold text-gray-800">3. Verified Local Delivery Partner</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">Supported</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ACCOUNT */}
        {profileTab === "account" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
            <div className="flex flex-col gap-3 max-w-md">
              <button onClick={() => alert("Notification preferences updated.")} className="w-full text-left p-3 border rounded-xl font-semibold hover:bg-gray-50 text-sm">
                Notifications Preferences
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="w-full text-left p-3 border border-red-200 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }



  const handleNavigate = (lat: number, lon: number) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsNavigating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        const destination = `${lat},${lon}`;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, "_blank");
        setIsNavigating(false);
      },
      () => {
        alert("Unable to retrieve your location for navigation. Please check your permissions.");
        setIsNavigating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/farmer-status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      alert("Failed to update status. Please try again.");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {status === 'Approved' && successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center shadow-sm">
           <CheckCircle className="w-5 h-5 mr-2" />
           {successMessage}
        </div>
      )}

      {hubTransferMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center shadow-sm font-semibold">
           <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
           {hubTransferMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between relative">
          <div>
            <button onClick={() => setShowProfile(true)} className="text-3xl font-bold text-primary flex items-center hover:opacity-80 transition-opacity">
              Welcome, {farmerName}
              {status === 'Approved' ? (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                </span>
              ) : status === 'Pending' ? (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-4 h-4 mr-1" /> Pending
                </span>
              ) : status === 'Correction Required' ? (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  <AlertTriangle className="w-4 h-4 mr-1" /> Correction Required
                </span>
              ) : (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-1" /> Rejected
                </span>
              )}
            </button>
            <p className="text-gray-600 mt-2">Manage your farm, inventory, and sales.</p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3 items-center">
            <div className="relative">
              <button onClick={handleNotificationClick} className="p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {notifications.map(n => (
                          <li key={n.id} className={`p-3 text-sm ${!n.is_read ? 'bg-blue-50' : ''}`}>
                            <p className="font-semibold text-gray-800">{n.title}</p>
                            <p className="text-gray-600 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsIVRModalOpen(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
            >
              <Phone className="w-4 h-4 mr-1.5" /> 📞 My IVR Access
            </button>

            <button
              type="button"
              onClick={() => setIsMarketModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
            >
              <BarChart2 className="w-4 h-4 mr-1.5" /> 🌾 Today's Market Analysis
            </button>

            {status !== 'Approved' ? (
                <button disabled className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md cursor-not-allowed">
                    <Plus className="w-5 h-5 mr-1" /> Add Product
                </button>
            ) : (
                <Link to="/farmer/add-product" className="bg-[#0B6B3A] hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors">
                    <Plus className="w-5 h-5 mr-1" /> Add Product
                </Link>
            )}
        </div>
      </header>

      {/* Unique Farmer IVR Identity Card */}
      <div className="mb-8 bg-white border border-blue-200 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">Unique Farmer IVR Identity</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                {ivrData?.status_label || "Demo / Ready for Provider Integration"}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {ivrData?.phone_independent_note || "Works on Basic Button Phones & Smartphones"}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-gray-700 flex-wrap">
              <div>
                <span className="text-gray-400 block text-[10px]">YOUR IVR ID</span>
                <span className="font-mono text-sm font-extrabold text-blue-900">{ivrData?.ivr_identifier || "IVR-FMR-XXXX"}</span>
              </div>
              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
              <div>
                <span className="text-gray-400 block text-[10px]">LINKED MOBILE</span>
                <span className="font-bold text-gray-900">{ivrData?.registered_mobile || farmerData?.users?.phone || "N/A"}</span>
              </div>
              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
              <div>
                <span className="text-gray-400 block text-[10px]">HELPLINE IVR NUMBER</span>
                <span className="font-bold text-gray-900">{ivrData?.ivr_phone_number || "1800-425-AGRI (1800-425-2474)"}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsIVRModalOpen(true)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm shrink-0"
        >
          <Phone className="w-4 h-4" /> View IVR Menu
        </button>
      </div>

      {status !== 'Approved' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col shadow-sm">
           <div className="flex items-center text-amber-900">
             <AlertTriangle className="w-5 h-5 mr-2 text-amber-600 shrink-0" />
             <span className="font-bold">
               {status === 'Pending' && "Your farmer account verification is pending admin review. Product listing is unavailable until approved."}
               {status === 'Correction Required' && "Your farmer account verification requires correction."}
               {status === 'Rejected' && "Your farmer account verification was rejected by admin."}
             </span>
           </div>
           {farmerData?.admin_remarks && (
             <p className="mt-2 ml-7 text-sm text-amber-800 font-medium">Admin Remarks: {farmerData.admin_remarks}</p>
           )}
        </div>
      )}


      {/* Bulk Request Contributions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" /> Incoming Bulk Request Contributions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bulkRequests.length === 0 ? (
            <div className="col-span-full p-6 bg-white border border-gray-100 rounded-xl shadow-sm text-center text-gray-500">
              No active bulk contribution requests.
            </div>
          ) : (
            bulkRequests.map(br => (
              <div key={br.contribution_id} className="bg-white border border-blue-100 rounded-xl shadow-sm p-5 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{br.product_name}</h3>
                    <p className="text-xs text-gray-500">Needed by: {br.date_needed}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    br.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    br.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {br.status}
                  </span>
                </div>

                <div className="bg-blue-50/60 p-3 rounded-lg text-xs space-y-1 mb-4 border border-blue-100">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Requested Contribution:</span>
                    <span className="font-bold text-green-700 text-sm">{br.requested_contribution} {br.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consumer Total Needed:</span>
                    <span className="font-semibold text-gray-800">{br.consumer_required_total} {br.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Price / Rate:</span>
                    <span className="font-semibold text-gray-800">₹{br.unit_price}/{br.unit}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200/60 font-bold text-sm">
                    <span className="text-blue-900">Your Contribution Earning:</span>
                    <span className="text-primary">₹{br.requested_contribution * br.unit_price}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  Area: {br.delivery_address?.city || br.delivery_address?.locality || "Coimbatore"}
                </p>

                {br.status === 'PENDING' && (
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleFarmerBulkResponse(br.bulk_request_id, 'ACCEPT')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-xs shadow transition-colors"
                    >
                      Accept ({br.requested_contribution} {br.unit})
                    </button>
                    <button 
                      onClick={() => handleFarmerBulkResponse(br.bulk_request_id, 'DECLINE')}
                      className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Farmer Delivery Orders */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <Truck className="w-6 h-6 mr-2 text-primary" /> Active Delivery Orders
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.filter(o => o.fulfillment_method === 'Farmer Delivery' && !['Completed', 'Delivered', 'Cancelled'].includes(o.status)).length === 0 ? (
            <div className="col-span-full p-6 bg-white border border-gray-100 rounded-xl shadow-sm text-center text-gray-500">
              No active delivery orders.
            </div>
          ) : (
            orders.filter(o => o.fulfillment_method === 'Farmer Delivery' && !['Completed', 'Delivered', 'Cancelled'].includes(o.status)).map(o => (
              <div key={o.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{o.users?.name || "Customer"}</h3>
                    <p className="text-sm text-gray-600">{o.products?.name} - {o.quantity} kg</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                    {o.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4 flex-1">
                  <div className="flex items-start">
  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" /> 
  <div>
    {o.delivery_address ? (
      <>
        <span className="font-bold text-gray-800">{o.delivery_address.full_name} • {o.delivery_address.mobile_number}</span>
        <span className="block text-gray-600 mt-1">{o.delivery_address.address_line}</span>
        <span className="block text-gray-600">{o.delivery_address.locality ? o.delivery_address.locality + ', ' : ''}{o.delivery_address.city}, {o.delivery_address.state} - {o.delivery_address.pincode}</span>
        {o.delivery_address.label && <span className="inline-block mt-1 bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{o.delivery_address.label}</span>}
      </>
    ) : "Address not provided"}
  </div>
</div>
                </div>

                <div className="mt-auto space-y-2">
                  {(() => {
                      let lat, lng;
                      try {
                        const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
                        lat = addr?.latitude;
                        lng = addr?.longitude;
                      } catch (e) {}
                      return lat && lng;
                    })() ? (
                    <button 
                      onClick={() => {
                        let lat, lng;
                        try {
                          const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
                          lat = addr?.latitude;
                          lng = addr?.longitude;
                        } catch (e) {}
                        handleNavigate(lat, lng);
                      }}
                      disabled={isNavigating}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors"
                    >
                      <Navigation className="w-4 h-4 mr-1" /> {isNavigating ? 'Locating...' : 'Navigate to Customer'}
                    </button>
                  ) : (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded text-center border border-orange-100">
                      Map location unavailable
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                          {o.status === 'Order Placed' && (
                            <button onClick={() => handleStatusUpdate(o.id, 'Preparing')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-semibold transition-colors">
                              Accept & Prepare
                            </button>
                          )}
                          {(o.status === 'Preparing' || o.status === 'Order Placed') && (
                            <button onClick={() => handleStatusUpdate(o.id, 'Out for Delivery')} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                              Start Delivery
                            </button>
                          )}
                      </div>
                      
                      {o.status === 'Out for Delivery' && (
                        <div className="w-full mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Ask the customer for the 4-digit delivery OTP</p>
                          {otpError && <p className="text-xs text-red-600 mb-2">{otpError}</p>}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              maxLength={4} 
                              placeholder="0000"
                              value={otpInputs[o.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setOtpInputs(prev => ({...prev, [o.id]: val}));
                              }}
                              className="w-20 text-center font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            />
                            <button 
                              onClick={() => handleVerifyOtp(o.id)} 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Verify Delivery OTP
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

            {/* Customer Reviews Section */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> Customer Reviews & Ratings
            </h2>
            <p className="text-sm text-gray-500 mt-1">Feedback from consumers who purchased your produce</p>
          </div>
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="text-3xl font-black text-green-800">{farmerReviews.average_rating > 0 ? farmerReviews.average_rating.toFixed(1) : "N/A"}</div>
            <div className="text-xs text-green-700">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(farmerReviews.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-bold mt-0.5 block">{farmerReviews.total_reviews} total reviews</span>
            </div>
          </div>
        </div>

        {farmerReviews.reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
            <p className="text-sm">No customer reviews received yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {farmerReviews.reviews.map((rev: any) => (
              <div key={rev.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{rev.review_text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales Overview */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Activity /></div>
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-primary"><TrendingUp /></div>
          <div>
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="text-2xl font-bold">{activeOrders}</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600"><Package /></div>
          <div>
            <p className="text-sm text-gray-500">Quantity Sold</p>
            <p className="text-2xl font-bold text-purple-600">{totalQuantitySold} kg</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 rounded-full text-accent"><DollarSign /></div>
          <div>
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-xl font-bold text-accent">₹{totalEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
         <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 px-2 flex justify-between">
                Recent Buyers / Customers
            </h2>
            <div className="flex-1 overflow-y-auto max-h-80">
              {orders.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                      <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p>No sales yet.</p>
                  </div>
              ) : (
                  <ul className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <li key={o.id} className="py-3 px-2">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-bold text-gray-800">{o.users?.name || "Customer"}</p>
                            <p className="text-sm text-gray-600">{o.products?.name} - {o.quantity} kg</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{o.status}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {o.fulfillment_method}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
              )}
            </div>
         </div>

         <div className="flex flex-col gap-8">
           <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Inventory</h2>
              {currentProduce.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                      <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p>No products added yet.</p>
                  </div>
              ) : (
                  <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {currentProduce.map(p => (
                      <li key={p.id} className="py-3 px-2 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          <p className="text-sm text-gray-500">₹{p.price} / {p.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{p.quantity_available} {p.unit}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
              )}
           </div>

           <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales Locations</h2>
              {salesLocations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                      <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p>No location data available yet.</p>
                  </div>
              ) : (
                  <div className="flex flex-wrap gap-2">
                    {salesLocations.map((loc, i) => (
                      <span key={i} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {loc}
                      </span>
                    ))}
                  </div>
              )}
           </div>
         </div>
      </div>

      {/* Send to Hub Modal */}
      {showHubModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowHubModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Package className="w-6 h-6 text-[#0B6B3A]" /> Send Produce to City Hub
            </h2>
            <p className="text-sm text-gray-600 mb-4">Transfer verified produce to AgriConnect City Hub for centralized distribution.</p>

            <form onSubmit={handleSendToHubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Produce from Inventory</label>
                <select 
                  value={selectedHubProductId} 
                  onChange={(e) => setSelectedHubProductId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  <option value="">-- Choose Produce --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.quantity_available} {p.unit} available @ ₹{p.price}/{p.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target AgriConnect City Hub</label>
                <select 
                  value={selectedCityHub} 
                  onChange={(e) => setSelectedCityHub(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="HUB-CBE-01">AgriConnect Coimbatore Central Hub (HUB-CBE-01)</option>
                  <option value="HUB-CHN-01">AgriConnect Chennai Metro Hub (HUB-CHN-01)</option>
                  <option value="HUB-MDU-01">AgriConnect Madurai Hub (HUB-MDU-01)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity to Transfer (kg)</label>
                <input 
                  type="number"
                  step="0.5"
                  min="1"
                  value={hubTransferQty}
                  onChange={(e) => setHubTransferQty(e.target.value)}
                  placeholder="Enter kg..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 space-y-1">
                <p className="font-bold">Transparent Pricing Breakdown</p>
                <p>• Your Farmer Price: ₹{products.find(p => p.id === selectedHubProductId)?.price || 0}/kg</p>
                <p>• Hub Operating Fee: ₹8.00/kg (Storage + Cold Chain + Logistics)</p>
                <p className="font-extrabold text-emerald-800">
                  • Consumer Price at Hub: ₹{((products.find(p => p.id === selectedHubProductId)?.price || 0) + 8).toFixed(2)}/kg
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowHubModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm">Cancel</button>
                <button type="submit" disabled={isSubmittingHubTransfer} className="flex-1 py-2.5 bg-[#0B6B3A] hover:bg-[#2E8B57] text-white rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                  {isSubmittingHubTransfer ? "Submitting..." : "Send Stock to Hub"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Market Analysis Modal */}
      <MarketAnalysisModal
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
      />

      {/* IVR Interactive Menu & Access Modal */}
      <FarmerIVRMenuModal
        isOpen={isIVRModalOpen}
        onClose={() => setIsIVRModalOpen(false)}
        ivrData={ivrData}
      />
    </div>
    </div>
  );
}

