import { useState, useEffect } from "react";
import { 
  ArrowLeft, Package, Plus, Search, 
  CheckCircle2, PauseCircle, PlayCircle, CheckSquare, Trash2, 
  Edit3, Eye, Sparkles, MapPin, AlertCircle, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function FarmerListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  // Form Fields
  const [cropName, setCropName] = useState("Tomato");
  const [category, setCategory] = useState("Vegetables");
  const [variety, setVariety] = useState("Hybrid Red Vaishnavi");
  const [quantity, setQuantity] = useState("500");
  const [unit, setUnit] = useState("kg");
  const [expectedPrice, setExpectedPrice] = useState("38");
  const [minimumPrice, setMinimumPrice] = useState("32");
  const [qualityGrade, setQualityGrade] = useState("Grade A");
  const [qualityDescription, setQualityDescription] = useState("Firm skin, deep red color, uniform size, zero pest damage.");
  const [harvestDate, setHarvestDate] = useState("2026-09-24");
  const [availableFrom, setAvailableFrom] = useState("2026-09-25");
  const [location, setLocation] = useState("Annur Farm Gate");
  const [district, setDistrict] = useState("Coimbatore");
  const [state, setState] = useState("Tamil Nadu");
  const [description, setDescription] = useState("Freshly harvested premium hybrid tomatoes directly from farm gate.");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600");
  const [isOrganic, setIsOrganic] = useState(true);
  const [farmingMethod, setFarmingMethod] = useState("Drip Irrigated Organic");
  const [preferredBuyerType, setPreferredBuyerType] = useState("All Buyers");
  const [preferredMarket, setPreferredMarket] = useState("Farm Gate / Direct F2C");
  const [maxDistanceKm, setMaxDistanceKm] = useState("50");

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [searchQuery, categoryFilter, statusFilter, gradeFilter, sortBy]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchListings = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const farmerId = localStorage.getItem("agriconnect_user_id") || "f0000000-0000-0000-0000-000000000001";
      const params = new URLSearchParams();
      params.append("farmer_id", farmerId);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (gradeFilter !== "all") params.append("quality_grade", gradeFilter);
      if (sortBy) params.append("sort_by", sortBy);

      const res = await fetch(getApiUrl(`/api/crop-listings?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      } else {
        setErrorMessage("Failed to load crop listings from database.");
      }
    } catch (err) {
      console.error("Error loading crop listings:", err);
      setErrorMessage("Network error connecting to database service.");
    } fontally: {
      setIsLoading(false);
    }
  };

  // Preset Image Options for Easy Selection
  const sampleImages = [
    { label: "Tomatoes", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600" },
    { label: "Red Onions", url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=600" },
    { label: "Potatoes", url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600" },
    { label: "Fresh Carrots", url: "https://images.unsplash.com/photo-1598170845058-12ef4a457c7d?w=600" },
    { label: "Green Cabbage", url: "https://images.unsplash.com/photo-1550081698-771605439daf?w=600" }
  ];

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormError("");
    setCropName("Tomato");
    setCategory("Vegetables");
    setVariety("Hybrid Red Vaishnavi");
    setQuantity("500");
    setUnit("kg");
    setExpectedPrice("38");
    setMinimumPrice("32");
    setQualityGrade("Grade A");
    setQualityDescription("Firm skin, deep red color, uniform size, zero pest damage.");
    setHarvestDate("2026-09-24");
    setAvailableFrom("2026-09-25");
    setLocation("Annur Farm Gate");
    setDistrict("Coimbatore");
    setState("Tamil Nadu");
    setDescription("Freshly harvested premium hybrid tomatoes directly from farm gate.");
    setImageUrl("https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600");
    setIsOrganic(true);
    setFarmingMethod("Drip Irrigated Organic");
    setPreferredBuyerType("All Buyers");
    setPreferredMarket("Farm Gate / Direct F2C");
    setMaxDistanceKm("50");
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormError("");
    setCropName(item.crop_name || "Tomato");
    setCategory(item.category || "Vegetables");
    setVariety(item.variety || "Standard");
    setQuantity(item.quantity?.toString() || "100");
    setUnit(item.unit || "kg");
    setExpectedPrice(item.expected_price?.toString() || "0");
    setMinimumPrice(item.minimum_price?.toString() || "0");
    setQualityGrade(item.quality_grade || "Grade A");
    setQualityDescription(item.quality_description || "");
    setHarvestDate(item.harvest_date || "");
    setAvailableFrom(item.available_from || "");
    setLocation(item.location || "");
    setDistrict(item.district || "");
    setState(item.state || "");
    setDescription(item.description || "");
    setImageUrl(item.image_url || sampleImages[0].url);
    setIsOrganic(item.is_organic || false);
    setFarmingMethod(item.farming_method || "Conventional");
    setPreferredBuyerType(item.preferred_buyer_type || "All Buyers");
    setPreferredMarket(item.preferred_market || "Farm Gate / Direct F2C");
    setMaxDistanceKm(item.max_delivery_distance_km?.toString() || "50");

    setIsFormOpen(true);
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const q = parseFloat(quantity);
    const expP = parseFloat(expectedPrice);
    const minP = parseFloat(minimumPrice);
    const maxDist = parseFloat(maxDistanceKm) || 50;

    if (!cropName.trim()) { setFormError("Crop Name is required."); return; }
    if (isNaN(q) || q <= 0) { setFormError("Quantity must be a positive number greater than 0."); return; }
    if (isNaN(expP) || expP <= 0) { setFormError("Expected Price must be greater than 0."); return; }
    if (isNaN(minP) || minP < 0) { setFormError("Minimum Price cannot be negative."); return; }
    if (minP > expP) { setFormError("Minimum acceptable price cannot exceed expected price."); return; }
    if (!harvestDate) { setFormError("Harvest Date is required."); return; }
    if (!location.trim() || !district.trim()) { setFormError("Location and District are required."); return; }

    setIsSubmitting(true);
    try {
      const farmerId = localStorage.getItem("agriconnect_user_id") || "f0000000-0000-0000-0000-000000000001";
      const payload = {
        farmer_id: farmerId,
        crop_name: cropName.trim(),
        category: category,
        variety: variety.trim(),
        quantity: q,
        unit: unit,
        expected_price: expP,
        minimum_price: minP,
        quality_grade: qualityGrade,
        quality_description: qualityDescription.trim(),
        harvest_date: harvestDate,
        available_from: availableFrom || harvestDate,
        location: location.trim(),
        district: district.trim(),
        state: state.trim() || "Tamil Nadu",
        description: description.trim(),
        image_url: imageUrl,
        is_organic: isOrganic,
        farming_method: farmingMethod,
        preferred_buyer_type: preferredBuyerType,
        preferred_market: preferredMarket,
        max_delivery_distance_km: maxDist
      };

      const url = isEditing ? getApiUrl(`/api/crop-listings/${editingId}`) : getApiUrl("/api/crop-listings");
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedItem = await res.json();
        showToast(isEditing ? `Listing ${savedItem.lot_id} updated!` : `New Crop Listing ${savedItem.lot_id} created & persisted!`);
        setIsFormOpen(false);
        fetchListings();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setFormError(errJson.detail || "Failed to save crop listing to database.");
      }
    } catch (err) {
      console.error("Error saving listing:", err);
      setFormError("Network error while connecting to backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, lotId: string, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/crop-listings/${id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Listing ${lotId} status updated to ${newStatus}`);
        fetchListings();
      } else {
        alert("Failed to update listing status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Network error updating status.");
    }
  };

  const handleDeleteListing = async (id: string, lotId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Listing ${lotId}?`)) return;
    try {
      const res = await fetch(getApiUrl(`/api/crop-listings/${id}`), {
        method: "DELETE"
      });
      if (res.ok) {
        showToast(`Listing ${lotId} deleted successfully.`);
        fetchListings();
      } else {
        alert("Failed to delete listing.");
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert("Network error deleting listing.");
    }
  };

  // Calculate Statistics
  const totalCount = listings.length;
  const activeCount = listings.filter(l => l.status === "ACTIVE").length;
  const pausedCount = listings.filter(l => l.status === "PAUSED").length;
  const soldCount = listings.filter(l => l.status === "SOLD").length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-emerald-700 animate-bounce font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link to="/farmer/dashboard" className="mb-2 inline-flex items-center text-emerald-700 font-bold hover:underline text-xs">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Farmer Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Package className="text-emerald-600 w-7 h-7" /> Crop Listing Management
            </h1>
            <p className="text-gray-600 text-xs md:text-sm">
              Create, track, and manage commercial crop lots with Smart Lot IDs, verified quality grades, and persistent buyer marketplace integration.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchListings}
              disabled={isLoading}
              className="bg-white border border-gray-200 text-gray-700 font-bold px-3.5 py-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Add New Crop Listing
            </button>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Total Listings</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{totalCount}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Active Listings</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{activeCount}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-200">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-wider block">Paused</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{pausedCount}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200">
            <span className="text-xs text-blue-700 font-bold uppercase tracking-wider block">Sold & Fulfilled</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{soldCount}</span>
          </div>
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Crop Name, Variety, or Lot ID (e.g. AGRI-2026-0001)..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:bg-white"
              >
                <option value="all">Category: All</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains & Pulses">Grains & Pulses</option>
                <option value="Spices">Spices</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:bg-white"
              >
                <option value="all">Status: All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="SOLD">SOLD</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>

            {/* Grade Filter */}
            <div className="md:col-span-2">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:bg-white"
              >
                <option value="all">Quality: All</option>
                <option value="Grade A">Grade A (Export)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Processing)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:bg-white"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="highest_price">Sort: Price (High-Low)</option>
                <option value="lowest_price">Sort: Price (Low-High)</option>
                <option value="highest_quantity">Sort: Quantity</option>
              </select>
            </div>

          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex justify-between items-center text-xs font-semibold">
            <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-600" /> {errorMessage}</span>
            <button onClick={fetchListings} className="bg-red-100 hover:bg-red-200 text-red-900 px-3 py-1 rounded-lg font-bold">Retry</button>
          </div>
        )}

        {/* Listings Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse"></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No crop listings found</h3>
            <p className="text-gray-500 text-xs mt-1 mb-4">You have not created any crop listings matching your search or filters yet.</p>
            <button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Your First Crop Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => {
              const status = item.status?.toUpperCase() || "ACTIVE";
              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                    status === 'ACTIVE' ? 'border-gray-200 hover:border-emerald-500' :
                    status === 'PAUSED' ? 'border-amber-200 bg-amber-50/20' :
                    status === 'SOLD' ? 'border-blue-200 bg-blue-50/20' : 'border-gray-300 opacity-75'
                  }`}
                >
                  <div>
                    {/* Image & Status Overlay */}
                    <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={item.image_url || sampleImages[0].url} 
                        alt={item.crop_name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-white/20">
                        {item.lot_id}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border shadow-sm ${
                          status === 'ACTIVE' ? 'bg-emerald-500 text-white border-emerald-400' :
                          status === 'PAUSED' ? 'bg-amber-500 text-white border-amber-400' :
                          status === 'SOLD' ? 'bg-blue-600 text-white border-blue-500' :
                          'bg-gray-600 text-white border-gray-500'
                        }`}>
                          {status}
                        </span>
                      </div>

                      {item.is_organic && (
                        <div className="absolute bottom-3 left-3 bg-emerald-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Organic Certified
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">{item.category}</span>
                          <h3 className="font-extrabold text-xl text-gray-900 leading-snug">{item.crop_name}</h3>
                          <p className="text-xs text-gray-500 font-medium">{item.variety}</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-1 rounded-lg shrink-0">
                          {item.quality_grade}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-bold">Quantity</span>
                          <span className="font-extrabold text-sm text-gray-900">{item.quantity} {item.unit}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-bold">Expected Price</span>
                          <span className="font-black text-sm text-emerald-700">₹{item.expected_price} <span className="text-[10px] text-gray-500 font-normal">/{item.unit}</span></span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-bold">Min acceptable</span>
                          <span className="font-bold text-xs text-gray-700">₹{item.minimum_price} /{item.unit}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block uppercase font-bold">Harvest Date</span>
                          <span className="font-bold text-xs text-gray-700">{item.harvest_date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.location ? `${item.location}, ` : ''}{item.district}, {item.state || 'Tamil Nadu'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-1 text-xs font-bold">
                    <button
                      onClick={() => { setSelectedListing(item); setIsDetailOpen(true); }}
                      className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                      title="View Complete Listing Details"
                    >
                      <Eye className="w-4 h-4 text-emerald-600" /> Details
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                      title="Edit Listing Details"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600" /> Edit
                    </button>

                    {status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, item.lot_id, 'PAUSED')}
                        className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg flex items-center gap-1"
                        title="Pause Listing"
                      >
                        <PauseCircle className="w-4 h-4" /> Pause
                      </button>
                    )}

                    {status === 'PAUSED' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, item.lot_id, 'ACTIVE')}
                        className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                        title="Reactivate Listing"
                      >
                        <PlayCircle className="w-4 h-4" /> Activate
                      </button>
                    )}

                    {status !== 'SOLD' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, item.lot_id, 'SOLD')}
                        className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                        title="Mark as Sold"
                      >
                        <CheckSquare className="w-4 h-4" /> Sold
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteListing(item.id, item.lot_id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Package className="text-emerald-600 w-6 h-6" /> {isEditing ? "Edit Crop Listing" : "Create New Production Crop Listing"}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" /> {formError}
                </div>
              )}

              <form onSubmit={handleSaveListing} className="space-y-4 text-xs font-medium">
                
                {/* Row 1: Crop Name, Category, Variety */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Crop Name *</label>
                    <input 
                      type="text" 
                      value={cropName} 
                      onChange={(e) => setCropName(e.target.value)} 
                      placeholder="e.g. Tomato"
                      required 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Crop Category *</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white"
                    >
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Grains & Pulses">Grains & Pulses</option>
                      <option value="Spices">Spices</option>
                      <option value="Oilseeds">Oilseeds</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Variety *</label>
                    <input 
                      type="text" 
                      value={variety} 
                      onChange={(e) => setVariety(e.target.value)} 
                      placeholder="e.g. Hybrid Red Vaishnavi"
                      required 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>

                {/* Row 2: Quantity, Unit, Expected Price, Minimum Price */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Quantity *</label>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      required 
                      min="1"
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-black text-gray-900" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Unit *</label>
                    <select 
                      value={unit} 
                      onChange={(e) => setUnit(e.target.value)} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="Quintal">Quintal (100 kg)</option>
                      <option value="Ton">Ton (1000 kg)</option>
                      <option value="Bags">Bags</option>
                      <option value="Crates">Crates</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Expected Price (₹) *</label>
                    <input 
                      type="number" 
                      value={expectedPrice} 
                      onChange={(e) => setExpectedPrice(e.target.value)} 
                      required 
                      min="1"
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-black text-emerald-700" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Minimum Price (₹) *</label>
                    <input 
                      type="number" 
                      value={minimumPrice} 
                      onChange={(e) => setMinimumPrice(e.target.value)} 
                      required 
                      min="0"
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold text-gray-900" 
                    />
                  </div>
                </div>

                {/* Row 3: Quality Grade & Quality Description */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Quality Grade Tier *</label>
                    <select 
                      value={qualityGrade} 
                      onChange={(e) => setQualityGrade(e.target.value)} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white text-emerald-800"
                    >
                      <option value="Grade A">Grade A (Export Tier)</option>
                      <option value="Grade B">Grade B (Standard Commercial)</option>
                      <option value="Grade C">Grade C (Food Processing)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Quality Description</label>
                    <input 
                      type="text" 
                      value={qualityDescription} 
                      onChange={(e) => setQualityDescription(e.target.value)} 
                      placeholder="e.g. Firm skin, uniform size, zero pest damage."
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-medium" 
                    />
                  </div>
                </div>

                {/* Row 4: Dates & Location */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Harvest Date *</label>
                    <input 
                      type="date" 
                      value={harvestDate} 
                      onChange={(e) => setHarvestDate(e.target.value)} 
                      required 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Available From</label>
                    <input 
                      type="date" 
                      value={availableFrom} 
                      onChange={(e) => setAvailableFrom(e.target.value)} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Village / Location *</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      required 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">District *</label>
                    <input 
                      type="text" 
                      value={district} 
                      onChange={(e) => setDistrict(e.target.value)} 
                      required 
                      className="w-full p-2.5 border border-gray-200 rounded-xl font-bold" 
                    />
                  </div>
                </div>

                {/* Row 5: Farming Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 pt-4">
                    <input 
                      type="checkbox" 
                      id="is_organic"
                      checked={isOrganic} 
                      onChange={(e) => setIsOrganic(e.target.checked)} 
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" 
                    />
                    <label htmlFor="is_organic" className="font-bold text-gray-800 cursor-pointer">Organic Certified Crop</label>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Farming Method</label>
                    <select value={farmingMethod} onChange={(e) => setFarmingMethod(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl">
                      <option value="Drip Irrigated Organic">Drip Irrigated Organic</option>
                      <option value="Hydroponic">Hydroponic</option>
                      <option value="Conventional">Conventional Chemical</option>
                      <option value="Natural Farming">Natural Farming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Preferred Market Link</label>
                    <select value={preferredMarket} onChange={(e) => setPreferredMarket(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl">
                      <option value="Farm Gate / Direct F2C">Farm Gate / Direct F2C</option>
                      <option value="Local Hub">Local Aggregation Hub</option>
                      <option value="Mandi Warehouse">Mandi Warehouse</option>
                      <option value="Cold Storage Bay">Cold Storage Bay</option>
                    </select>
                  </div>
                </div>

                {/* Crop Image selection */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Crop Image URL</label>
                  <input 
                    type="url" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    placeholder="https://..."
                    className="w-full p-2.5 border border-gray-200 rounded-xl font-mono text-[11px]" 
                  />
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {sampleImages.map((img, idx) => (
                      <button 
                        type="button" 
                        key={idx} 
                        onClick={() => setImageUrl(img.url)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${imageUrl === img.url ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description & Sourcing Terms</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)} 
                    className="px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                  >
                    {isSubmitting ? "Saving to Database..." : isEditing ? "Update Crop Listing" : "Publish Crop Listing"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Listing Details Drawer / Modal */}
        {isDetailOpen && selectedListing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-md">
                    {selectedListing.lot_id}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-1">{selectedListing.crop_name} ({selectedListing.variety})</h3>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
              </div>

              <div className="h-48 bg-gray-100 rounded-xl overflow-hidden relative">
                <img src={selectedListing.image_url || sampleImages[0].url} alt={selectedListing.crop_name} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
                  Status: {selectedListing.status}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Quantity</span>
                  <span className="font-extrabold text-sm text-gray-900">{selectedListing.quantity} {selectedListing.unit}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Expected Price</span>
                  <span className="font-black text-sm text-emerald-700">₹{selectedListing.expected_price} /{selectedListing.unit}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Min Acceptable Price</span>
                  <span className="font-bold text-gray-800">₹{selectedListing.minimum_price} /{selectedListing.unit}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block">Quality Grade</span>
                  <span className="font-bold text-emerald-800">{selectedListing.quality_grade}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-700">
                <p><strong>Quality Description:</strong> {selectedListing.quality_description || "Standard Verified Crop"}</p>
                <p><strong>Harvest Date:</strong> {selectedListing.harvest_date} | <strong>Available From:</strong> {selectedListing.available_from || selectedListing.harvest_date}</p>
                <p><strong>Location:</strong> {selectedListing.location}, {selectedListing.district}, {selectedListing.state || 'Tamil Nadu'}</p>
                <p><strong>Farming Method:</strong> {selectedListing.farming_method || 'Conventional'} {selectedListing.is_organic ? '(Organic Certified)' : ''}</p>
                <p><strong>Preferred Market:</strong> {selectedListing.preferred_market || 'Farm Gate / Direct F2C'}</p>
                {selectedListing.description && <p className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-950 mt-2">"{selectedListing.description}"</p>}
              </div>

              <div className="pt-3 border-t text-[11px] text-gray-400 flex justify-between">
                <span>Created: {new Date(selectedListing.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(selectedListing.updated_at || selectedListing.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
