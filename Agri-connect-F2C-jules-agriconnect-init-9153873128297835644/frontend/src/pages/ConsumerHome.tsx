import { Search, MapPin, AlertTriangle, Users, Image as ImageIcon, Bell, Clock, X, Star } from "lucide-react";
import { useState, useEffect } from "react";
import OrderModal from "../components/OrderModal";
import AddressForm from "../components/AddressForm";
import { getApiUrl } from "../config/api";

export default function ConsumerHome() {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [ratingFilter, setRatingFilter] = useState<string>("ALL");
  const [farmerRatings, setFarmerRatings] = useState<Record<string, { average_rating: number; total_reviews: number }>>({});

  const [notifications, setNotifications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [activeOtps, setActiveOtps] = useState<Record<string, string>>({});
  const [otpLoading, setOtpLoading] = useState<Record<string, boolean>>({});
  const [otpError, setOtpError] = useState<Record<string, string>>({});
  
  const [reviewModalTarget, setReviewModalTarget] = useState<{
    orderId: string;
    revieweeType: 'FARMER' | 'DELIVERY_PARTNER';
    revieweeId: string;
    targetName: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<Record<string, boolean>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const consumerId = localStorage.getItem("agriconnect_user_id") || "00000000-0000-0000-0000-000000000000";

  // Multi-Farmer Bulk Request state
  const [bulkRequests, setBulkRequests] = useState<any[]>([]);
  const [showMyBulkRequests, setShowMyBulkRequests] = useState(false);
  const [bulkProductId, setBulkProductId] = useState<string>("");
  const [bulkProductName, setBulkProductName] = useState<string>("");
  const [bulkQuantity, setBulkQuantity] = useState<number>(50);
  const [bulkUnit] = useState<string>("kg");
  const [bulkReason, setBulkReason] = useState<string>("Community Event / Function");
  const [bulkDateNeeded, setBulkDateNeeded] = useState<string>("");
  const [bulkSelectedAddressId, setBulkSelectedAddressId] = useState<string>("");
  const [bulkFulfillment, setBulkFulfillment] = useState<string>("Delivery Partner");

  useEffect(() => {
    fetchProducts();
    fetchNotifications();
    fetchOrders();
    fetchAddresses();
    fetchBulkRequests();
  }, [searchQuery]);

  const fetchBulkRequests = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/bulk-requests/consumer/${consumerId}`));
      if (res.ok) setBulkRequests(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/addresses/${consumerId}`));
      if (res.ok) setAddresses(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await fetch(getApiUrl(`/api/addresses/${id}`), { method: 'DELETE' });
      fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOtp = async (orderId: string) => {
    setOtpLoading(prev => ({ ...prev, [orderId]: true }));
    setOtpError(prev => ({ ...prev, [orderId]: "" }));
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/delivery-otp`));
      if (res.ok) {
        const data = await res.json();
        if (data && data.otp) {
          setActiveOtps(prev => ({ ...prev, [orderId]: String(data.otp) }));
        } else {
          setOtpError(prev => ({ ...prev, [orderId]: "OTP unavailable" }));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setOtpError(prev => ({ ...prev, [orderId]: errData.detail || "Failed to fetch OTP" }));
      }
    } catch (err) {
      console.error(err);
      setOtpError(prev => ({ ...prev, [orderId]: "Network error" }));
    } finally {
      setOtpLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };
  
  const generateNewOtp = async (orderId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/generate-otp`), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActiveOtps(prev => ({ ...prev, [orderId]: data.otp }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${consumerId}`));
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/orders/consumer/${consumerId}`));
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const url = searchQuery.trim() ? `/api/products/search?q=${encodeURIComponent(searchQuery.trim())}` : '/api/products';
      const res = await fetch(getApiUrl(url));
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        
        // Fetch farmer ratings for all products
        const uniqueFarmerIds = Array.from(new Set(data.map((p: any) => p.farmer_id || p.farmers?.user_id).filter(Boolean)));
        const ratingsMap: Record<string, { average_rating: number; total_reviews: number }> = {};
        
        await Promise.all(
          uniqueFarmerIds.map(async (fid) => {
            try {
              const rRes = await fetch(getApiUrl(`/api/reviews/FARMER/${fid}`));
              if (rRes.ok) {
                const rData = await rRes.json();
                ratingsMap[fid as string] = {
                  average_rating: rData.average_rating || 0.0,
                  total_reviews: rData.total_reviews || 0
                };
              }
            } catch (err) {
              console.error(err);
            }
          })
        );
        
        setFarmerRatings(ratingsMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleReviewSubmit = async () => {
    if (!reviewModalTarget) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(getApiUrl('/api/reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: reviewModalTarget.orderId,
          consumer_id: consumerId,
          reviewee_type: reviewModalTarget.revieweeType,
          reviewee_id: reviewModalTarget.revieweeId,
          rating: reviewRating,
          review_text: reviewText
        })
      });
      if (res.ok) {
        const key = `${reviewModalTarget.orderId}_${reviewModalTarget.revieweeType}`;
        setReviewSubmitted(prev => ({ ...prev, [key]: true }));
        setReviewModalTarget(null);
        setReviewText("");
        setSuccessMessage("Thank you! Your review has been submitted.");
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit review");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBulkSubmit = async () => {
    setIsSubmittingBulk(true);
    setErrorMessage("");
    try {
      const selAddr = addresses.find(a => a.id === bulkSelectedAddressId) || addresses[0] || {};
      const payload = {
        consumer_id: consumerId,
        product_id: bulkProductId || null,
        product_name: bulkProductName || "Fresh Produce",
        quantity_required: Number(bulkQuantity),
        unit: bulkUnit || "kg",
        reason: bulkReason,
        date_needed: bulkDateNeeded || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        delivery_address: selAddr,
        fulfillment_method: bulkFulfillment
      };

      const response = await fetch(getApiUrl('/api/bulk-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to submit bulk request');
      }

      const created = await response.json();
      setShowBulkModal(false);
      setSuccessMessage(`Bulk request submitted! Multi-farmer matching initiated for ${created.quantity_required} ${created.unit}.`);
      fetchBulkRequests();
      setShowMyBulkRequests(true);
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (error: any) {
      console.error('Error submitting bulk request:', error);
      setErrorMessage(error.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleConsumerBulkAction = async (requestId: string, action: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/bulk-requests/${requestId}/consumer-action`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumer_id: consumerId, action })
      });
      if (res.ok) {
        fetchBulkRequests();
        if (action === "CONVERT_TO_ORDER") {
          fetchOrders();
          setSuccessMessage("Bulk request converted to order! Fulfilling via selected method.");
          setTimeout(() => setSuccessMessage(""), 5000);
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Action failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative">
      <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Fresh & Local</h1>
          <p className="text-gray-600">Buy directly from farmers near you.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MapPin size={16} />
                <span>Current Location: Coimbatore (5km radius)</span>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setShowAddresses(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" /> My Addresses
                </button>
                <button onClick={() => setShowOrders(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4" /> Order History
                </button>
                <button onClick={() => { fetchBulkRequests(); setShowMyBulkRequests(true); }} className="relative flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-100 text-sm font-semibold text-blue-800">
                    <Users className="w-4 h-4 text-blue-600" /> My Bulk Requests
                    {bulkRequests.filter(r => r.status === 'FULLY_CONFIRMED' || r.status === 'PARTIALLY_CONFIRMED').length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {bulkRequests.filter(r => r.status === 'FULLY_CONFIRMED' || r.status === 'PARTIALLY_CONFIRMED').length}
                      </span>
                    )}
                </button>
                <button onClick={() => setShowNotifications(true)} className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Bell className="w-4 h-4" /> Notifications
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </button>
            </div>
        </div>
      </header>

      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
        <div className="flex items-start gap-3 text-blue-900">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-blue-600 mt-0.5" />
            <div>
                <p className="font-semibold text-sm">Direct Farmer Policy Active</p>
                <p className="text-xs mt-1">To prevent middlemen hoarding, normal purchases are limited to 10 kg per category per day.</p>
            </div>
        </div>
        <button onClick={() => setShowBulkModal(true)} className="flex items-center text-sm font-medium bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">
            <Users className="w-4 h-4 mr-2" /> Request Larger Quantity
        </button>
      </div>

      {successMessage && (
        <div className="mb-8 bg-green-50 text-green-800 p-4 rounded-xl border border-green-200">
           {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-8 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200">
           {errorMessage}
        </div>
      )}

      <div className="max-w-2xl mx-auto mb-12 relative">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="AI Search: 'I need 3 kg tomatoes near me at a fair price...'" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-lg shadow-sm"
            />
          </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Fresh Produce from Verified Farmers</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-medium text-gray-500 mr-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Filter Rating:
            </span>
            {[
              { label: "All", value: "ALL" },
              { label: "5.0 ★", value: "5.0" },
              { label: "4.0+ ★", value: "4.0+" },
              { label: "3.0+ ★", value: "3.0+" },
              { label: "No Rating", value: "NO_RATING" }
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setRatingFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  ratingFilter === f.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center p-8 text-gray-500">Loading live produce...</div>
        ) : products.length === 0 ? (
          <div className="text-center p-8 bg-card rounded-xl border border-gray-100 shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No products available yet</h3>
            <p className="text-gray-500 mt-1">Check back later for fresh produce in your area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => {
                const fid = p.farmer_id || p.farmers?.user_id;
                const rInfo = farmerRatings[fid] || { average_rating: 0, total_reviews: 0 };
                if (ratingFilter === "5.0") return rInfo.total_reviews > 0 && rInfo.average_rating >= 4.9;
                if (ratingFilter === "4.0+") return rInfo.total_reviews > 0 && rInfo.average_rating >= 4.0;
                if (ratingFilter === "3.0+") return rInfo.total_reviews > 0 && rInfo.average_rating >= 3.0;
                if (ratingFilter === "NO_RATING") return rInfo.total_reviews === 0;
                return true;
              })
              .map((p) => {
                const fid = p.farmer_id || p.farmers?.user_id;
                const rInfo = farmerRatings[fid] || { average_rating: 0, total_reviews: 0 };
                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="h-48 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      )}
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        Live Verified
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{p.name}</h3>
                        <p className="text-lg font-bold text-primary">₹{p.price}/{p.unit}</p>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4 flex-1">
                        <p className="flex items-center gap-1 mb-1">
                          <Users className="w-4 h-4" /> 
                          By: <span className="font-semibold">{p.farmers?.users?.name || "Farmer"}</span>
                        </p>
                        <div className="flex items-center gap-1 mb-1 text-xs">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          {rInfo.total_reviews > 0 ? (
                            <span className="font-medium text-gray-700">
                              {rInfo.average_rating.toFixed(1)} / 5.0 <span className="text-gray-400">({rInfo.total_reviews} reviews)</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">No ratings yet</span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 mb-1">
                          <MapPin className="w-4 h-4" /> 
                          {p.farmers?.village}, {p.farmers?.district}
                        </p>
                        <p className="mt-2 text-gray-500">Available: {p.quantity_available} {p.unit}</p>
                      </div>
                      
                      <button onClick={() => setSelectedProduct(p)} className="w-full py-3 bg-primary hover:bg-secondary text-white font-bold rounded-lg transition-colors">
                        Order Now
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {showBulkModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                  <button onClick={() => setShowBulkModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                      <X className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-600" /> Community / Bulk Request
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">Request larger quantities aggregated across nearby verified farmers.</p>

                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                      <p className="font-semibold">💡 Multi-Farmer Supply Aggregation Active</p>
                      <p className="mt-0.5">Need more than one farmer has in stock? AgriConnect automatically combines quantities from multiple nearby verified farmers to fulfill your request.</p>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Product / Produce</label>
                          <select 
                            value={bulkProductId} 
                            onChange={(e) => {
                              const sel = products.find(p => p.id === e.target.value);
                              setBulkProductId(e.target.value);
                              setBulkProductName(sel ? sel.name : "");
                            }}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          >
                              <option value="">-- Choose Active Produce or Enter Name Below --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (By: {p.farmers?.users?.name || "Farmer"} - Available: {p.quantity_available} {p.unit} @ ₹{p.price}/{p.unit})
                                </option>
                              ))}
                          </select>
                          {!bulkProductId && (
                            <input 
                              type="text"
                              placeholder="Or type produce name (e.g. Tomato, Onion, Potato)..."
                              value={bulkProductName}
                              onChange={(e) => setBulkProductName(e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm mt-2"
                            />
                          )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Required (kg)</label>
                              <input 
                                type="number" 
                                min="10"
                                value={bulkQuantity}
                                onChange={(e) => setBulkQuantity(Number(e.target.value))}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Date Needed</label>
                              <input 
                                type="date" 
                                value={bulkDateNeeded}
                                onChange={(e) => setBulkDateNeeded(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Bulk Request</label>
                          <select 
                            value={bulkReason}
                            onChange={(e) => setBulkReason(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          >
                              <option>Community Event / Function</option>
                              <option>Hostel / School</option>
                              <option>Temple / Local Organization</option>
                              <option>Restaurant / Commercial</option>
                              <option>Other</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Address</label>
                          <select
                            value={bulkSelectedAddressId}
                            onChange={(e) => setBulkSelectedAddressId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          >
                              {addresses.length === 0 ? (
                                <option value="">No saved address. Uses Primary Location.</option>
                              ) : (
                                addresses.map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.label || "Home"}: {a.address_line}, {a.city} - {a.pincode}
                                  </option>
                                ))
                              )}
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Fulfillment Method</label>
                          <select
                            value={bulkFulfillment}
                            onChange={(e) => setBulkFulfillment(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                          >
                              <option value="Delivery Partner">Delivery Partner (Standard Delivery)</option>
                              <option value="Farmer Delivery">Direct Farmer Delivery</option>
                              <option value="Self Pickup">Self Pickup from Farmers</option>
                          </select>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                          <button onClick={() => setShowBulkModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm">Cancel</button>
                          <button onClick={handleBulkSubmit} disabled={isSubmittingBulk} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm disabled:opacity-50 transition-colors">
                              {isSubmittingBulk ? "Submitting Request..." : "Submit Bulk Request"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showMyBulkRequests && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowMyBulkRequests(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" /> My Bulk Requests & Aggregation
            </h2>

            {bulkRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
                <p>No bulk requests submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bulkRequests.map(br => (
                  <div key={br.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{br.product_name}</h3>
                        <p className="text-xs text-gray-500">Reason: {br.reason} • Needed by: {br.date_needed}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        br.status === 'FULLY_CONFIRMED' ? 'bg-green-100 text-green-800 border border-green-200' :
                        br.status === 'PARTIALLY_CONFIRMED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        br.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                        br.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {br.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>Requested: {br.quantity_required} {br.unit}</span>
                        <span className="text-green-700">Confirmed: {br.confirmed_quantity} {br.unit}</span>
                        <span className="text-amber-700">Remaining: {br.remaining_quantity} {br.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (br.confirmed_quantity / br.quantity_required) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Transparent Price Breakdown */}
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Farmer Contributions & Price Breakdown</h4>
                      {br.farmer_contributions && br.farmer_contributions.length > 0 ? (
                        <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                          {br.farmer_contributions.map((c: any) => (
                            <div key={c.id} className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-semibold text-gray-800">{c.farmer_name}</span>
                                <span className="text-gray-500 ml-2">({c.confirmed_contribution || c.requested_contribution} {br.unit} @ ₹{c.unit_price}/{br.unit})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700">₹{(c.confirmed_contribution || c.requested_contribution) * c.unit_price}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  c.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                  c.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {c.status}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold">
                            <span>Estimated Total Cost</span>
                            <span className="text-primary text-base">₹{br.total_estimated_price}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Searching for nearby matching verified farmers...</p>
                      )}
                    </div>

                    {/* Action Controls */}
                    {br.status === 'PARTIALLY_CONFIRMED' && br.confirmed_quantity > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3 text-xs text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <p><strong>Partial Availability:</strong> {br.confirmed_quantity} {br.unit} is confirmed. {br.remaining_quantity} {br.unit} is still needed.</p>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => handleConsumerBulkAction(br.id, "ACCEPT_PARTIAL")}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded transition-colors"
                          >
                            Accept Available ({br.confirmed_quantity} {br.unit})
                          </button>
                          <button 
                            onClick={() => handleConsumerBulkAction(br.id, "CANCEL")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded transition-colors"
                          >
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    )}

                    {br.status === 'FULLY_CONFIRMED' && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-3 text-xs text-green-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <p><strong>100% Fully Confirmed!</strong> All {br.quantity_required} {br.unit} has been aggregated across verified farmers.</p>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => handleConsumerBulkAction(br.id, "CONVERT_TO_ORDER")}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow transition-colors"
                          >
                            Confirm & Place Order
                          </button>
                          <button 
                            onClick={() => handleConsumerBulkAction(br.id, "CANCEL")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-3 py-1.5 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {selectedProduct && (
        <OrderModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onSuccess={() => {
            setSelectedProduct(null);
            setSuccessMessage("Order placed successfully! You can track it in My Orders.");
            setTimeout(() => setSuccessMessage(""), 5000);
            fetchProducts();
            fetchOrders();
          }} 
        />
      )}

      
      {showAddresses && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowAddresses(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" /> My Saved Addresses
            </h2>
            
            {showAddressForm ? (
              <AddressForm
                consumerId={consumerId}
                existingAddress={editingAddress}
                onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
                onSuccess={() => { setShowAddressForm(false); setEditingAddress(null); fetchAddresses(); }}
              />
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">You can save up to 3 addresses.</p>
                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl">No addresses saved yet.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded uppercase">{addr.label}</span>
                            {addr.is_default && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">DEFAULT</span>}
                          </div>
                          <p className="font-bold text-gray-900 mt-2">{addr.full_name} • {addr.mobile_number}</p>
                          <p className="text-sm text-gray-600 mt-1">{addr.address_line}</p>
                          <p className="text-sm text-gray-600">{addr.locality ? addr.locality + ', ' : ''}{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }} className="text-sm text-blue-600 font-medium hover:underline">Edit</button>
                          <button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-600 font-medium hover:underline">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {addresses.length < 3 && (
                  <button onClick={() => { setEditingAddress(null); setShowAddressForm(true); }} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    + Add New Address
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showOrders && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowOrders(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-green-600" /> My Order History
            </h2>
            
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl">You haven't placed any orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{order.products?.name}</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            {order.fulfillment_method === 'Farmer Delivery' && order.status === 'Preparing' ? 'Farmer is preparing your order' : 
                             order.fulfillment_method === 'Farmer Delivery' && order.status === 'Out for Delivery' ? 'Farmer is on the way' : 
                             order.status}
                          </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Qty: {order.quantity} • Total: ₹{order.total_amount}</p>
                      <p className="text-xs text-gray-500">From: {order.users?.name || "Farmer"} • {new Date(order.created_at).toLocaleDateString()}</p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">{order.fulfillment_method}</p>
                        
                        {['Farmer Delivery', 'Delivery Partner'].includes(order.fulfillment_method) && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-xs text-blue-800 font-bold mb-2 tracking-wider">DELIVERY VERIFICATION</p>
                            {activeOtps[order.id] ? (
                              <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">Your Delivery OTP:</p>
                                <p className="text-3xl font-black tracking-[0.2em] text-blue-900 mb-1">{activeOtps[order.id]}</p>
                                <p className="text-xs text-blue-700 font-medium">Share this OTP with the delivery partner when your order reaches you.</p>
                                <button onClick={() => generateNewOtp(order.id)} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3"/> Request New Code</button>
                              </div>
                            ) : (
                              <div>
                                {otpError[order.id] && <p className="text-xs text-red-600 font-bold mb-2">{otpError[order.id]}</p>}
                                <button 
                                  onClick={() => fetchOtp(order.id)} 
                                  disabled={otpLoading[order.id]} 
                                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 transition-colors"
                                >
                                  {otpLoading[order.id] ? 'Fetching Code...' : 'View Delivery Code'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {['Delivered', 'Completed'].includes(order.status) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                            {order.fulfillment_method === 'Delivery Partner' && (
                              <button
                                disabled={reviewSubmitted[`${order.id}_DELIVERY_PARTNER`]}
                                onClick={() => setReviewModalTarget({
                                  orderId: order.id,
                                  revieweeType: 'DELIVERY_PARTNER',
                                  revieweeId: order.delivery_partner_id || order.deliveries?.[0]?.delivery_partner_id || "00000000-0000-0000-0000-000000000001",
                                  targetName: "Delivery Partner"
                                })}
                                className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                {reviewSubmitted[`${order.id}_DELIVERY_PARTNER`] ? '✓ Delivery Partner Reviewed' : 'Rate Delivery Partner'}
                              </button>
                            )}
                            <button
                              disabled={reviewSubmitted[`${order.id}_FARMER`]}
                              onClick={() => setReviewModalTarget({
                                orderId: order.id,
                                revieweeType: 'FARMER',
                                revieweeId: order.farmer_id || order.products?.farmer_id || "00000000-0000-0000-0000-000000000000",
                                targetName: order.users?.name || "Farmer"
                              })}
                              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                              {reviewSubmitted[`${order.id}_FARMER`] ? '✓ Farmer Reviewed' : 'Rate Farmer'}
                            </button>
                          </div>
                        )}
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowNotifications(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-green-600" /> Notifications
            </h2>
            
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl">No notifications.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map(notif => (
                  <div key={notif.id} className={`p-4 rounded-xl border ${notif.is_read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                    <h3 className={`text-sm font-bold ${notif.is_read ? 'text-gray-800' : 'text-blue-900'}`}>{notif.title}</h3>
                    <p className={`text-sm mt-1 ${notif.is_read ? 'text-gray-600' : 'text-blue-800'}`}>{notif.message}</p>
                    <p className="text-xs mt-2 text-gray-400">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {reviewModalTarget && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Review {reviewModalTarget.targetName}</h3>
              <button onClick={() => setReviewModalTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience (prompt delivery, fresh quality, polite service...)"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setReviewModalTarget(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={handleReviewSubmit} disabled={isSubmittingReview} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
