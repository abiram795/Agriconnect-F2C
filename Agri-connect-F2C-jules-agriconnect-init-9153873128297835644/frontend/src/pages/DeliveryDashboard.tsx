import { Truck, MapPin, Menu, Navigation, Package, Star, ShieldCheck, User, FileText, X, Check, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function DeliveryDashboard() {
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<string>("");

  // Hamburger Menu Drawer State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"license" | "reviews" | "personal" | "vehicle" | "history" | "earnings">("personal");

  // Profile & Reviews State
  const [profile, setProfile] = useState<any>({
    name: "",
    phone: "",
    email: "",
    address: "",
    service_area: "",
    vehicle_type: "Bike",
    vehicle_model: "",
    vehicle_number: "",
    driving_license_path: "",
    verification_status: "Verified"
  });
  const [reviewsData, setReviewsData] = useState<{ reviews: any[]; average_rating: number; total_reviews: number }>({
    reviews: [],
    average_rating: 0.0,
    total_reviews: 0
  });
  const [saveSuccess, setSaveSuccess] = useState("");

  const partnerId = localStorage.getItem("agriconnect_user_id");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!partnerId) return;
    setIsLoading(true);
    try {
      const [availRes, activeRes, earnRes, profRes, revRes] = await Promise.all([
        fetch(getApiUrl("/api/orders/available-deliveries")),
        fetch(getApiUrl(`/api/deliveries/partner/${partnerId}`)),
        fetch(getApiUrl(`/api/delivery/earnings/${partnerId}`)),
        fetch(getApiUrl(`/api/delivery/profile/${partnerId}`)),
        fetch(getApiUrl(`/api/reviews/DELIVERY_PARTNER/${partnerId}`))
      ]);

      if (availRes.ok) setAvailableDeliveries(await availRes.json());
      if (activeRes.ok) {
        const active = await activeRes.json();
        setActiveDelivery(active && active.length > 0 ? active[0] : null);
      }
      if (earnRes.ok) {
        const eData = await earnRes.json();
        setTotalEarnings(eData.total_earnings || 0);
        setCompletedDeliveries(eData.completed_orders || []);
      }
      if (profRes.ok) {
        const pData = await profRes.json();
        setProfile(pData);
      }
      if (revRes.ok) {
        const rData = await revRes.json();
        setReviewsData(rData);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleAcceptDelivery = async (_deliveryId: string, orderId: string) => {
    if (!partnerId) return;
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/assign-delivery`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_partner_id: partnerId }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to accept delivery");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, status: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/deliveries/${deliveryId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleVerifyOtp = async (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      setOtpError("Please enter a 4-digit OTP.");
      return;
    }
    setOtpError("");
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/verify-otp`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, farmer_id: partnerId })
      });

      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        setOtpError(data.detail || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setOtpError("An error occurred during verification");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return;
    setSaveSuccess("");
    try {
      const res = await fetch(getApiUrl(`/api/delivery/profile/${partnerId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setSaveSuccess("Profile updated successfully!");
        setTimeout(() => setSaveSuccess(""), 4000);
        fetchData();
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partnerId) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(getApiUrl(`/api/delivery/license/${partnerId}`), {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({ ...prev, driving_license_path: data.license_path }));
        alert("Driving license document updated successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (lat: number, lng: number) => {
    setIsNavigating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsNavigating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const originLat = position.coords.latitude;
        const originLng = position.coords.longitude;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lat},${lng}`, '_blank');
        setIsNavigating(false);
      },
      (_err) => {
        alert("Location permission is required for navigation.");
        setIsNavigating(false);
      },
      { timeout: 10000 }
    );
  };

  const renderAddress = (addressObj: any) => {
    try {
      const addr = typeof addressObj === 'string' ? JSON.parse(addressObj) : addressObj;
      if (!addr || !addr.address_line) return addressObj?.address_line || "Address not provided";
      return (
        <span className="text-sm text-slate-600 block mt-1">
          <span className="font-bold">{addr.full_name || addr.title || 'Customer'} {addr.mobile_number ? `• ${addr.mobile_number}` : ''}</span>
          <br/>{addr.address_line}
          <br/>{addr.locality ? addr.locality + ', ' : ''}{addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}
        </span>
      );
    } catch (e) {
      return addressObj?.address_line || addressObj || "Address not provided";
    }
  };

  if (!partnerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Partner Hub</h2>
          <p className="text-slate-500 mb-4">Please login to access your delivery dashboard.</p>
          <Link to="/delivery-login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium inline-block">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Truck className="w-6 h-6 mr-2 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Partner Hub</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600 hidden sm:inline">{profile.name || "Delivery Partner"}</span>
          <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">Home</Link>
        </div>
      </header>

      {/* Slide-over Hamburger Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                  {profile.name?.[0] || "D"}
                </div>
                <div>
                  <h3 className="font-bold text-base">{profile.name || "Delivery Partner"}</h3>
                  <p className="text-xs text-slate-400">{profile.phone}</p>
                </div>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-slate-800 rounded-md">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Menu Nav Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
              <button 
                onClick={() => setActiveTab("personal")}
                className={`py-3 border-b-2 ${activeTab === "personal" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("vehicle")}
                className={`py-3 border-b-2 ${activeTab === "vehicle" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Vehicle
              </button>
              <button 
                onClick={() => setActiveTab("license")}
                className={`py-3 border-b-2 ${activeTab === "license" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                License
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`py-3 border-b-2 ${activeTab === "reviews" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Reviews
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`py-3 border-b-2 ${activeTab === "history" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                History
              </button>
              <button 
                onClick={() => setActiveTab("earnings")}
                className={`py-3 border-b-2 ${activeTab === "earnings" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Earnings
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm font-medium flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" /> {saveSuccess}
                </div>
              )}

              {/* 1. PERSONAL DETAILS */}
              {activeTab === "personal" && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><User className="w-5 h-5 mr-2 text-blue-600"/> Personal Details</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
                    <input type="text" value={profile.name || ""} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mobile Number</label>
                    <input type="tel" value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                    <input type="email" value={profile.email || ""} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Address</label>
                    <input type="text" value={profile.address || ""} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Service Area (City / Pincode)</label>
                    <input type="text" value={profile.service_area || ""} onChange={e => setProfile({...profile, service_area: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm">Save Personal Details</button>
                </form>
              )}

              {/* 2. VEHICLE DETAILS */}
              {activeTab === "vehicle" && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><Truck className="w-5 h-5 mr-2 text-blue-600"/> Vehicle Details</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vehicle Type</label>
                    <select value={profile.vehicle_type || "Bike"} onChange={e => setProfile({...profile, vehicle_type: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="Bike">Bike / Two Wheeler</option>
                      <option value="Auto">Auto Rickshaw</option>
                      <option value="EV">Electric Scooter / EV</option>
                      <option value="Van">Delivery Van / Pickup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vehicle Model</label>
                    <input type="text" placeholder="e.g. Hero Splendor Plus" value={profile.vehicle_model || ""} onChange={e => setProfile({...profile, vehicle_model: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vehicle Registration Number</label>
                    <input type="text" placeholder="e.g. TN 37 AB 1234" value={profile.vehicle_number || ""} onChange={e => setProfile({...profile, vehicle_number: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm">Save Vehicle Details</button>
                </form>
              )}

              {/* 3. DRIVING LICENSE */}
              {activeTab === "license" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><FileText className="w-5 h-5 mr-2 text-blue-600"/> Driving License</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Verification Status</span>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> {profile.verification_status || "Verified"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p className="font-bold">License Path:</p>
                      <p className="font-mono text-xs text-slate-500 truncate">{profile.driving_license_path || "licenses/verified_license.pdf"}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Upload / Update Driving License</label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm font-bold text-slate-700">Click to upload document</span>
                      <span className="text-xs text-slate-400 mt-1">JPEG, PNG, or PDF up to 5MB</span>
                      <input type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              
              {/* 5. DELIVERY HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><Package className="w-5 h-5 mr-2 text-blue-600"/> Delivery History</h4>
                  {completedDeliveries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg">No completed deliveries yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {completedDeliveries.map((cd: any) => (
                        <div key={cd.order_id} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">Order #{cd.order_id.slice(0,8)}</p>
                              <p className="text-xs text-slate-400">{new Date(cd.date).toLocaleDateString()}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">₹{cd.fee}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-600">
                            <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-500"/> Dropoff: {renderAddress(cd.customer_address)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. EARNINGS */}
              {activeTab === "earnings" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><Star className="w-5 h-5 mr-2 text-yellow-500"/> Earnings Overview</h4>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs uppercase font-bold tracking-wider text-blue-100">Total Lifetime Earnings</p>
                    <p className="text-3xl font-black mt-1">₹{totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-blue-200 mt-2">Rate: ₹30 per completed delivery</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-sm font-semibold">
                    <span>Completed Deliveries</span>
                    <span className="text-blue-600 font-bold">{completedDeliveries.length}</span>
                  </div>
                </div>
              )}

              {/* 4. REVIEWS */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500"/> My Reviews</h4>
                  
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black flex items-center text-yellow-400">
                        {reviewsData.average_rating > 0 ? reviewsData.average_rating : "5.0"} <Star className="w-6 h-6 ml-1.5 fill-yellow-400 text-yellow-400" />
                      </p>
                      <p className="text-xs text-slate-300 mt-1">Average Customer Rating</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{reviewsData.total_reviews}</p>
                      <p className="text-xs text-slate-300">Total Reviews</p>
                    </div>
                  </div>

                  {reviewsData.reviews.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                      <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold">No reviews yet</p>
                      <p className="text-xs text-slate-400 mt-1">Complete deliveries to receive customer ratings & reviews.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviewsData.reviews.map((r: any) => (
                        <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1 text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                              ))}
                              <span className="font-bold text-xs text-slate-800 ml-1">{r.rating}.0</span>
                            </div>
                            <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 italic">"{r.review_text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${activeDelivery ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                <p className="font-bold text-slate-800">{activeDelivery ? 'On a Delivery' : 'Available for Delivery'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-green-600">₹{totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">₹30 per completed delivery</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Completed Deliveries</p>
            <p className="text-2xl font-bold text-slate-800">{completedDeliveries.length}</p>
          </div>
        </div>

        {activeDelivery && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center"><Navigation className="w-5 h-5 mr-2 text-blue-600"/> Active Route</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {activeDelivery.status}
              </span>
            </div>
            
            <div className="p-4">
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 relative">
                  <div className="absolute -left-3 top-4 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-xs">1</div>
                  <h3 className="font-bold text-orange-800 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Pickup: Farmer</h3>
                  <div className="text-sm text-orange-900">
                    <p className="font-bold">{activeDelivery.orders?.order_items?.[0]?.products?.farmers?.users?.name || "Farmer"}</p>
                    <p>{activeDelivery.orders?.order_items?.[0]?.products?.farmers?.farm_location || "Location not provided"}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 relative">
                  <div className="absolute -left-3 top-4 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-xs">2</div>
                  <h3 className="font-bold text-green-800 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Dropoff: Customer</h3>
                  {renderAddress(activeDelivery.orders?.delivery_address)}
                </div>
              </div>
              
              {activeDelivery.status !== 'Out for Delivery' && activeDelivery.status !== 'Delivered' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {activeDelivery.status === 'Accepted' && (
                    <button onClick={() => handleStatusUpdate(activeDelivery.id, 'Pickup')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors shadow-sm">
                      Reached Farmer (Pickup)
                    </button>
                  )}
                  {activeDelivery.status === 'Pickup' && (
                    <button onClick={() => handleStatusUpdate(activeDelivery.id, 'Out for Delivery')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors shadow-sm">
                      Start Delivery to Customer
                    </button>
                  )}
                </div>
              )}

              {activeDelivery.status === 'Out for Delivery' && (
                <div className="mt-2">
                  {(() => {
                      let lat, lng;
                      try {
                        const addr = typeof activeDelivery.orders?.delivery_address === 'string' ? JSON.parse(activeDelivery.orders.delivery_address) : activeDelivery.orders?.delivery_address;
                        lat = addr?.latitude;
                        lng = addr?.longitude;
                      } catch (e) {}
                      if (lat && lng) {
                        return (
                          <button 
                            onClick={() => handleNavigate(lat, lng)}
                            disabled={isNavigating}
                            className="w-full mb-4 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm"
                          >
                            <Navigation className="w-5 h-5 mr-2" /> {isNavigating ? 'Locating...' : 'Navigate to Customer'}
                          </button>
                        );
                      }
                      return (
                        <div className="mb-4 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg text-center border border-orange-100">
                          Customer map location is not available for this address.
                        </div>
                      );
                  })()}
                  
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <p className="text-sm font-bold text-blue-900 mb-3 text-center">Ask the customer for the 4-digit delivery OTP</p>
                    {otpError && <p className="text-xs font-bold text-red-600 mb-3 text-center bg-red-50 py-2 rounded-lg">{otpError}</p>}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-sm mx-auto">
                      <input 
                        type="text" 
                        maxLength={4} 
                        placeholder="0000"
                        value={otpInputs[activeDelivery.orders?.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setOtpInputs(prev => ({...prev, [activeDelivery.orders?.id]: val}));
                        }}
                        className="w-24 h-12 text-center text-xl font-black tracking-widest border-2 border-blue-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                      />
                      <button 
                        onClick={() => handleVerifyOtp(activeDelivery.orders?.id)} 
                        className="flex-1 w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Available Requests Near You</h2>
            </div>
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 font-medium">Refreshing deliveries...</div>
            ) : availableDeliveries.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="font-medium text-lg">No delivery requests right now.</p>
                <p className="text-sm mt-1">We'll notify you when new orders arrive.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableDeliveries.map(d => (
                  <div key={d.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-black text-slate-800 text-xl tracking-tight">Order #{d.order_id.slice(0,8)}</p>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">{d.status}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-orange-500 shrink-0"/> 
                          <div className="text-sm text-slate-600">
                            <span className="font-bold block text-slate-800">Pickup</span>
                            {d.orders?.order_items?.[0]?.products?.farmers?.farm_location || "Farmer Location"}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-500 shrink-0"/> 
                          <div className="text-sm text-slate-600">
                            <span className="font-bold block text-slate-800">Dropoff</span>
                            {(() => {
                              try {
                                const addr = typeof d.orders?.delivery_address === 'string' ? JSON.parse(d.orders.delivery_address) : d.orders?.delivery_address;
                                return addr?.locality ? `${addr.locality}, ${addr.city}` : (addr?.city || "Customer Area");
                              } catch (e) {
                                return "Customer Area";
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0">
                      <p className="font-black text-green-600 text-2xl mb-0 md:mb-3">₹30</p>
                      <button 
                        onClick={() => handleAcceptDelivery(d.id, d.order_id)}
                        disabled={!!activeDelivery}
                        className={`font-bold px-8 py-3 rounded-xl transition-all shadow-sm ${activeDelivery ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white'}`}
                      >
                        {activeDelivery ? 'Busy' : 'Accept Request'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Completed Deliveries History */}
        {completedDeliveries.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Completed Deliveries History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {completedDeliveries.map((cd: any) => (
                <div key={cd.order_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Order #{cd.order_id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-400">{new Date(cd.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600 text-lg">₹{cd.fee}</p>
                    <span className="text-xs text-slate-500 font-semibold">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
