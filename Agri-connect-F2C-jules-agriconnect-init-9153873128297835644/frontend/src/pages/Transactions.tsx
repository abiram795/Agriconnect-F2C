import { useState, useEffect } from "react";
import { ArrowLeft, DollarSign, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function Transactions() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dispute Modal State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState("Payment Delay");
  const [description, setDescription] = useState("");
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState("");

  const transactions = [
    {
      id: "TXN-9021",
      date: "2026-09-24",
      buyer: "FreshFoods Retail Processing Ltd.",
      crop: "Tomato (Grade A)",
      volume: "150 Quintals",
      amount: "₹5,17,500",
      payment_method: "Escrow Direct Deposit",
      status: "ESCROW_LOCKED",
      quality_inspection: "PASSED (Grade A Verified)",
      payout_eta: "Within 24 Hours upon delivery OTP"
    },
    {
      id: "TXN-8821",
      date: "2026-09-20",
      buyer: "Kannan Wholesale Traders",
      crop: "Onion (Red)",
      volume: "80 Quintals",
      amount: "₹2,16,000",
      payment_method: "Direct Bank Payout",
      status: "PAID_RELEASED",
      quality_inspection: "PASSED",
      payout_eta: "Settled on 2026-09-21"
    }
  ];

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/disputes"));
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl("/api/disputes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainant_id: "f0000000-0000-0000-0000-000000000001",
          complainant_role: "farmer",
          issue_category: issueCategory,
          description: description,
          evidence_urls: []
        })
      });

      if (res.ok) {
        setDisputeSuccessMsg("Grievance ticket logged successfully! Admin team assigned.");
        setTimeout(() => {
          setIsDisputeModalOpen(false);
          setDisputeSuccessMsg("");
          fetchDisputes();
        }, 1500);
      }
    } catch (err) {
      console.error("Error logging dispute:", err);
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
              <DollarSign className="text-emerald-600 w-7 h-7" /> Transparent Payments & Grievance Portal
            </h1>
            <p className="text-gray-600 text-sm">Escrow protection, payment milestone tracking, transparent transaction records, and dispute resolution.</p>
          </div>

          <button 
            onClick={() => setIsDisputeModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm transition"
          >
            <AlertTriangle className="w-4 h-4" /> Log Grievance / Dispute Ticket
          </button>
        </div>

        {/* Payment History Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-emerald-600 w-5 h-5" /> Transaction Ledger & Escrow Milestones
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-extrabold text-gray-500 uppercase">
                  <th className="pb-3">Transaction ID</th>
                  <th className="pb-3">Buyer & Lot Details</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Escrow / Payment Status</th>
                  <th className="pb-3">Quality Audit</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm font-medium">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/80">
                    <td className="py-4 font-mono font-bold text-gray-900">{txn.id}<span className="block text-[11px] font-normal text-gray-500">{txn.date}</span></td>
                    <td className="py-4">
                      <span className="font-bold text-gray-900 block">{txn.buyer}</span>
                      <span className="text-xs text-gray-500">{txn.crop} ({txn.volume})</span>
                    </td>
                    <td className="py-4 font-black text-emerald-700 text-base">{txn.amount}</td>
                    <td className="py-4">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                        txn.status === 'PAID_RELEASED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {txn.status === 'PAID_RELEASED' ? 'Released to Bank' : 'Escrow Locked'}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-semibold text-gray-700">
                      <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> {txn.quality_inspection}</span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-xs font-bold text-emerald-700 hover:underline">Download Audit PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispute / Grievance Resolution Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-amber-600 w-5 h-5" /> Active Grievance & Dispute Log
          </h2>

          {isLoading ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
          ) : disputes.length === 0 ? (
            <p className="text-xs text-gray-500">No active grievances or payment disputes reported.</p>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                  <div>
                    <span className="bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded text-[11px] uppercase mr-2">{d.issue_category}</span>
                    <span className="font-bold text-gray-900">{d.description}</span>
                    {d.resolution_notes && <p className="text-gray-600 mt-1 italic">Admin Update: {d.resolution_notes}</p>}
                  </div>
                  <span className="bg-white border text-amber-800 font-black px-3 py-1 rounded-full shrink-0">
                    Status: {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Dispute Modal */}
        {isDisputeModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="text-amber-600 w-5 h-5" /> Log Grievance / Dispute Ticket
                </h3>
                <button onClick={() => setIsDisputeModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
              </div>

              {disputeSuccessMsg ? (
                <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-sm font-bold text-center">
                  {disputeSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Issue Category</label>
                    <select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)} className="w-full p-2.5 border rounded-lg font-bold">
                      <option value="Payment Delay">Payment Delay / Escrow Hold</option>
                      <option value="Quality Mismatch">Quality Grade Discrepancy on Arrival</option>
                      <option value="Weight Variance">Produce Weight Variance</option>
                      <option value="Transit Damage">Transit Damage during Freight</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Detailed Description & Proof Details</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain the discrepancy, order reference number, or payment delay details..."
                      rows={4} 
                      required 
                      className="w-full p-2.5 border rounded-lg" 
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsDisputeModalOpen(false)} className="px-4 py-2 border rounded-lg font-bold text-gray-600">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-sm">Submit Ticket</button>
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
