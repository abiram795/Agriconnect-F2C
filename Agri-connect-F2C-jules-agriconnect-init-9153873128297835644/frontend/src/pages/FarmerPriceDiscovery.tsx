import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, MapPin, Info, Calendar, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import NetProfitCalculator from "./NetProfitCalculator";
import { getApiUrl } from "../config/api";

export default function FarmerPriceDiscovery() {
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [district, setDistrict] = useState("Coimbatore");
  const [state, setState] = useState("Tamil Nadu");
  const [selectedQuantity, setSelectedQuantity] = useState("500");
  
  const [marketData, setMarketData] = useState<any>(null);
  const [advisorData, setAdvisorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, [selectedCrop, district]);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch(getApiUrl(`/api/market-analysis?commodity=${encodeURIComponent(selectedCrop)}`)),
        fetch(getApiUrl(`/api/market-intelligence/sale-advisor?commodity=${encodeURIComponent(selectedCrop)}&district=${encodeURIComponent(district)}`))
      ]);
      if (mRes.ok) {
        const mJson = await mRes.json();
        setMarketData(mJson);
      }
      if (aRes.ok) {
        const aJson = await aRes.json();
        setAdvisorData(aJson);
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link to="/farmer/dashboard" className="mb-2 inline-flex items-center text-emerald-700 font-bold hover:underline text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Farmer Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-emerald-600 w-7 h-7" /> Market Intelligence & Price Discovery
            </h1>
            <p className="text-gray-600 text-sm">Real-time Agmarknet mandi prices, arrival volume trends, and AI sale window recommendations.</p>
          </div>

          <button 
            onClick={fetchMarketData}
            disabled={isLoading}
            className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Mandi Feeds
          </button>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">Select Crop</label>
              <select 
                value={selectedCrop} 
                onChange={(e) => setSelectedCrop(e.target.value)} 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Tomato">Tomato (தக்காளி)</option>
                <option value="Onion">Onion (வெங்காயம்)</option>
                <option value="Potato">Potato (உருளைக்கிழங்கு)</option>
                <option value="Carrot">Carrot (கேரட்)</option>
                <option value="Cabbage">Cabbage (முட்டைக்கோஸ்)</option>
                <option value="Cauliflower">Cauliflower (காலிஃபிளவர்)</option>
                <option value="Bhindi">Bhindi / Okra (வெண்டைக்காய்)</option>
                <option value="Brinjal">Brinjal / Eggplant (கத்தரிக்காய்)</option>
                <option value="Apple">Apple (ஆப்பிள்)</option>
                <option value="Banana">Banana (வாழைப்பழம்)</option>
                <option value="Rice">Rice (அரிசி)</option>
                <option value="Wheat">Wheat (கோதுமை)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">District / Mandi Zone</label>
              <input 
                type="text" 
                value={district} 
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Coimbatore"
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">State</label>
              <input 
                type="text" 
                value={state} 
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">Quantity (kg)</label>
              <input 
                type="number" 
                value={selectedQuantity} 
                onChange={(e) => setSelectedQuantity(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* AI Sale-Window Advisor */}
        {advisorData && (
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 mb-4 pb-4 border-b border-white/10">
              <div>
                <span className="bg-emerald-500/30 text-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1.5 w-max mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> AI Harvest & Sale Window Advisor
                </span>
                <h2 className="text-xl md:text-2xl font-black">{advisorData.recommendation}</h2>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-right">
                <p className="text-xs text-emerald-200 uppercase font-semibold">Est. Net Profit Shift</p>
                <p className="text-2xl font-black text-emerald-300">
                  {advisorData.expected_price_change_pct >= 0 ? `+${advisorData.expected_price_change_pct}%` : `${advisorData.expected_price_change_pct}%`}
                </p>
              </div>
            </div>

            <p className="text-emerald-100 text-sm md:text-base leading-relaxed mb-4">
              {advisorData.advisor_reasoning}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <span className="text-emerald-300 block font-semibold mb-0.5">Current Mandi Modal Price</span>
                <span className="text-lg font-extrabold">₹{advisorData.current_modal_price_kg}/kg</span>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <span className="text-emerald-300 block font-semibold mb-0.5">Cold Storage Rate</span>
                <span className="text-lg font-extrabold">₹{advisorData.storage_cost_per_day_quintal}/quintal/day</span>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <span className="text-emerald-300 block font-semibold mb-0.5">Estimated Net Gain / Quintal</span>
                <span className="text-lg font-extrabold text-yellow-300">₹{advisorData.net_gain_estimate_per_quintal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mandi Price Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Regional Mandi Price Directory</h3>
                  <p className="text-xs text-gray-500">Live prices sourced from Agmarknet & verified regional wholesale markets.</p>
                </div>
                {marketData?.price_trend && (
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                    marketData.price_trend === 'Rising' ? 'bg-green-100 text-green-800 border border-green-200' :
                    marketData.price_trend === 'Falling' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    Trend: {marketData.price_trend}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : marketData?.nearby_markets?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                        <th className="pb-3">Mandi / Market</th>
                        <th className="pb-3">District</th>
                        <th className="pb-3">Min - Max Price</th>
                        <th className="pb-3">Modal Price</th>
                        <th className="pb-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-800">
                      {marketData.nearby_markets.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 font-bold text-gray-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {m.market}
                          </td>
                          <td className="py-3.5 text-gray-600">{m.district}</td>
                          <td className="py-3.5 text-gray-600">₹{m.min_price_kg} – ₹{m.max_price_kg}/kg</td>
                          <td className="py-3.5 font-bold text-emerald-700">₹{m.modal_price_kg}/kg</td>
                          <td className="py-3.5 text-right text-xs text-gray-500">{m.arrival_date || "Today"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm font-semibold">No direct Agmarknet mandi feeds available for this specific query.</p>
                  <p className="text-xs text-gray-400 mt-1">Showing benchmark regional averages.</p>
                </div>
              )}

              {marketData?.ai_explanation && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-950 mb-0.5">Market Synthesis Note:</p>
                    <p>{marketData.ai_explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Direct Buyer Sourcing Links</h3>
              <p className="text-xs text-gray-500">Bypass middleman mandi cuts by linking directly with verified institutional buyers.</p>
              
              <Link 
                to="/farmer/buyers" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" /> View Matched Verified Buyers
              </Link>
              
              <Link 
                to="/farmer/listings" 
                className="w-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition"
              >
                Create Aggregated FPO Lot
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
              <h4 className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-700" /> Mandi Data Source Integrity
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Prices are fetched directly from Agmarknet, Ministry of Agriculture & Farmers Welfare, Government of India API endpoints.
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Net Profit Calculator */}
        <div className="pt-4">
          <NetProfitCalculator embedded={true} defaultQuantity={selectedQuantity} defaultPrice={marketData?.modal_price_kg?.toString() || "35"} />
        </div>
      </div>
    </div>
  );
}
