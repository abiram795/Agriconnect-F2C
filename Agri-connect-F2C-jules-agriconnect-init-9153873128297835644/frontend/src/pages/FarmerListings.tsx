import { useState, useEffect } from "react";
import { ArrowLeft, Package, Plus, Tag, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function FarmerListings() {
  const [lots, setLots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Lot Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cropName, setCropName] = useState("Tomato");
  const [variety, setVariety] = useState("Hybrid Red");
  const [grade, setGrade] = useState("Grade A (Export)");
  const [quantityQuintals, setQuantityQuintals] = useState("100");
  const [moisture, setMoisture] = useState("11.5");
  const [certification, setCertification] = useState("Organic Certified");
  const [packagingType, setPackagingType] = useState("Plastic Crates");
  const [reservePrice, setReservePrice] = useState("3200");
  const [harvestDate, setHarvestDate] = useState("2026-09-30");
  const [district, setDistrict] = useState("Coimbatore");
  const [fpoName, setFpoName] = useState("Kongu Farmer Producer Co. Ltd.");
  
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/lots"));
      if (res.ok) {
        const data = await res.json();
        setLots(data);
      }
    } catch (err) {
      console.error("Error fetching lots:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl("/api/lots"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fpo_name: fpoName,
          crop_name: cropName,
          variety: variety,
          grade: grade,
          quantity_quintals: parseFloat(quantityQuintals) || 100,
          moisture_percentage: parseFloat(moisture) || 12.0,
          certification: certification,
          packaging_type: packagingType,
          reserve_price_per_quintal: parseFloat(reservePrice) || 3200,
          expected_harvest_date: harvestDate,
          location_district: district,
          location_state: "Tamil Nadu",
          storage_type: "Cold Storage Hub"
        })
      });

      if (res.ok) {
        setSuccessMsg("Commercial FPO Lot created successfully and opened for buyer bidding!");
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMsg("");
          fetchLots();
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating lot:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <Link to="/farmer/dashboard" className="mb-2 inline-flex items-center text-emerald-700 font-bold hover:underline text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Package className="text-emerald-600 w-7 h-7" /> FPO Lot Pooling & Crop Listings
            </h1>
            <p className="text-gray-600 text-sm">Create uniform commercial lots, pool smallholder produce, tag quality grades, and open for digital bidding.</p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-5 h-5" /> Create Aggregated FPO Lot
          </button>
        </div>

        {/* Lots Feed */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : lots.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No active commercial lots found</h3>
            <p className="text-gray-500 text-sm mt-1">Create your first aggregated FPO lot to get matched with food processors and exporters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot) => (
              <div key={lot.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-500 transition space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
                      {lot.grade}
                    </span>
                    <h3 className="font-black text-xl text-gray-900">{lot.crop_name} ({lot.variety})</h3>
                    <p className="text-xs text-gray-500">{lot.fpo_name || 'Kongu FPO Co-op'}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {lot.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Lot Volume:</span>
                    <span className="font-extrabold text-sm text-gray-900">{lot.quantity_quintals} Quintals</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Reserve Price:</span>
                    <span className="font-extrabold text-sm text-emerald-700">₹{lot.reserve_price_per_quintal}/quintal</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Moisture Level:</span>
                    <span className="font-bold text-gray-800">{lot.moisture_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Packaging:</span>
                    <span className="font-bold text-gray-800">{lot.packaging_type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-gray-600 font-medium">
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-emerald-600" /> {lot.certification}</span>
                  <span>District: {lot.location_district}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Lot Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Layers className="text-emerald-600 w-5 h-5" /> Create Aggregated FPO Commercial Lot
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
              </div>

              {successMsg ? (
                <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-sm font-bold text-center">
                  {successMsg}
                </div>
              ) : (
                <form onSubmit={handleCreateLot} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">FPO / Farmer Group Name</label>
                    <input 
                      type="text" 
                      value={fpoName} 
                      onChange={(e) => setFpoName(e.target.value)} 
                      required 
                      className="w-full p-2.5 border rounded-lg font-medium" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Crop Name</label>
                      <select value={cropName} onChange={(e) => setCropName(e.target.value)} className="w-full p-2.5 border rounded-lg font-bold">
                        <option value="Tomato">Tomato</option>
                        <option value="Onion">Onion</option>
                        <option value="Potato">Potato</option>
                        <option value="Carrot">Carrot</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Variety</label>
                      <input type="text" value={variety} onChange={(e) => setVariety(e.target.value)} className="w-full p-2.5 border rounded-lg font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Quality Grade Tier</label>
                      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-2.5 border rounded-lg font-bold">
                        <option value="Grade A (Export)">Grade A (Export Tier)</option>
                        <option value="Grade B (Standard)">Grade B (Standard Tier)</option>
                        <option value="Grade C (Processing)">Grade C (Food Processing)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Lot Volume (Quintals)</label>
                      <input type="number" value={quantityQuintals} onChange={(e) => setQuantityQuintals(e.target.value)} required className="w-full p-2.5 border rounded-lg font-bold text-emerald-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Moisture Level (%)</label>
                      <input type="number" step="0.1" value={moisture} onChange={(e) => setMoisture(e.target.value)} className="w-full p-2.5 border rounded-lg font-medium" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Reserve Price (₹ / Quintal)</label>
                      <input type="number" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} required className="w-full p-2.5 border rounded-lg font-bold text-emerald-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">District / Region</label>
                      <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} required className="w-full p-2.5 border rounded-lg font-medium" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Expected Harvest Date</label>
                      <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} required className="w-full p-2.5 border rounded-lg font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Quality Certification</label>
                      <select value={certification} onChange={(e) => setCertification(e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="Organic Certified">Organic Certified</option>
                        <option value="Pesticide Free">Pesticide Free</option>
                        <option value="Standard GAP">Standard GAP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Packaging Format</label>
                      <select value={packagingType} onChange={(e) => setPackagingType(e.target.value)} className="w-full p-2.5 border rounded-lg">
                        <option value="Plastic Crates">Plastic Crates</option>
                        <option value="Jute Bags">Jute Bags</option>
                        <option value="Bulk Mesh">Bulk Mesh</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm">Publish Lot</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
