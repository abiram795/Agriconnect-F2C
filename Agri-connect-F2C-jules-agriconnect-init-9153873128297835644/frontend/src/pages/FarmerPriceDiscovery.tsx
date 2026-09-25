import { useState } from "react";
import { ArrowLeft, TrendingUp, MapPin, Info } from "lucide-react";
import { Link } from "react-router-dom";
import NetProfitCalculator from "./NetProfitCalculator";

export default function FarmerPriceDiscovery() {
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [selectedQuality, setSelectedQuality] = useState("Grade A");
  const [selectedQuantity, setSelectedQuantity] = useState("500");
  
  // Simulated AI Data
  const recommendations = [
    { market: "Coimbatore Central Market", distance: "15 km", price: "₹45/kg", demand: "High", aiMatch: "98%", netEstimated: "₹21,500" },
    { market: "Tiruppur Wholesale", distance: "45 km", price: "₹48/kg", demand: "Medium", aiMatch: "85%", netEstimated: "₹22,000" },
    { market: "Direct Buyers (AgriConnect)", distance: "Various", price: "₹50/kg", demand: "Very High", aiMatch: "100%", netEstimated: "₹24,500" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/farmer/dashboard" className="mb-6 flex items-center text-primary font-bold hover:underline">
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp className="text-primary w-6 h-6" /> AI-Powered Price Discovery
          </h1>
          <p className="text-gray-600 mb-6">Discover the best markets and buyers for your crop based on real-time data and AI estimations.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Crop</label>
              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="w-full p-3 border rounded-xl">
                <option>Tomato</option>
                <option>Onion</option>
                <option>Potato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quality Grade</label>
              <select value={selectedQuality} onChange={(e) => setSelectedQuality(e.target.value)} className="w-full p-3 border rounded-xl">
                <option>Grade A (Premium)</option>
                <option>Grade B (Standard)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity (kg)</label>
              <input type="number" value={selectedQuantity} onChange={(e) => setSelectedQuantity(e.target.value)} className="w-full p-3 border rounded-xl" />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-3"><Info className="w-5 h-5" /> AI Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{rec.market}</h4>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{rec.aiMatch} Match</span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> {rec.distance}</p>
                  <div className="mt-3 flex justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Expected Price</p>
                      <p className="font-bold text-gray-900">{rec.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Est. Net Earning</p>
                      <p className="font-bold text-primary">{rec.netEstimated}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-4 text-center">* These are simulated AI recommendations based on demo data.</p>
          </div>
        </div>

        {/* Embedded Net Profit Calculator */}
        <NetProfitCalculator embedded={true} defaultQuantity={selectedQuantity} defaultPrice="45" />
      </div>
    </div>
  );
}
