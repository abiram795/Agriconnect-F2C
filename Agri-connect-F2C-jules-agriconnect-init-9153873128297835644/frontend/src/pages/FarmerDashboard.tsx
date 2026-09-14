import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, Users, ArrowLeft, History, Bell, MapPin, DollarSign, Activity, Navigation, Truck, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

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
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<string>("");

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
      const res = await fetch(`/api/farmers/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFarmerData(data);
      }
      
      const pRes = await fetch(`/api/farmers/${userId}/products`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
      }

      const oRes = await fetch(`/api/orders/farmer/${userId}`);
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
      }

      const nRes = await fetch(`/api/notifications/${userId}`);
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData);
      }

      const rRes = await fetch(`/api/reviews/FARMER/${userId}`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setFarmerReviews(rData);
      }

      const bRes = await fetch(`/api/bulk-requests/farmer/${userId}`);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBulkRequests(bData);
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
      const res = await fetch(`/api/bulk-requests/${requestId}/farmer-response`, {
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
      await fetch('/api/notifications/read', {
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
  const produceHistory = products.filter(p => p.status !== 'Available');
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
      const res = await fetch(`/api/orders/${orderId}/verify-otp`, {
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

  if (showProfile) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <button onClick={() => setShowProfile(false)} className="mb-6 flex items-center text-primary hover:underline font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-green-100 rounded-full text-primary">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{farmerName}</h1>
              <p className="text-gray-500">{farmerData?.village}, {farmerData?.district}</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1"/> {farmerData?.verification_status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500 block">Phone</span><span className="font-semibold">{farmerData?.users?.phone}</span></div>
            <div><span className="text-gray-500 block">Land Area</span><span className="font-semibold">{farmerData?.land_area}</span></div>
            <div><span className="text-gray-500 block">Acreage</span><span className="font-semibold">{farmerData?.acreage} acres</span></div>
            <div><span className="text-gray-500 block">Ownership</span><span className="font-semibold">{farmerData?.ownership_status}</span></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              <h2 className="text-lg font-bold text-gray-800">Currently Listed Produce</h2>
            </div>
            {currentProduce.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No vegetables currently listed.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {currentProduce.map(p => (
                  <li key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">Listed: {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{p.price}/{p.unit}</p>
                      <p className="text-sm text-gray-600">{p.quantity_available} {p.unit} <span className="text-green-600 font-semibold ml-2">• {p.status}</span></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center">
              <History className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-800">Produce History</h2>
            </div>
            {produceHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No produce history available.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {produceHistory.map(p => (
                  <li key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">Listed: {new Date(p.created_at).toLocaleDateString()}</p>
                      {p.completed_at && <p className="text-xs text-gray-400">Ended: {new Date(p.completed_at).toLocaleDateString()}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-600">₹{p.price}/{p.unit}</p>
                      <p className="text-sm text-gray-500">{p.quantity_available} {p.unit} <span className="text-gray-400 font-semibold ml-2">• {p.status}</span></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
      const res = await fetch(`/api/orders/${orderId}/farmer-status`, {
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

            {status !== 'Approved' ? (
                <button disabled className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md cursor-not-allowed">
                    <Plus className="w-5 h-5 mr-1" /> Add Product
                </button>
            ) : (
                <Link to="/farmer/add-product" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors">
                    <Plus className="w-5 h-5 mr-1" /> Add Product
                </Link>
            )}
        </div>
      </header>

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
    </div>
    </div>
  );
}

