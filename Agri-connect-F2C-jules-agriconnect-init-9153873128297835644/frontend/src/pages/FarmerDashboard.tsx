import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, Users, ArrowLeft, Bell, MapPin, DollarSign, Activity, Navigation, Truck, Star, X, BarChart2, Phone, Info, Camera, Eye, Edit } from "lucide-react";
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

  // Extended Profile & Photo State
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [editFarmName, setEditFarmName] = useState<string>("");
  const [editVillage, setEditVillage] = useState<string>("");
  const [editDistrict, setEditDistrict] = useState<string>("");
  const [editState, setEditState] = useState<string>("");
  const [editPincode, setEditPincode] = useState<string>("");
  const [editFarmSize, setEditFarmSize] = useState<string>("");
  const [editAcreage, setEditAcreage] = useState<string>("");
  const [editExperience, setEditExperience] = useState<string>("");
  const [editPrimaryCrops, setEditPrimaryCrops] = useState<string>("");
  const [editFarmingMethod, setEditFarmingMethod] = useState<string>("");
  const [editAbout, setEditAbout] = useState<string>("");
  const [editCertifications, setEditCertifications] = useState<string>("");
  const [editFPOMembership, setEditFPOMembership] = useState<string>("");
  const [editLanguages, setEditLanguages] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveNotice, setProfileSaveNotice] = useState<string>("");

  // Delivery Preferences State
  const [deliveryPrefs, setDeliveryPrefs] = useState<{
    selfPickup: boolean | null;
    cityHubDelivery: boolean | null;
    verifiedLocalDelivery: boolean | null;
  }>({
    selfPickup: null,
    cityHubDelivery: null,
    verifiedLocalDelivery: null,
  });
  const [isLoadingDeliveryPrefs, setIsLoadingDeliveryPrefs] = useState(true);
  const [savingPrefKey, setSavingPrefKey] = useState<string | null>(null);
  const [prefSaveNotice, setPrefSaveNotice] = useState<string>("");
  const [prefErrorNotice, setPrefErrorNotice] = useState<string>("");

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
        if (data) {
          setProfilePhoto(data.profile_photo || "");
          setEditName(data.users?.name || data.name || "Abiram S");
          setEditFarmName(data.farm_name || "Green Organic Farm");
          setEditVillage(data.village || "Saravanampatti");
          setEditDistrict(data.district || "Coimbatore");
          setEditState(data.state || "Tamil Nadu");
          setEditPincode(data.pincode || "641035");
          setEditFarmSize(data.farm_size || "5 Acres");
          setEditAcreage(data.acreage ? String(data.acreage) : "5");
          setEditExperience(data.experience_years ? String(data.experience_years) : "8");
          setEditPrimaryCrops(Array.isArray(data.primary_crops) ? data.primary_crops.join(", ") : (data.primary_crops || "Tomato, Onion, Coconut"));
          setEditFarmingMethod(data.farming_method || "Natural / Sustainable Organic Farming");
          setEditAbout(data.about || "Passionate farmer delivering fresh, locally grown chemical-free produce directly from farm to consumers.");
          setEditCertifications(data.certifications || "Certified Organic Farmer (TN-ORG-882)");
          setEditFPOMembership(data.fpo_membership || "Coimbatore Farmer Producer Company (FPO)");
          setEditLanguages(data.languages || "Tamil, English");

          if (data.delivery_preferences) {
            setDeliveryPrefs(data.delivery_preferences);
          }
        }
        setIsLoadingDeliveryPrefs(false);
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

  const updateDeliveryPreference = async (
    key: 'selfPickup' | 'cityHubDelivery' | 'verifiedLocalDelivery',
    value: boolean
  ) => {
    const previousPrefs = { ...deliveryPrefs };
    const updatedPrefs = { ...deliveryPrefs, [key]: value };

    // 1. Optimistic UI update
    setDeliveryPrefs(updatedPrefs);
    setSavingPrefKey(key);
    setPrefSaveNotice("Saving preference...");
    setPrefErrorNotice("");

    try {
      const userId = localStorage.getItem('agriconnect_user_id');
      const res = await fetch(getApiUrl(`/api/farmers/${userId}/delivery-preferences`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrefs)
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.delivery_preferences) {
          setDeliveryPrefs(resData.delivery_preferences);
        }
        setPrefSaveNotice("Delivery preference updated.");
        setTimeout(() => setPrefSaveNotice(""), 3000);
      } else {
        throw new Error("Failed to save delivery preferences");
      }
    } catch (err) {
      console.error("Error updating delivery preference:", err);
      // Revert UI to previous saved value
      setDeliveryPrefs(previousPrefs);
      setPrefErrorNotice("Failed to save delivery preference. Please try again.");
      setPrefSaveNotice("");
      setTimeout(() => setPrefErrorNotice(""), 4000);
    } finally {
      setSavingPrefKey(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const userId = localStorage.getItem('agriconnect_user_id');
      const payload = {
        name: editName,
        profile_photo: profilePhoto,
        farm_name: editFarmName,
        village: editVillage,
        district: editDistrict,
        state: editState,
        pincode: editPincode,
        farm_size: editFarmSize,
        acreage: editAcreage ? parseFloat(editAcreage) : 5.0,
        experience_years: editExperience ? parseInt(editExperience) : 8,
        primary_crops: editPrimaryCrops ? editPrimaryCrops.split(',').map(s => s.trim()) : [],
        farming_method: editFarmingMethod,
        about: editAbout,
        certifications: editCertifications,
        fpo_membership: editFPOMembership,
        languages: editLanguages
      };

      const res = await fetch(getApiUrl(`/api/farmers/${userId}/profile`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setFarmerData(data);
        setProfileSaveNotice("Profile updated successfully!");
        setTimeout(() => setProfileSaveNotice(""), 4000);
        fetchData();
      } else {
        alert("Failed to save profile updates.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("An error occurred while saving profile.");
    } finally {
      setIsSavingProfile(false);
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                {profilePhoto || farmerData?.profile_photo ? (
                  <img
                    src={profilePhoto || farmerData?.profile_photo}
                    alt={farmerName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-emerald-100 shadow-md bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 text-[#0B6B3A] font-black text-2xl flex items-center justify-center border-4 border-emerald-100 shadow-md">
                    {farmerName ? farmerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "AS"}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-full cursor-pointer shadow-md transition-all">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{farmerName}</h1>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600"/> {farmerData?.verification_status || status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-500 mt-1">{farmerData?.village || editVillage}, {farmerData?.district || editDistrict}, {farmerData?.state || editState}</p>
                <p className="text-xs text-emerald-800 font-bold mt-1">🌾 {editFarmName} • {editFarmSize}</p>
              </div>
            </div>

            {/* Profile Completion Meter & Public Profile Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
                  <span>Profile Completion</span>
                  <span className="text-[#0B6B3A] font-black">{farmerData?.completion?.percentage || 70}% ({farmerData?.completion?.status_label || "Almost Complete"})</span>
                </div>
                <div className="w-44 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#0B6B3A] h-full rounded-full transition-all duration-500" style={{ width: `${farmerData?.completion?.percentage || 70}%` }}></div>
                </div>
              </div>

              <Link
                to={`/farmer/profile/${localStorage.getItem('agriconnect_user_id')}`}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Eye className="w-4 h-4" /> Preview Public Profile
              </Link>
            </div>

          </div>

          {/* Profile Section Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-4">
            <button
              onClick={() => setProfileTab("profile")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${profileTab === "profile" ? "bg-[#0B6B3A] text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              MY PROFILE & EDIT
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

        {/* TAB 1: MY PROFILE & EDIT FORM */}
        {profileTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0B6B3A]" /> Edit Farmer Profile
                </h2>
                <p className="text-xs text-gray-500 mt-1">Keep your public farmer identity up to date for buyers and partners.</p>
              </div>
              {profileSaveNotice && (
                <span className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> {profileSaveNotice}
                </span>
              )}
            </div>

            {/* Photo Upload Section */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-600 shadow" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0B6B3A] font-black text-xl flex items-center justify-center border-2 border-emerald-600">
                  {farmerName ? farmerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "AS"}
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-extrabold text-sm text-gray-900">Farmer Profile Photo</p>
                <p className="text-xs text-gray-500">Upload a clean headshot photo (Max 5MB, JPG/PNG format).</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="bg-[#0B6B3A] hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  {profilePhoto && (
                    <button type="button" onClick={() => setProfilePhoto("")} className="text-xs font-bold text-red-600 hover:underline">
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION A — PERSONAL INFORMATION */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 border-b pb-1">Section A — Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
                  <input type="text" disabled value={farmerData?.users?.phone || "8667090635"} className="w-full p-2.5 border border-gray-200 bg-gray-100 rounded-xl text-sm font-semibold text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Languages</label>
                  <input type="text" value={editLanguages} onChange={e => setEditLanguages(e.target.value)} placeholder="e.g. Tamil, English" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            {/* SECTION B — FARM INFORMATION */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 border-b pb-1">Section B — Farm Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Farm Name</label>
                  <input type="text" value={editFarmName} onChange={e => setEditFarmName(e.target.value)} placeholder="e.g. Green Organic Farm" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Village / Locality</label>
                  <input type="text" value={editVillage} onChange={e => setEditVillage(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                  <input type="text" value={editDistrict} onChange={e => setEditDistrict(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input type="text" value={editState} onChange={e => setEditState(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code</label>
                  <input type="text" value={editPincode} onChange={e => setEditPincode(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Acreage (Acres)</label>
                  <input type="text" value={editAcreage} onChange={e => setEditAcreage(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Farming Experience (Years)</label>
                  <input type="number" value={editExperience} onChange={e => setEditExperience(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Farming Method</label>
                  <select value={editFarmingMethod} onChange={e => setEditFarmingMethod(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500">
                    <option value="Natural / Sustainable Organic Farming">Natural / Sustainable Organic</option>
                    <option value="Certified Organic">Certified Organic</option>
                    <option value="Conventional Farming">Conventional Farming</option>
                    <option value="Hydroponic / High Tech">Hydroponic / Protected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Primary Crops (comma separated)</label>
                  <input type="text" value={editPrimaryCrops} onChange={e => setEditPrimaryCrops(e.target.value)} placeholder="Tomato, Onion, Coconut" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            {/* SECTION C — FARMER DETAILS & BIO */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 border-b pb-1">Section C — Farmer Details & Biography</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">About the Farmer (Public Biography)</label>
                  <textarea rows={3} value={editAbout} onChange={e => setEditAbout(e.target.value)} placeholder="Write a short introduction about your farming story..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Certifications</label>
                    <input type="text" value={editCertifications} onChange={e => setEditCertifications(e.target.value)} placeholder="e.g. Certified Organic Farmer" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">FPO Membership</label>
                    <input type="text" value={editFPOMembership} onChange={e => setEditFPOMembership(e.target.value)} placeholder="e.g. Coimbatore Organic FPO" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
              <Link to={`/farmer/profile/${localStorage.getItem('agriconnect_user_id')}`} className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
                <Eye className="w-4 h-4" /> Preview Public View
              </Link>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-[#0B6B3A] hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-2"
              >
                {isSavingProfile ? "Saving Profile..." : "Save Profile Updates"}
              </button>
            </div>
          </form>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-6 h-6 text-[#0B6B3A]" /> Delivery Method Preferences
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose which delivery methods you are willing to accept for your farm produce.
                </p>
              </div>
              {prefSaveNotice && (
                <span className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-pulse shadow-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> {prefSaveNotice}
                </span>
              )}
              {prefErrorNotice && (
                <span className="px-3.5 py-1.5 bg-red-100 border border-red-300 text-red-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> {prefErrorNotice}
                </span>
              )}
            </div>

            {isLoadingDeliveryPrefs ? (
              <div className="p-10 text-center text-gray-500 font-semibold space-y-3">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm">Loading delivery preferences...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Method 1: Self Pickup */}
                <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:border-emerald-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 text-[#0B6B3A] rounded-xl border border-emerald-100">
                          <User className="w-5 h-5" />
                        </span>
                        <h3 className="font-extrabold text-base text-gray-900">
                          🚚 1. Self Pickup by Consumer
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-gray-600 pl-9">
                        Allow customers to collect the order directly from my farm location.
                      </p>
                    </div>

                    {/* Segmented Controls */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => updateDeliveryPreference('selfPickup', true)}
                        disabled={savingPrefKey === 'selfPickup'}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          deliveryPrefs.selfPickup === true
                            ? "bg-[#0B6B3A] text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Yes, I'm willing
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDeliveryPreference('selfPickup', false)}
                        disabled={savingPrefKey === 'selfPickup'}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          deliveryPrefs.selfPickup === false
                            ? "bg-red-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> No
                      </button>
                    </div>
                  </div>
                  {deliveryPrefs.selfPickup === null && (
                    <div className="ml-9 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Preference not configured yet. Please choose if you are willing to support self pickup.</span>
                    </div>
                  )}
                </div>

                {/* Method 2: City Hub Delivery */}
                <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:border-emerald-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                          <Navigation className="w-5 h-5" />
                        </span>
                        <h3 className="font-extrabold text-base text-gray-900">
                          🏢 2. AgriConnect City Hub Delivery
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-gray-600 pl-9">
                        I am willing to send my produce through the AgriConnect city hub.
                      </p>
                    </div>

                    {/* Segmented Controls */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => updateDeliveryPreference('cityHubDelivery', true)}
                        disabled={savingPrefKey === 'cityHubDelivery'}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          deliveryPrefs.cityHubDelivery === true
                            ? "bg-[#0B6B3A] text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Yes, I'm willing
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDeliveryPreference('cityHubDelivery', false)}
                        disabled={savingPrefKey === 'cityHubDelivery'}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          deliveryPrefs.cityHubDelivery === false
                            ? "bg-red-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> No
                      </button>
                    </div>
                  </div>
                  {deliveryPrefs.cityHubDelivery === null && (
                    <div className="ml-9 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Preference not configured yet. Please choose if you are willing to support City Hub delivery.</span>
                    </div>
                  )}
                </div>

                {/* Method 3: Verified Local Delivery Partner */}
                <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 hover:border-emerald-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
                          <Truck className="w-5 h-5" />
                        </span>
                        <h3 className="font-extrabold text-base text-gray-900">
                          🚚 3. Verified Local Delivery Partner
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-gray-600 pl-9">
                        I am willing to use a verified local delivery partner.
                      </p>
                    </div>

                    {/* Segmented Controls */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => updateDeliveryPreference('verifiedLocalDelivery', true)}
                        disabled={savingPrefKey === 'verifiedLocalDelivery'}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          deliveryPrefs.verifiedLocalDelivery === true
                            ? "bg-[#0B6B3A] text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Yes, I'm willing
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDeliveryPreference('verifiedLocalDelivery', false)}
                        disabled={savingPrefKey === 'verifiedLocalDelivery'}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          deliveryPrefs.verifiedLocalDelivery === false
                            ? "bg-red-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> No
                      </button>
                    </div>
                  </div>
                  {deliveryPrefs.verifiedLocalDelivery === null && (
                    <div className="ml-9 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Preference not configured yet. Please choose if you are willing to use local delivery partners.</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2.5 mt-4">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Your delivery preferences will be used when matching orders and delivery options.
                  </span>
                </div>
              </div>
            )}
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

        {/* Header with Circular Profile Photo Avatar */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowProfile(true)} className="relative group shrink-0" title="Click to view & edit profile photo">
              {profilePhoto || farmerData?.profile_photo ? (
                <img
                  src={profilePhoto || farmerData?.profile_photo}
                  alt={farmerName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-600 shadow-md group-hover:scale-105 transition-transform bg-white"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-[#0B6B3A] font-black text-xl flex items-center justify-center border-2 border-emerald-600 shadow-md group-hover:scale-105 transition-transform">
                  {farmerName ? farmerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : "AS"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                <Camera className="w-4 h-4" />
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowProfile(true)} className="text-2xl sm:text-3xl font-extrabold text-primary hover:opacity-80 transition-opacity">
                  Welcome, {farmerName}
                </button>
                {status === 'Approved' ? (
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-800 border border-green-200">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> {status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-semibold flex-wrap">
                <span>{farmerData?.village || "Saravanampatti"}, {farmerData?.district || "Coimbatore"}</span>
                <span>•</span>
                <button onClick={() => setShowProfile(true)} className="text-[#0B6B3A] hover:underline font-bold flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit Profile
                </button>
                <span>•</span>
                <Link to={`/farmer/profile/${localStorage.getItem('agriconnect_user_id')}`} className="text-blue-700 hover:underline font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View Public Profile
                </Link>
              </div>
            </div>
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

            <Link
              to="/farmer/decision-center"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors animate-pulse"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" /> ⚡ Decision Center
            </Link>

            <button
              type="button"
              onClick={() => setIsIVRModalOpen(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
            >
              <Phone className="w-4 h-4 mr-1.5" /> 📞 My IVR Access
            </button>

            <Link
              to="/farmer/price-discovery"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
            >
              <BarChart2 className="w-4 h-4 mr-1.5" /> AI Price Discovery
            </Link>

            <Link
              to="/farmer/buyers"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
            >
              <Users className="w-4 h-4 mr-1.5" /> Smart Buyer Match
            </Link>

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

      {/* Profile Completion Bar Banner */}
      {(farmerData?.completion?.percentage || 70) < 100 && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center border border-amber-300 shrink-0">
              {farmerData?.completion?.percentage || 70}%
            </div>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Complete your farmer profile ({farmerData?.completion?.percentage || 70}%)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Add profile photo, farm details, and primary crops to gain trust badges and rank higher for verified buyers.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowProfile(true); setProfileTab("profile"); }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow transition-colors shrink-0"
          >
            Complete Profile →
          </button>
        </div>
      )}

      {/* SIH26132 Hero Banner Callout */}
      <div className="mb-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              SIH26132 Flagship Feature
            </span>
            <span className="bg-emerald-700/60 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
              Real-Time Decision Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Smart Market Linkage & Net Realisation Decision Center
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Get instant AI recommendations on <strong className="text-amber-300">Where to sell</strong>, <strong className="text-amber-300">When to sell</strong>, and <strong className="text-amber-300">Net profit earnings</strong> after transport, grading, storage & commission deductions.
          </p>
        </div>
        <Link
          to="/farmer/decision-center"
          className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-base px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-amber-400/20 transition-all flex items-center gap-2 shrink-0 group"
        >
          <span>Launch Decision Center</span>
          <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

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
                {ivrData?.status_label || "IVR Active & Ready"}
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

      {/* SIH26132 Main Dashboard Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/farmer/price-discovery" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-700" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Price Discovery</h3>
          <p className="text-sm text-gray-500">AI-powered market analysis and profit estimation.</p>
        </Link>

        <Link to="/farmer/buyers" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-700" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Buyer Matching</h3>
          <p className="text-sm text-gray-500">Connect with verified buyers matching your produce.</p>
        </Link>

        <Link to="/farmer/listings" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Crop Listings</h3>
          <p className="text-sm text-gray-500">Manage your active listings and inventory.</p>
        </Link>
        
        <Link to="/calculator" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-purple-700" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Net Profit Calculator</h3>
          <p className="text-sm text-gray-500">Calculate revenue after transport & packaging.</p>
        </Link>
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
        onSuccess={fetchData}
      />
    </div>
    </div>
  );
}

