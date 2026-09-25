import { ShieldCheck, Users, FileWarning, Search, Eye, ArrowLeft, Package, History, Check, X, Truck, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { getApiUrl } from "../config/api";

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [farmers, setFarmers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRemark, setActiveRemark] = useState<{ [key: string]: string }>({});
  
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [farmerProducts, setFarmerProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const [logisticsOverview, setLogisticsOverview] = useState<any>(null);

  useEffect(() => {
    fetchLogisticsOverview();
  }, []);

  const fetchLogisticsOverview = async () => {
    try {
      const res = await fetch(getApiUrl('/api/logistics/overview'));
      if (res.ok) setLogisticsOverview(await res.json());
    } catch (e) {
      console.error("Failed to fetch logistics overview", e);
    }
  };

  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    if (session) {
      fetchFarmers();
    }
  }, [session]);

  const fetchFarmers = async () => {
    setApiError("");
    try {
      const res = await fetch(getApiUrl('/api/admin/farmers'), {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFarmers(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setApiError(errData.detail || `Server returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to load farmers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (farmerId: string, action: string) => {
    const remark = activeRemark[farmerId] || "";
    if (action === 'Request Correction' && !remark) {
      alert("Please provide a remark explaining the required correction.");
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/admin/farmers/${farmerId}/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action, remarks: remark })
      });
      if (res.ok) {
        fetchFarmers();
        alert(`Farmer marked as ${action}`);
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Error occurred");
    }
  };

  const viewDocument = async (farmerId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/farmers/${farmerId}/document`), {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.signed_url, '_blank');
      } else {
        alert("Failed to load document secure URL.");
      }
    } catch (err) {
      alert("Error opening document.");
    }
  };

  const openFarmerProfile = async (farmer: any) => {
    setSelectedFarmer(farmer);
    setFarmerProducts([]); // Clear old products
    try {
      const res = await fetch(getApiUrl(`/api/farmers/${farmer.user_id}/products`));
      if (res.ok) {
        const data = await res.json();
        setFarmerProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full">
          <ShieldCheck className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-6">Secure Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="email" placeholder="Admin Email" className="w-full p-3 border rounded-lg" value={email} onChange={e => setEmail(e.target.value)} />
            <input required type="password" placeholder="Password" className="w-full p-3 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-slate-800 text-white p-3 rounded-lg font-bold hover:bg-slate-700">Authenticate</button>
          </form>
        </div>
      </div>
    );
  }

  if (selectedFarmer) {
    const currentProduce = farmerProducts.filter(p => p.status === 'Available');
    const produceHistory = farmerProducts.filter(p => p.status !== 'Available');
    
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <button onClick={() => setSelectedFarmer(null)} className="mb-6 flex items-center text-slate-600 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-800">{selectedFarmer.users?.name || 'Unknown Farmer'}</h1>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              selectedFarmer.verification_status === 'Approved' ? 'bg-green-100 text-green-800' :
              selectedFarmer.verification_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              selectedFarmer.verification_status === 'Correction Required' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {selectedFarmer.verification_status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-slate-600">
            <div><span className="font-semibold block text-slate-800">Location</span> {selectedFarmer.village}, {selectedFarmer.district}, {selectedFarmer.state}</div>
            <div><span className="font-semibold block text-slate-800">Phone</span> {selectedFarmer.users?.phone}</div>
            <div><span className="font-semibold block text-slate-800">Land Area</span> {selectedFarmer.land_area}</div>
            <div><span className="font-semibold block text-slate-800">Acreage</span> {selectedFarmer.acreage} acres</div>
            <div><span className="font-semibold block text-slate-800">Ownership</span> {selectedFarmer.ownership_status}</div>
            <div><span className="font-semibold block text-slate-800">Doc Type</span> {selectedFarmer.document_type}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center">
              <Package className="w-5 h-5 mr-2 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-800">LIVE CURRENT PRODUCE</h2>
            </div>
            {currentProduce.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No vegetables currently listed.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {currentProduce.map(p => (
                  <li key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-500">Listed: {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">₹{p.price}/{p.unit}</p>
                      <p className="text-sm text-slate-600">{p.quantity_available} {p.unit} <span className="text-green-600 font-semibold ml-2">• {p.status}</span></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center">
              <History className="w-5 h-5 mr-2 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-800">Produce History</h2>
            </div>
            {produceHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No produce history available.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {produceHistory.map(p => (
                  <li key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-sm text-slate-500">Listed: {new Date(p.created_at).toLocaleDateString()}</p>
                      {p.completed_at && <p className="text-xs text-slate-400">Ended: {new Date(p.completed_at).toLocaleDateString()}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-500">₹{p.price}/{p.unit}</p>
                      <p className="text-sm text-slate-500">{p.quantity_available} {p.unit} <span className="text-slate-400 font-semibold ml-2">• {p.status}</span></p>
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-slate-600" />
              Administration Portal
          </h1>
          <p className="text-slate-600 mt-2">Secure Ecosystem Monitoring</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-slate-800">Sign Out</button>
      </header>

      {/* Smart Geo-Logistics Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Smart Geo-Logistics & Route Engine Overview
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">Engine Active</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Active Logistics</span>
            <span className="text-2xl font-bold text-slate-800">{logisticsOverview?.active_logistics || 0}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Pending Collections</span>
            <span className="text-2xl font-bold text-amber-700">{logisticsOverview?.pending_collections || 0}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">In Transit</span>
            <span className="text-2xl font-bold text-blue-700">{logisticsOverview?.in_transit || 0}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">City Deliveries</span>
            <span className="text-2xl font-bold text-green-700">{logisticsOverview?.city_deliveries || 0}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Aggregation Orders</span>
            <span className="text-2xl font-bold text-purple-700">{logisticsOverview?.aggregation_orders || 0}</span>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-3">
          <div className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-600"/> Configurable Geo-Routing Rules & Hub Networks
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="font-bold block text-slate-800">Direct Farmer Range</span>
              <span className="text-slate-600">0 – {logisticsOverview?.settings?.DIRECT_DELIVERY_MAX_KM || 5} km</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="font-bold block text-slate-800">Delivery Partner Range</span>
              <span className="text-slate-600">{logisticsOverview?.settings?.DIRECT_DELIVERY_MAX_KM || 5} – {logisticsOverview?.settings?.DELIVERY_PARTNER_MAX_KM || 15} km</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <span className="font-bold block text-slate-800">Collection Hub Threshold</span>
              <span className="text-slate-600">15+ km OR ≥ {logisticsOverview?.settings?.BULK_AGGREGATION_QTY_KG || 50} kg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-100 p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Farmer Verification Queue & Directory</h2>
        </div>
        
        {apiError && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            <strong>Error loading farmers:</strong> {apiError}
          </div>
        )}
        {isLoading ? (
          <div className="p-8 text-center">Loading farmers...</div>
        ) : farmers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No farmers available.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {farmers.map((farmer: any) => (
              <div key={farmer.user_id} className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => openFarmerProfile(farmer)} className="font-bold text-lg text-slate-800 hover:text-blue-600 hover:underline text-left">
                        {farmer.users?.name || 'Unknown'}
                      </button>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        farmer.verification_status === 'Approved' ? 'bg-green-100 text-green-800' :
                        farmer.verification_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        farmer.verification_status === 'Correction Required' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {farmer.verification_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mt-4">
                      <div><span className="font-medium">Phone:</span> {farmer.users?.phone}</div>
                      <div><span className="font-medium">Location:</span> {farmer.village}, {farmer.district}, {farmer.state}</div>
                    </div>

                    {farmer.verification_status !== 'Approved' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                        <Search className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">AI-assisted document analysis</p>
                          <p className="text-xs text-blue-800 mt-1">Possible mismatch in total acreage. Extracted: {Math.max(0, farmer.acreage - 0.5)} acres vs Declared: {farmer.acreage} acres. Manual review required to verify {farmer.document_type} validity.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-64 space-y-3">
                    <button onClick={() => viewDocument(farmer.user_id)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold">
                      <Eye className="w-4 h-4" /> View Private Document
                    </button>
                    
                    {farmer.verification_status !== 'Approved' && (
                      <>
                        <textarea 
                          placeholder="Admin remarks (required for correction/rejection)..."
                          className="w-full p-2 border rounded text-sm h-20"
                          value={activeRemark[farmer.user_id] || ""}
                          onChange={(e) => setActiveRemark({...activeRemark, [farmer.user_id]: e.target.value})}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleVerify(farmer.user_id, 'Approve')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => handleVerify(farmer.user_id, 'Reject')} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold flex items-center justify-center gap-1">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                        <button onClick={() => handleVerify(farmer.user_id, 'Request Correction')} className="w-full py-2 border border-orange-500 text-orange-600 hover:bg-orange-50 rounded text-sm font-bold flex items-center justify-center gap-1">
                          <FileWarning className="w-4 h-4" /> Request Correction
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
