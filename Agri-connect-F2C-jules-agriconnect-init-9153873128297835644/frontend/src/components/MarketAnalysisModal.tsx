import { useState, useEffect } from "react";
import { X, RefreshCw, TrendingUp, TrendingDown, Minus, Info, AlertTriangle, CheckCircle, ExternalLink, MapPin, Building2 } from "lucide-react";
import { getApiUrl } from "../config/api";

interface NearbyMarket {
  market: string;
  district: string;
  state: string;
  modal_price_kg: number;
  min_price_kg: number;
  max_price_kg: number;
  arrival_date: string;
}

interface MarketAnalysisData {
  success: boolean;
  commodity: string;
  primary_market?: string;
  farmer_district?: string;
  farmer_state?: string;
  status_label: string;
  data_freshness: string;
  market_date?: string;
  fetched_at: string;
  unit: string;
  modal_price_kg?: number;
  min_price_kg?: number;
  max_price_kg?: number;
  modal_explanation: string;
  nearby_markets: NearbyMarket[];
  price_trend: string;
  ai_explanation: string;
  reference_price_range?: string;
  reference_price_label: string;
  source_name: string;
  source_url: string;
  message?: string;
}

interface MarketAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCommodity?: string;
  onSelectReferencePrice?: (suggestedPrice: number, rangeLabel: string) => void;
}

const COMMODITY_OPTIONS = [
  { value: "Tomato", label: "Tomato (ٹماٹر / தக்காளி)" },
  { value: "Onion", label: "Onion (پیاز / வெங்காயம்)" },
  { value: "Potato", label: "Potato (آلو / உருளைக்கிழங்கு)" },
  { value: "Carrot", label: "Carrot (گاجر / கேரட்)" },
  { value: "Bhindi(Ladies Finger)", label: "Ladies Finger / Bhindi (வெண்டி)" },
  { value: "Brinjal", label: "Brinjal / Eggplant (கத்தரிக்காய்)" },
  { value: "Cabbage", label: "Cabbage (முட்டைக்கோஸ்)" },
  { value: "Cauliflower", label: "Cauliflower (காலிஃபிளவர்)" },
  { value: "Apple", label: "Apple (ஆப்பிள்)" },
  { value: "Banana", label: "Banana (வாழைப்பழம்)" },
  { value: "Rice", label: "Rice (அரிசி)" },
  { value: "Wheat", label: "Wheat (கோதுமை)" }
];

