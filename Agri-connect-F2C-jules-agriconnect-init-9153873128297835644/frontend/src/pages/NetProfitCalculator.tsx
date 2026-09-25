import { useState } from "react";
import { Calculator, Truck } from "lucide-react";

export default function NetProfitCalculator({ embedded = false, defaultQuantity = "500", defaultPrice = "35" }: any) {
  const [quantityKg, setQuantityKg] = useState(defaultQuantity);
  const [sellingPriceKg, setSellingPriceKg] = useState(defaultPrice);
  const [distanceKm, setDistanceKm] = useState("35");
  const [freightRatePerKm, setFreightRatePerKm] = useState("12"); // ₹12/km truck freight
  const [packagingCost, setPackagingCost] = useState("250");
  const [mandiTaxPct, setMandiTaxPct] = useState("1.5"); // 1.5% APMC tax
  const [storageDays, setStorageDays] = useState("0");
  const [storageRatePerDay, setStorageRatePerDay] = useState("8.50"); // ₹8.50/quintal/day

  const qKg = parseFloat(quantityKg) || 0;
  const qQuintals = qKg / 100.0;
  const priceKg = parseFloat(sellingPriceKg) || 0;
  const dist = parseFloat(distanceKm) || 0;
  const freightPerKm = parseFloat(freightRatePerKm) || 0;
  const packCost = parseFloat(packagingCost) || 0;
  const mandiPct = parseFloat(mandiTaxPct) || 0;
  const days = parseFloat(storageDays) || 0;
  const dailyStorageRate = parseFloat(storageRatePerDay) || 0;

  // Gross Calculations
  const grossRevenue = qKg * priceKg;

  // Expense Components
  const totalFreightExpense = dist * freightPerKm;
  const mandiTaxExpense = grossRevenue * (mandiPct / 100.0);
  const coldStorageExpense = qQuintals * dailyStorageRate * days;
  const totalExpenses = totalFreightExpense + packCost + mandiTaxExpense + coldStorageExpense;

  const netEarnings = grossRevenue - totalExpenses;
  const netRealizationPerKg = qKg > 0 ? (netEarnings / qKg) : 0;
  const netRealizationPerQuintal = netRealizationPerKg * 100.0;

  // Comparison Benchmarks
  const mandiCommissionDeduction = grossRevenue * 0.08; // Typical 8% middleman commission in traditional mandi
  const traditionalMandiNet = grossRevenue - mandiCommissionDeduction - totalFreightExpense;
  const directGainVsTraditional = netEarnings - traditionalMandiNet;

  const content = (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Calculator className="text-emerald-600 w-6 h-6" /> Dynamic Net Profit Realization Engine
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Calculate true net farmer income after deducting transport freight distance, APMC taxes, packaging, and cold storage costs.
          </p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
          F2C Profit Margin Estimator
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Parameters Form */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Produce Volume (kg)</label>
              <input 
                type="number" 
                value={quantityKg} 
                onChange={(e) => setQuantityKg(e.target.value)} 
                className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500" 
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">= {qQuintals.toFixed(2)} Quintals</span>
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Selling Price (₹ / kg)</label>
              <input 
                type="number" 
                value={sellingPriceKg} 
                onChange={(e) => setSellingPriceKg(e.target.value)} 
                className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
          </div>

          <div className="pt-2 border-t space-y-3">
            <h4 className="font-extrabold text-gray-800 flex items-center gap-1.5 text-xs">
              <Truck className="w-4 h-4 text-emerald-600" /> Freight & Transport Parameters
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Transport Distance (km)</label>
                <input 
                  type="number" 
                  value={distanceKm} 
                  onChange={(e) => setDistanceKm(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg font-medium" 
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Freight Rate (₹ / km)</label>
                <input 
                  type="number" 
                  value={freightRatePerKm} 
                  onChange={(e) => setFreightRatePerKm(e.target.value)} 
                  className="w-full p-2.5 border border-gray-200 rounded-lg font-medium" 
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t space-y-3">
            <h4 className="font-extrabold text-gray-800 text-xs">Storage & Handling Costs</h4>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Packaging (₹)</label>
                <input 
                  type="number" 
                  value={packagingCost} 
                  onChange={(e) => setPackagingCost(e.target.value)} 
                  className="w-full p-2 border border-gray-200 rounded-lg font-medium" 
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">APMC Tax (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={mandiTaxPct} 
                  onChange={(e) => setMandiTaxPct(e.target.value)} 
                  className="w-full p-2 border border-gray-200 rounded-lg font-medium" 
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Storage Days</label>
                <input 
                  type="number" 
                  value={storageDays} 
                  onChange={(e) => setStorageDays(e.target.value)} 
                  className="w-full p-2 border border-gray-200 rounded-lg font-medium" 
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Fee (₹/Q/day)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={storageRatePerDay} 
                  onChange={(e) => setStorageRatePerDay(e.target.value)} 
                  className="w-full p-2 border border-gray-200 rounded-lg font-medium" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 rounded-2xl border border-emerald-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-emerald-200 border-b border-white/10 pb-3">
              <span>Gross Total Revenue:</span>
              <span className="font-bold text-sm text-white">₹{grossRevenue.toLocaleString()}</span>
            </div>

            <div className="space-y-1.5 text-xs text-emerald-200">
              <div className="flex justify-between">
                <span>• Freight Transport Cost:</span>
                <span className="font-semibold text-white">₹{totalFreightExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>• Packaging & Crates:</span>
                <span className="font-semibold text-white">₹{packCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>• Mandi Tax ({mandiPct}%):</span>
                <span className="font-semibold text-white">₹{mandiTaxExpense.toLocaleString()}</span>
              </div>
              {days > 0 && (
                <div className="flex justify-between">
                  <span>• Cold Storage ({days} days @ ₹{dailyStorageRate}/Q):</span>
                  <span className="font-semibold text-white">₹{coldStorageExpense.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-red-300 border-t border-white/10 pt-3">
              <span>Total Deductions & Expenses:</span>
              <span className="font-bold text-sm">- ₹{totalExpenses.toLocaleString()}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-1">
              <span className="text-xs text-emerald-300 font-extrabold uppercase tracking-wider block">Estimated Net Farmer Payout</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl md:text-3xl font-black text-yellow-300">₹{netEarnings.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-200">₹{netRealizationPerKg.toFixed(2)} / kg (₹{netRealizationPerQuintal.toFixed(0)} / Quintal)</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-800/40 p-3.5 rounded-xl border border-emerald-700/50 text-xs space-y-1">
            <div className="flex justify-between font-bold">
              <span className="text-emerald-200">Gain vs Traditional Middleman Mandi:</span>
              <span className="text-yellow-300">+₹{directGainVsTraditional > 0 ? directGainVsTraditional.toLocaleString() : 0}</span>
            </div>
            <p className="text-[11px] text-emerald-300 leading-normal">
              Direct F2C & institutional buyer links eliminate 8% agent commission cuts, yielding higher net farm-gate profit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;
  return <div className="min-h-screen bg-gray-50 p-4 md:p-8 max-w-5xl mx-auto">{content}</div>;
}
