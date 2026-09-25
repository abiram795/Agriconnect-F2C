import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, ShieldCheck, MapPin, Award, Truck, CheckCircle2, 
  Calendar, Sprout, Building2, User, Package
} from "lucide-react";
import { getApiUrl } from "../config/api";

export default function PublicFarmerProfile() {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!farmerId) return;
    fetchPublicProfile();
  }, [farmerId]);

  const fetchPublicProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl(`/api/farmers/${farmerId}/public`));
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError("Unable to load public farmer profile.");
      }
    } catch (err) {
      console.error("Error fetching public profile:", err);
      setError("Network error while loading farmer profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-semibold text-sm">Loading Verified Farmer Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border text-center max-w-md">
          <p className="text-red-600 font-bold mb-4">{error || "Farmer profile not found."}</p>
          <Link to="/marketplace" className="inline-flex items-center text-sm font-bold text-emerald-700 hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const initials = profile.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : "FM";

  const activeProducts = profile.active_products || [];
  const delPrefs = profile.delivery_preferences || {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link to="/marketplace" className="inline-flex items-center text-sm font-extrabold text-[#0B6B3A] hover:underline">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Marketplace
          </Link>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Public Verified Profile
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Profile Photo / Initials Avatar */}
              <div className="relative shrink-0">
                {profile.profile_photo ? (
                  <img
                    src={profile.profile_photo}
                    alt={profile.display_name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-emerald-100 text-[#0B6B3A] font-black text-3xl flex items-center justify-center">
                    {initials}
                  </div>
                )}
                {profile.verification_status === "Approved" && (
                  <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow" title="Verified Farmer">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Farmer Info */}
              <div className="text-center sm:text-left space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.display_name}</h1>
                  <span className="bg-amber-400 text-emerald-950 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ✓ Verified Farmer
                  </span>
                </div>
                
                <p className="text-emerald-100 text-sm font-medium flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  {profile.village}, {profile.district}, {profile.state}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-semibold text-emerald-100">
                  <span className="bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-300" /> {profile.farm_name}
                  </span>
                  <span className="bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-amber-300" /> {profile.farm_size}
                  </span>
                  <span className="bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" /> {profile.experience_years} Years Experience
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 bg-emerald-50/40 border-b border-gray-100 text-center text-xs">
            <div className="p-3">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Farming Method</span>
              <span className="font-extrabold text-emerald-900 text-sm">{profile.farming_method}</span>
            </div>
            <div className="p-3">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Primary Crops</span>
              <span className="font-extrabold text-gray-900 text-sm">{profile.primary_crops.slice(0, 3).join(", ")}</span>
            </div>
            <div className="p-3">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Member Since</span>
              <span className="font-extrabold text-gray-900 text-sm">{profile.joined_year}</span>
            </div>
            <div className="p-3">
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Trust Badge</span>
              <span className="font-extrabold text-emerald-700 text-sm flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Direct F2C
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: About Farmer */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#0B6B3A]" /> About the Farmer
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">{profile.about}</p>
        </div>

        {/* Section 2: Certifications & FPO Membership */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <Award className="w-5 h-5 text-amber-500" /> Organic Certifications
            </div>
            <p className="text-xs text-gray-600 font-semibold">{profile.certifications}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-blue-800 font-extrabold text-sm">
              <Building2 className="w-5 h-5 text-blue-600" /> FPO Collective Membership
            </div>
            <p className="text-xs text-gray-600 font-semibold">{profile.fpo_membership}</p>
          </div>
        </div>

        {/* Section 3: Delivery Options Accepted */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#0B6B3A]" /> Delivery Options Accepted by Farmer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between font-bold ${delPrefs.selfPickup ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <span>1. Self Pickup</span>
              {delPrefs.selfPickup ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-[10px]">Unavailable</span>}
            </div>
            <div className={`p-3.5 rounded-xl border flex items-center justify-between font-bold ${delPrefs.cityHubDelivery ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <span>2. City Hub Delivery</span>
              {delPrefs.cityHubDelivery ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-[10px]">Unavailable</span>}
            </div>
            <div className={`p-3.5 rounded-xl border flex items-center justify-between font-bold ${delPrefs.verifiedLocalDelivery ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <span>3. Local Partner</span>
              {delPrefs.verifiedLocalDelivery ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-[10px]">Unavailable</span>}
            </div>
          </div>
        </div>

        {/* Section 4: Available Crops & Marketplace Items */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0B6B3A]" /> Direct Marketplace Produce ({activeProducts.length})
            </h2>
            <Link to="/marketplace" className="text-xs font-bold text-emerald-700 hover:underline">
              View All Marketplace Crops →
            </Link>
          </div>

          {activeProducts.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm font-semibold">No active produce listed at this exact moment.</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon for fresh harvest updates!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProducts.map((p: any) => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-emerald-300 transition-colors">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">{p.name}</h3>
                    <p className="text-xs text-emerald-700 font-bold mt-0.5">₹{p.price} / {p.unit}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{p.quantity_available} {p.unit} available in stock</p>
                  </div>
                  <Link
                    to="/marketplace"
                    className="bg-[#0B6B3A] hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-colors"
                  >
                    Buy Direct
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
