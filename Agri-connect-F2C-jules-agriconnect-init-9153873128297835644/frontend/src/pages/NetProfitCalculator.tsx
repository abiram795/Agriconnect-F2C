import { useState } from "react";
import { Calculator } from "lucide-react";

export default function NetProfitCalculator({ embedded = false, defaultQuantity = "100", defaultPrice = "40" }) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [sellingPrice, setSellingPrice] = useState(defaultPrice);
  const [transportCost, setTransportCost] = useState("500");
  const [packagingCost, setPackagingCost] = useState("200");
  const [storageCost, setStorageCost] = useState("0");
  const [otherCost, setOtherCost] = useState("100");

  const q = parseFloat(quantity) || 0;
  const sp = parseFloat(sellingPrice) || 0;
  const tc = parseFloat(transportCost) || 0;
  const pc = parseFloat(packagingCost) || 0;
  const sc = parseFloat(storageCost) || 0;
  const oc = parseFloat(otherCost) || 0;

  const grossRevenue = q * sp;
  const totalExpenses = tc + pc + sc + oc;
  const netEarnings = grossRevenue - totalExpenses;

  const content = (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calculator className="text-primary w-5 h-5" /> Net Profit Estimator
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Quantity (kg)</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Selling Price per kg (₹)</label>
            <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
          </div>
          <div className="pt-4 border-t">
            <label className="block text-sm font-semibold text-gray-700">Transport Cost (₹)</label>
            <input type="number" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Packaging Cost (₹)</label>
            <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Storage Cost (₹)</label>
            <input type="number" value={storageCost} onChange={(e) => setStorageCost(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Other Expenses (₹)</label>
            <input type="number" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-gray-700">
              <span>Gross Revenue:</span>
              <span className="font-bold">₹{grossRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-red-600 border-b pb-4">
              <span>Total Expenses:</span>
              <span className="font-bold">- ₹{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xl text-primary font-black pt-2">
              <span>Net Earnings:</span>
              <span>₹{netEarnings.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">Estimates based on entered values. Not guaranteed income.</p>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;
  return <div className="min-h-screen bg-gray-50 p-4 md:p-8 max-w-4xl mx-auto">{content}</div>;
}
