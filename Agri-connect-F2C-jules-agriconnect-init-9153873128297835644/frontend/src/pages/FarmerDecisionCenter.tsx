import { useState, useEffect } from "react";
import { 
  ArrowLeft, Sparkles, TrendingUp, Calculator, CheckCircle2, 
  Truck, Users, Send, Bot, Volume2, Globe, RefreshCw, 
  Layers, ArrowRight, DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function FarmerDecisionCenter() {
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [district, setDistrict] = useState("Coimbatore");
  const [quantityKg, setQuantityKg] = useState("500");
  const [qualityGrade, setQualityGrade] = useState("Grade A");
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Feature 8: Bargaining State
  const [buyerOfferKg, setBuyerOfferKg] = useState(24.0);
  const [farmerMinKg, setFarmerMinKg] = useState(27.0);
  const [counterResult, setCounterResult] = useState<any>(null);
  const [isCountering, setIsCountering] = useState(false);

  // Feature 6: Shared Transport State
  const [sharedRouteData, setSharedRouteData] = useState<any>(null);

  // Feature 10: Tamil Assistant State
  const [assistantLang, setAssistantLang] = useState("Tamil");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantHistory, setAssistantHistory] = useState<any[]>([
    { sender: "ai", text: "வணக்கம்! உங்கள் விளைபொருளுக்கான சிறந்த விற்கும் வழிகாட்டி உதவி மையம். இப்போதைய தக்காளி சந்தை நிலை பற்றி கேட்கலாம்." }
  ]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  useEffect(() => {
    fetchDecisionAnalysis();
  }, [selectedCrop, district, quantityKg, qualityGrade]);

  const fetchDecisionAnalysis = async () => {
    setIsLoading(true);
    try {
      const q = parseFloat(quantityKg) || 500;
      const res = await fetch(
        getApiUrl(`/api/decision-center/analyze?crop=${encodeURIComponent(selectedCrop)}&district=${encodeURIComponent(district)}&quantity_kg=${q}&quality_grade=${encodeURIComponent(qualityGrade)}`)
      );
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }

      // Fetch shared transport optimization
      const tRes = await fetch(getApiUrl("/api/logistics/shared-route"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: "f0000000-0000-0000-0000-000000000001",
          crop_name: selectedCrop,
          quantity_kg: q,
          origin_location: `${district} Farm Gate`,
          destination_market: "Coimbatore Processing Hub",
          preferred_date: "2026-09-26"
        })
      });
      if (tRes.ok) {
        const tJson = await tRes.json();
        setSharedRouteData(tJson);
      }
    } catch (err) {
      console.error("Error loading decision analysis:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCounter = async () => {
    setIsCountering(true);
    try {
      const res = await fetch(getApiUrl("/api/negotiations/counter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bid_id: "b0000000-0000-0000-0000-000000000001",
          farmer_id: "f0000000-0000-0000-0000-000000000001",
          counter_price_per_kg: farmerMinKg,
          counter_notes: "Requesting fair target price based on Grade A quality specifications."
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCounterResult(data);
      }
    } catch (err) {
      console.error("Error generating counter offer:", err);
    } finally {
      setIsCountering(false);
    }
  };

  const handleAssistantChat = async (queryText?: string) => {
    const qText = queryText || assistantInput;
    if (!qText.trim()) return;

    setAssistantHistory(prev => [...prev, { sender: "user", text: qText }]);
    if (!queryText) setAssistantInput("");
    setIsAssistantThinking(true);

    try {
      const res = await fetch(getApiUrl("/api/assistant/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: qText, language: assistantLang })
      });
      if (res.ok) {
        const data = await res.json();
        setAssistantHistory(prev => [...prev, { sender: "ai", text: data.reply }]);
      }
    } catch (err) {
      setAssistantHistory(prev => [...prev, { 
        sender: "ai", 
        text: assistantLang === "Tamil" ? "தற்போது தகவல் கிடைக்கவில்லை. சற்று நேரம் கழித்து மீண்டும் முயற்சிக்கவும்." : "Unable to reach market assistant service."
      }]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = assistantLang === "Tamil" ? "ta-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-Speech not supported on this browser.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO HEADER */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 md:p-10 rounded-3xl shadow-xl border border-emerald-800 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <Link to="/farmer/dashboard" className="inline-flex items-center text-emerald-300 font-bold hover:underline text-xs">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Farmer Dashboard
            </Link>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="max-w-2xl">
                <span className="bg-emerald-500/30 text-emerald-200 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30 inline-flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> SIH26132 Hero Decision Hub
                </span>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  Unified Farmer Decision Center
                </h1>
                <p className="text-emerald-200 text-sm md:text-base font-medium mt-2">
                  "Don't just find a price. Find the best way to realise value from your crop."
                </p>
              </div>

              {/* Parameter Selection Bar */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-emerald-300 font-bold mb-1">Crop</label>
                  <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="w-full p-2 bg-emerald-900/90 text-white font-bold rounded-lg border border-emerald-700">
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                    <option value="Carrot">Carrot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-emerald-300 font-bold mb-1">District</label>
                  <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full p-2 bg-emerald-900/90 text-white font-bold rounded-lg border border-emerald-700" />
                </div>

                <div>
                  <label className="block text-emerald-300 font-bold mb-1">Quantity (kg)</label>
                  <input type="number" value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} className="w-full p-2 bg-emerald-900/90 text-white font-bold rounded-lg border border-emerald-700" />
                </div>

                <div>
                  <label className="block text-emerald-300 font-bold mb-1">Quality Grade</label>
                  <select value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)} className="w-full p-2 bg-emerald-900/90 text-white font-bold rounded-lg border border-emerald-700">
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE 1 & 9: SELL NOW / WAIT DECISION ENGINE & STORAGE VS SELL CALCULATOR */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sell Now vs Wait Recommendation Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 1 — Sell / Hold Decision Engine</span>
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-emerald-600 w-6 h-6" /> Data-Based Recommendation: <span className="text-emerald-700">{analysis.decision_recommendation}</span>
                  </h2>
                </div>
                <button onClick={fetchDecisionAnalysis} className="p-2 hover:bg-gray-100 rounded-xl" title="Refresh analysis">
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {analysis.decision_reasoning}
              </p>

              {/* FEATURE 9: Storage vs Sell Comparison */}
              <div className="pt-2 space-y-3">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">FEATURE 9 — Storage vs Sell Financial Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                    <span className="text-xs text-emerald-800 font-bold block">Option 1: Sell Now</span>
                    <span className="text-xl font-black text-emerald-950 mt-1 block">₹{analysis.storage_vs_sell?.sell_now_net?.toLocaleString()}</span>
                    <span className="text-[11px] text-emerald-700 mt-1 block">Immediate Farm Gate Payout</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                    <span className="text-xs text-blue-800 font-bold block">Option 2: Store 3 Days</span>
                    <span className="text-xl font-black text-blue-950 mt-1 block">₹{analysis.storage_vs_sell?.store_3days_net?.toLocaleString()}</span>
                    <span className="text-[11px] text-blue-700 mt-1 block">Estimated Payout after storage</span>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-bold block text-amber-100">Net Financial Advantage</span>
                    <span className="text-2xl font-black mt-1 block">+₹{analysis.storage_vs_sell?.net_difference?.toLocaleString()}</span>
                    <span className="text-[10px] text-amber-100 uppercase font-extrabold">Net Gain by Holding Produce</span>
                  </div>

                </div>
              </div>

              <div className="text-[11px] text-gray-400 italic pt-1">
                * {analysis.disclaimer}
              </div>
            </div>

            {/* FEATURE 7: Local Buyer Demand Intelligence */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">FEATURE 7 — Demand Intelligence</span>
                <h3 className="text-lg font-black text-gray-900 mb-4">Regional Buyer Influx</h3>

                {analysis.demand_summary && (
                  <div className="space-y-4">
                    <div className="bg-emerald-900 text-white p-5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-300 uppercase">{district} Demand Level</span>
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">{analysis.demand_summary.demand_level} DEMAND</span>
                      </div>
                      <div className="text-3xl font-black text-yellow-300">
                        {analysis.demand_summary.demanded_quantity_tons} Tonnes
                      </div>
                      <p className="text-xs text-emerald-200">Requested across {analysis.demand_summary.verified_buyers_count} verified buyers.</p>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-xl border text-xs space-y-1">
                      <span className="font-bold text-gray-800">Target Buyer Procurement Price:</span>
                      <span className="font-black text-emerald-700 block text-sm">₹{analysis.demand_summary.target_price_per_kg}/kg</span>
                      <p className="text-[11px] text-gray-500">{analysis.demand_summary.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/marketplace" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
                View All Regional Demand Requests <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        )}

        {/* FEATURE 2: NET REALISATION COMPARISON ENGINE */}
        {analysis && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-2">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 2 — True Net Earnings Comparison</span>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Calculator className="text-emerald-600 w-6 h-6" /> Net Realisation Engine: Channel Breakdown
                </h2>
              </div>
              <div className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-3.5 py-1.5 rounded-full">
                ⚠️ "Highest price does not always mean highest earnings."
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {analysis.net_realisation_comparisons?.map((comp: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    comp.is_best ? 'bg-gradient-to-b from-emerald-900 to-teal-950 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${comp.is_best ? 'bg-yellow-400 text-gray-950' : 'bg-gray-200 text-gray-700'}`}>
                        {comp.is_best ? '★ Highest Net Profit' : `Channel #${idx + 1}`}
                      </span>
                      <span className={`text-xs font-bold ${comp.is_best ? 'text-emerald-300' : 'text-gray-500'}`}>
                        Gross: ₹{comp.gross_price_kg}/kg
                      </span>
                    </div>

                    <h3 className={`font-black text-lg ${comp.is_best ? 'text-white' : 'text-gray-900'}`}>{comp.channel}</h3>

                    <div className="my-4 space-y-2 text-xs border-t border-b py-3 border-current/10">
                      <div className="flex justify-between">
                        <span className="opacity-80">Gross Revenue:</span>
                        <span className="font-bold">₹{(comp.gross_price_kg * parseFloat(quantityKg)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>Total Freight & Deductions:</span>
                        <span className="font-bold">- ₹{(comp.costs_kg * parseFloat(quantityKg)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-extrabold opacity-75 block">Estimated Net Realisation Payout</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className={`text-2xl font-black ${comp.is_best ? 'text-yellow-300' : 'text-emerald-700'}`}>
                        ₹{comp.total_net_payout?.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold opacity-90">₹{comp.estimated_net_kg} / kg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEATURE 3 & 4: VERIFIED BUYER MATCHING & DIGITAL LOTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 3 — Buyer Discovery</span>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Users className="text-emerald-600 w-5 h-5" /> Verified Matched Buyers
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {analysis?.matched_buyers?.length || 0} Matched
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis?.matched_buyers?.map((buyer: any) => (
                <div key={buyer.id} className="border border-gray-200 rounded-2xl p-5 hover:border-emerald-500 transition space-y-3 bg-gray-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full mb-1 inline-block">
                        {buyer.badge}
                      </span>
                      <h4 className="font-extrabold text-base text-gray-900">{buyer.name}</h4>
                      <p className="text-xs text-gray-500">{buyer.district}, {buyer.state}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-1 rounded-lg">
                      {buyer.match_percentage}% Match
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                    <p className="flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Requires {selectedCrop} ({qualityGrade})</p>
                    <p className="flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Quantity compatible ({buyer.preferred_quantity_range})</p>
                    <p className="flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {buyer.payment_safety_record}</p>
                  </div>

                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition">
                    Send Direct Offer to Buyer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURE 4: Digital Lot Badge Display */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-3xl p-6 shadow-sm border border-gray-800 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">FEATURE 4 — Smart Digital Lot</span>
              <h3 className="text-xl font-black text-white">Digital Crop Lot Passport</h3>
              
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 my-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-300 font-mono">Lot ID</span>
                  <span className="text-sm font-black font-mono text-yellow-300">AGRI-2026-00124</span>
                </div>
                <div className="text-xs space-y-1.5 text-gray-200">
                  <p className="flex justify-between"><span>Crop:</span> <span className="font-bold text-white">{selectedCrop}</span></p>
                  <p className="flex justify-between"><span>Volume:</span> <span className="font-bold text-white">{quantityKg} kg</span></p>
                  <p className="flex justify-between"><span>Quality Grade:</span> <span className="font-bold text-emerald-300">{qualityGrade}</span></p>
                  <p className="flex justify-between"><span>Location:</span> <span className="font-bold text-white">{district} Farm Gate</span></p>
                </div>
              </div>
            </div>

            <Link to="/farmer/listings" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md">
              Manage All Crop Lots <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* FEATURE 5 & 6: FPO AGGREGATION & SHARED LOGISTICS ROUTE OPTIMIZER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* FEATURE 5: FPO Smart Aggregation */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 5 — FPO Aggregation</span>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Layers className="text-emerald-600 w-5 h-5" /> FPO Bulk Pooling Traceability
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
              <div className="flex justify-between items-center font-bold text-gray-800">
                <span>Smallholder Contributions:</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Combined: 700 kg</span>
              </div>

              <div className="space-y-1.5 text-gray-600">
                <p className="flex justify-between"><span>• Farmer A (You):</span> <span className="font-bold">{quantityKg} kg</span></p>
                <p className="flex justify-between"><span>• Farmer B (Kavitha Farm):</span> <span className="font-bold">300 kg</span></p>
                <p className="flex justify-between"><span>• Farmer C (Muthusamy Farm):</span> <span className="font-bold">250 kg</span></p>
              </div>

              <div className="pt-2 border-t flex justify-between font-bold text-emerald-800">
                <span>Bulk Aggregation Logistics Savings:</span>
                <span className="text-sm font-black">+₹1.50 / kg</span>
              </div>
            </div>
          </div>

          {/* FEATURE 6: Shared Logistics & Route Optimizer */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 6 — Logistics Intelligence</span>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Truck className="text-emerald-600 w-5 h-5" /> Route & Shared Transport Optimizer
              </h3>
            </div>

            {sharedRouteData && (
              <div className="bg-emerald-950 text-white p-5 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-300 uppercase">Solo vs Shared Truck Freight</span>
                  <span className="bg-yellow-400 text-gray-950 font-black px-2 py-0.5 rounded text-[10px]">SAVE {sharedRouteData.savings_percentage}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-white/10 p-3 rounded-xl">
                  <div>
                    <span className="text-gray-300 block">Solo Transport Cost:</span>
                    <span className="font-bold text-red-300 text-sm">₹{sharedRouteData.solo_transport_cost}</span>
                  </div>
                  <div>
                    <span className="text-gray-300 block">Shared Transport Cost:</span>
                    <span className="font-black text-yellow-300 text-sm">₹{sharedRouteData.shared_transport_cost}</span>
                  </div>
                </div>

                <p className="text-emerald-200 leading-normal text-[11px]">{sharedRouteData.optimization_notes}</p>
              </div>
            )}
          </div>

        </div>

        {/* FEATURE 8 & 10: BARGAINING ASSISTANT & TAMIL VOICE-READY ASSISTANT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* FEATURE 8: Smart Bargaining Assistant */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 8 — Bargaining Assistant</span>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <DollarSign className="text-emerald-600 w-5 h-5" /> Offer Negotiation Advisor
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Incoming Buyer Offer (₹/kg)</label>
                  <input type="number" value={buyerOfferKg} onChange={(e) => setBuyerOfferKg(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Minimum Target (₹/kg)</label>
                  <input type="number" value={farmerMinKg} onChange={(e) => setFarmerMinKg(parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded-lg font-bold text-emerald-800" />
                </div>
              </div>

              <button 
                onClick={handleGenerateCounter}
                disabled={isCountering}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition"
              >
                {isCountering ? "Analyzing Market Bids..." : "Generate Data-Based Counter Offer"}
              </button>

              {counterResult && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-1.5 text-emerald-950">
                  <div className="flex justify-between font-black text-sm">
                    <span>Suggested Counter-Offer:</span>
                    <span className="text-emerald-700">₹{counterResult.suggested_counter_kg} / kg</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{counterResult.explanation}</p>
                </div>
              )}
            </div>
          </div>

          {/* FEATURE 10: Tamil Farmer Assistant (Voice-Ready) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">FEATURE 10 — Tamil Farmer Assistant</span>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Bot className="text-emerald-600 w-5 h-5" /> Voice-Ready Assistant
                </h3>
              </div>
              
              <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <select value={assistantLang} onChange={(e) => setAssistantLang(e.target.value)} className="bg-transparent font-bold">
                  <option value="Tamil">தமிழ்</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 h-48 overflow-y-auto space-y-3 text-xs">
              {assistantHistory.map((m, idx) => (
                <div key={idx} className={`flex justify-${m.sender === 'user' ? 'end' : 'start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user' ? 'bg-emerald-600 text-white font-bold' : 'bg-white border text-gray-900 shadow-sm'
                  }`}>
                    {m.text}
                    {m.sender === 'ai' && (
                      <button 
                        onClick={() => speakText(m.text)} 
                        className="ml-2 text-emerald-700 hover:text-emerald-900 p-1 inline-flex items-center" 
                        title="Listen Audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isAssistantThinking && <p className="text-[11px] text-gray-400 italic">Gemini Assistant thinking...</p>}
            </div>

            {/* Quick Sample Question Chips */}
            <div className="flex gap-2 overflow-x-auto text-[11px]">
              <button onClick={() => handleAssistantChat("இப்போ தக்காளியை எங்கே விற்கலாம்?")} className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                இப்போ விற்கலாமா?
              </button>
              <button onClick={() => handleAssistantChat("Where can I sell my tomatoes?")} className="bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
                Where to sell?
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAssistantChat(); }} className="flex gap-2">
              <input 
                type="text" 
                value={assistantInput} 
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask in Tamil / English..." 
                className="flex-1 p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500" 
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl text-xs shadow-sm">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