export default function MarketAnalysisModal({
  isOpen,
  onClose,
  initialCommodity = "Tomato",
  onSelectReferencePrice
}: MarketAnalysisModalProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<string>(initialCommodity || "Tomato");
  const [data, setData] = useState<MarketAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (initialCommodity) {
      // Find matching commodity option
      const match = COMMODITY_OPTIONS.find(
        c => c.value.toLowerCase() === initialCommodity.toLowerCase() ||
             initialCommodity.toLowerCase().includes(c.value.toLowerCase())
      );
      if (match) {
        setSelectedCommodity(match.value);
      } else {
        setSelectedCommodity(initialCommodity);
      }
    }
  }, [initialCommodity]);

  useEffect(() => {
    if (isOpen) {
      fetchMarketAnalysis(selectedCommodity);
    }
  }, [isOpen, selectedCommodity]);

  const fetchMarketAnalysis = async (commodityName: string) => {
    setIsLoading(true);
    setError("");
    try {
      const farmerId = localStorage.getItem("agriconnect_user_id") || "";
      const res = await fetch(
        getApiUrl(`/api/market-analysis?commodity=${encodeURIComponent(commodityName)}&farmer_id=${farmerId}`)
      );
      if (!res.ok) {
        throw new Error("Unable to retrieve market data.");
      }
      const result: MarketAnalysisData = await res.json();
      setData(result);
    } catch (err: any) {
      console.error("Market analysis fetch error:", err);
      setError("Unable to connect to market service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderFreshnessBadge = () => {
    if (!data) return null;
    if (data.status_label === "Today") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Today's Market Data ({data.market_date})
        </span>
      );
    } else if (data.status_label.startsWith("Latest available")) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300">
          <Info className="w-3.5 h-3.5 mr-1 text-amber-700" />
          {data.status_label}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-900 border border-red-300">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-700" />
          Live market data is currently unavailable
        </span>
      );
    }
  };

  const renderTrendBadge = (trend: string) => {
    if (trend === "Rising") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
          <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Rising Trend
        </span>
      );
    } else if (trend === "Falling") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
          <TrendingDown className="w-3.5 h-3.5 mr-1 text-rose-600" /> Falling Trend
        </span>
      );
    } else if (trend === "Stable") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
          <Minus className="w-3.5 h-3.5 mr-1 text-blue-600" /> Stable Prices
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
        Insufficient Historical Data
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Today's Market Analysis</h2>
              <p className="text-xs text-green-100 font-medium">Official Agmarknet (Govt. of India) Live Data & AI Guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Commodity Selector Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Select Commodity / Produce
              </label>
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-green-600 outline-none"
              >
                {COMMODITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => fetchMarketAnalysis(selectedCommodity)}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Data
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-10 h-10 text-green-600 animate-spin" />
              <p className="text-gray-600 text-sm font-medium">Fetching official market data from Agmarknet API...</p>
            </div>
          )}

          {/* Data Loaded */}
          {!isLoading && data && data.success && (
            <div className="space-y-6">

              {/* Status & Freshness Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center space-x-2">
                  {renderFreshnessBadge()}
                  {renderTrendBadge(data.price_trend)}
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>Farmer District: <strong>{data.farmer_district}, {data.farmer_state}</strong></span>
                </div>
              </div>

              {/* Primary Market Price Cards */}
              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-2xl p-5 border border-green-100 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Primary Reported Market</span>
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center mt-0.5">
                      <Building2 className="w-5 h-5 mr-2 text-green-700" />
                      {data.primary_market} Mandi
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium">Market Record Date</span>
                    <p className="text-sm font-bold text-gray-800">{data.market_date || "N/A"}</p>
                  </div>
                </div>

                {/* Price Numbers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Modal Wholesale Price</span>
                    <div className="text-3xl font-black text-green-700 mt-1">
                      ₹{data.modal_price_kg?.toFixed(1)} <span className="text-sm font-normal text-gray-500">/kg</span>
                    </div>
                    <span className="text-[11px] text-green-700 bg-green-100 px-2 py-0.5 rounded font-medium mt-1 inline-block">
                      Most Common
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Minimum Reported</span>
                    <div className="text-2xl font-bold text-gray-800 mt-1">
                      ₹{data.min_price_kg?.toFixed(1)} <span className="text-xs font-normal text-gray-500">/kg</span>
                    </div>
                    <span className="text-[11px] text-gray-500">Lowest Floor</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Maximum Reported</span>
                    <div className="text-2xl font-bold text-gray-800 mt-1">
                      ₹{data.max_price_kg?.toFixed(1)} <span className="text-xs font-normal text-gray-500">/kg</span>
                    </div>
                    <span className="text-[11px] text-gray-500">Highest Ceiling</span>
                  </div>
                </div>

                {/* Modal Explanation Notice */}
                <div className="flex items-center text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg border border-green-100">
                  <Info className="w-4 h-4 text-green-700 mr-2 flex-shrink-0" />
                  <span>{data.modal_explanation}</span>
                </div>
              </div>

              {/* AI Reference Range & Direct Application */}
              {data.reference_price_range && (
                <div className="bg-emerald-950 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div>
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Reference Selling Range
                    </span>
                    <div className="text-2xl font-extrabold text-white mt-0.5">
                      {data.reference_price_range}
                    </div>
                    <p className="text-xs text-gray-300 mt-1 italic">
                      {data.reference_price_label}
                    </p>
                  </div>
                  {onSelectReferencePrice && (
                    <button
                      onClick={() => {
                        if (data.modal_price_kg && data.reference_price_range) {
                          onSelectReferencePrice(data.modal_price_kg, data.reference_price_range);
                          onClose();
                        }
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-xl shadow transition-colors flex items-center justify-center whitespace-nowrap text-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Reference Range
                    </button>
                  )}
                </div>
              )}

              {/* AI Analysis Panel */}
              {data.ai_explanation && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-blue-700 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                      AI Analysis
                    </span>
                    <h4 className="text-sm font-bold text-blue-900">Market Price Guidance</h4>
                  </div>
                  <p className="text-sm text-blue-950 leading-relaxed font-medium">
                    {data.ai_explanation}
                  </p>
                </div>
              )}

              {/* Nearby Market Comparison Table */}
              {data.nearby_markets && data.nearby_markets.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
                    <MapPin className="w-4 h-4 text-green-700 mr-1.5" />
                    Nearby Market Comparison ({data.commodity})
                  </h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-gray-700 font-semibold text-xs uppercase border-b">
                        <tr>
                          <th className="p-3">Market</th>
                          <th className="p-3">District / State</th>
                          <th className="p-3 text-right">Modal Price</th>
                          <th className="p-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {data.nearby_markets.map((m, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-semibold text-gray-900">{m.market}</td>
                            <td className="p-3 text-gray-600">{m.district}, {m.state}</td>
                            <td className="p-3 text-right font-bold text-green-700">₹{m.modal_price_kg.toFixed(1)}/kg</td>
                            <td className="p-3 text-right text-gray-500 text-xs">{m.arrival_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Source Metadata */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 gap-2">
                <div>
                  <span>Data Source: </span>
                  <a
                    href={data.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-700 underline inline-flex items-center"
                  >
                    {data.source_name} <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <div>
                  <span>Last fetched at: </span>
                  <strong className="text-gray-700">{new Date(data.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>

            </div>
          )}

          {/* No Data Available State */}
          {!isLoading && data && !data.success && (
            <div className="py-12 px-6 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Live Market Data Currently Unavailable</h3>
                <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                  {data.message || `No active wholesale mandi price records were found for ${selectedCommodity}.`}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                You can still proceed to set your own listing price based on your farm cost and direct-to-consumer value.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500 italic">
            AgriConnect F2C Market Intelligence
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
}
