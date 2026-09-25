import { useState, useEffect } from "react";
import { ArrowLeft, Truck, Warehouse, Phone, MapPin, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function LogisticsManagement() {
  const [hubs, setHubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [district, setDistrict] = useState("Coimbatore");
  
  // Freight Calculator state
  const [distanceKm, setDistanceKm] = useState("45");
  const [loadWeightTons, setLoadWeightTons] = useState("5");
  const [vehicleType, setVehicleType] = useState("Medium Eicher Truck (5 Tons)");

  useEffect(() => {
    fetchStorageHubs();
  }, [district]);

  const fetchStorageHubs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/logistics/storage-hubs?district=${encodeURIComponent(district)}`));
      if (res.ok) {
        const data = await res.json();
        setHubs(data);
      }
    } catch (err) {
      console.error("Error fetching storage hubs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const distVal = parseFloat(distanceKm) || 0;
  const loadVal = parseFloat(loadWeightTons) || 0;
  const ratePerKm = vehicleType.includes("Mini") ? 18 : vehicleType.includes("Medium") ? 28 : 42;
  const estimatedFreightFee = distVal * ratePerKm;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link to="/farmer/dashboard" className="mb-2 inline-flex items-center text-emerald-700 font-bold hover:underline text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="text-emerald-600 w-7 h-7" /> Logistics & Cold Storage Hub Management
          </h1>
          <p className="text-gray-600 text-sm">Book nearby cold storage units, track warehouse capacity, and calculate farm-gate transport freight options.</p>
        </div>

        {/* Freight Transport Estimator Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="text-emerald-600 w-5 h-5" /> Farm-Gate Transport Freight Cost Estimator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Vehicle Fleet Type</label>
              <select 
                value={vehicleType} 
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 text-gray-900 focus:bg-white"
              >
                <option value="Mini Pickup (1.5 Tons)">Mini Pickup Truck (1.5 Tons)</option>
                <option value="Medium Eicher Truck (5 Tons)">Medium Eicher Truck (5 Tons)</option>
                <option value="Heavy Container Truck (12 Tons)">Heavy Container Truck (12 Tons)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Distance (km)</label>
              <input 
                type="number" 
                value={distanceKm} 
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 text-gray-900 focus:bg-white" 
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Load Weight (Tons)</label>
              <input 
                type="number" 
                value={loadWeightTons} 
                onChange={(e) => setLoadWeightTons(e.target.value)}
                className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 text-gray-900 focus:bg-white" 
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex flex-col justify-center text-center">
              <span className="text-emerald-800 font-bold">Estimated Freight Cost ({loadVal} Tons)</span>
              <span className="text-xl font-black text-emerald-700">₹{estimatedFreightFee.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-600">@ ₹{ratePerKm}/km rate</span>
            </div>
          </div>
        </div>

        {/* Cold Storage & Warehouse Hub Directory */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Warehouse className="text-emerald-600 w-5 h-5" /> Cold Storage & Aggregation Hub Directory
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <label className="font-bold text-gray-600">District:</label>
              <input 
                type="text" 
                value={district} 
                onChange={(e) => setDistrict(e.target.value)}
                className="p-2 border rounded-lg font-bold bg-white text-gray-900 w-36"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hubs.map((hub) => (
                <div key={hub.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-500 transition space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block">
                        {hub.type}
                      </span>
                      <h3 className="font-black text-xl text-gray-900">{hub.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {hub.location}, {hub.district}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">Available Capacity:</span>
                      <span className="font-extrabold text-sm text-emerald-700">{hub.capacity_available_tons} / {hub.capacity_total_tons} Tons</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Daily Storage Fee:</span>
                      <span className="font-extrabold text-sm text-gray-900">₹{hub.rate_per_quintal_per_day} / quintal / day</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <span className="font-bold text-gray-800 block">Available Facilities:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {hub.facilities.map((fac: string, idx: number) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[11px] font-medium border">
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> {hub.contact_phone}
                    </span>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm">
                      Reserve Storage Bay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
