import { X, Printer, Download, CheckCircle2, ShieldCheck, Tag } from "lucide-react";

interface ReceiptModalProps {
  receipt: any;
  type: "INCOMING" | "SALE";
  onClose: () => void;
}

export default function ReceiptModal({ receipt, type, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

  const isIncoming = type === "INCOMING";
  const title = isIncoming ? "INCOMING PRODUCE RECEIPT" : "HUB SALES RECEIPT";
  const receiptNo = receipt.receipt_number || (isIncoming ? "IN-2026-0001" : "SALE-2026-0001");
  const dateStr = receipt.created_at ? new Date(receipt.created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const timeStr = receipt.created_at ? new Date(receipt.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;

    const content = document.getElementById("printable-receipt-card")?.innerHTML || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${receiptNo}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111827; background: #fff; }
            .receipt-container { max-width: 650px; margin: 0 auto; border: 2px solid #0B6B3A; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #0B6B3A; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
            .header h2 { margin: 4px 0 0 0; color: #374151; font-size: 16px; font-weight: 700; text-transform: uppercase; }
            .tagline { color: #059669; font-size: 12px; font-style: italic; margin-top: 4px; font-weight: 600; }
            .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 800; border-radius: 9999px; margin-top: 8px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; background: #f9fafb; padding: 14px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #f3f4f6; }
            .meta-label { color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 700; display: block; }
            .meta-val { color: #111827; font-weight: 800; font-size: 13px; }
            .farmer-box { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 700; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th { background: #0B6B3A; color: white; text-align: left; padding: 10px; font-weight: 700; }
            td { border-bottom: 1px solid #e5e7eb; padding: 10px; font-weight: 600; }
            .total-banner { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 12px; text-align: right; margin-top: 16px; }
            .total-title { color: #166534; font-size: 12px; font-weight: 700; }
            .total-amount { color: #0B6B3A; font-size: 22px; font-weight: 900; }
            .footer { text-align: center; font-size: 11px; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
            @media print {
              body { padding: 0; }
              .receipt-container { border: 1px solid #000; border-radius: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${content}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    handlePrint();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header Controls */}
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">RECEIPT PREVIEW ({receiptNo})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Receipt Content Card */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div id="printable-receipt-card" className="bg-white border-2 border-[#0B6B3A] rounded-2xl p-6 shadow-sm space-y-5">
            {/* Header Branding */}
            <div className="text-center border-b border-gray-200 pb-4">
              <div className="inline-flex items-center gap-1.5 text-[#0B6B3A] font-black text-2xl tracking-tight">
                <span>AgriConnect F2C Market Hub</span>
              </div>
              <p className="text-xs font-bold text-emerald-700 tracking-wide mt-0.5">"From Farm to Family"</p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold text-xs rounded-full">
                {title}
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 font-semibold block text-[11px]">RECEIPT NUMBER</span>
                <span className="font-mono font-extrabold text-gray-900 text-sm">{receiptNo}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block text-[11px]">DATE & TIME</span>
                <span className="font-extrabold text-gray-900 text-xs">{dateStr} • {timeStr}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block text-[11px]">MARKET HUB</span>
                <span className="font-bold text-emerald-800">{receipt.hub_id || "COIMBATORE-HUB-001"}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block text-[11px]">HUB WORKER ID</span>
                <span className="font-bold text-gray-900">{receipt.worker_id || "COIMBATORE-WORKER-001"}</span>
              </div>
            </div>

            {/* Mandatory Farmer Attribution Box */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex justify-between items-center">
              <div>
                <span className="font-bold block text-[11px] text-emerald-700 uppercase tracking-wider">SOURCE FARMER ATTRIBUTION</span>
                <span className="font-black text-sm text-emerald-950">
                  {receipt.farmer_name || receipt.users?.name || "Verified Local Farmer"}
                </span>
                {receipt.farmer_phone && <span className="block text-[11px] text-emerald-800 font-semibold">Contact: {receipt.farmer_phone}</span>}
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
            </div>

            {/* Items Table */}
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B6B3A] text-white font-bold uppercase">
                    <th className="p-2.5">Produce / Item</th>
                    <th className="p-2.5">Quantity</th>
                    <th className="p-2.5">{isIncoming ? "Farmer Price" : "Unit Price"}</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white font-semibold">
                  <tr>
                    <td className="p-2.5 font-bold text-gray-900">{receipt.product_name}</td>
                    <td className="p-2.5 text-gray-800">{receipt.quantity} {receipt.unit || "kg"}</td>
                    <td className="p-2.5 text-gray-800">₹{isIncoming ? receipt.farmer_price : receipt.unit_price}/{receipt.unit || "kg"}</td>
                    <td className="p-2.5 text-right font-extrabold text-gray-900">
                      ₹{isIncoming ? (receipt.total_value || receipt.quantity * receipt.farmer_price).toFixed(2) : (receipt.total_price || receipt.quantity * receipt.unit_price).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total & Status Summary Banner */}
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase block">STATUS</span>
                <span className="inline-flex items-center gap-1 font-black text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isIncoming ? "RECEIVED & VERIFIED" : (receipt.payment_status || "PAID")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-bold uppercase block">
                  {isIncoming ? "TOTAL FARMER VALUE" : "TOTAL AMOUNT PAID"}
                </span>
                <span className="text-2xl font-black text-[#0B6B3A]">
                  ₹{isIncoming ? (receipt.total_value || receipt.quantity * receipt.farmer_price).toFixed(2) : (receipt.total_price || receipt.quantity * receipt.unit_price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer Tagline & Disclaimer */}
            <div className="text-center pt-3 border-t border-gray-200 text-[11px] text-gray-500 space-y-0.5">
              <p className="font-semibold text-gray-700">Thank you for supporting verified local farmers!</p>
              <p>AgriConnect F2C Market Hub • Direct Farm-to-Consumer Distribution Engine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
