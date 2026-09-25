import { useState, useEffect } from "react";
import { ArrowLeft, Users, ShieldCheck, CheckCircle2, DollarSign, MapPin, Building2, Send, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../config/api";

export default function FarmerBuyers() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [district, setDistrict] = useState("Coimbatore");
  
  // Offer modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("50");
  const [offerNotes, setOfferNotes] = useState("");
  const [offerSuccessMsg, setOfferSuccessMsg] = useState("");

  useEffect(() => {
    fetchBuyersAndBids();
  }, [selectedCrop, district]);

  const fetchBuyersAndBids = async () => {
    setIsLoading(true);
    try {
      const [bRes, bidRes] = await Promise.all([
        fetch(getApiUrl(`/api/buyers/matched?crop=${encodeURIComponent(selectedCrop)}&district=${encodeURIComponent(district)}`)),
        fetch(getApiUrl("/api/bids"))
      ]);
      if (bRes.ok) {
        const bJson = await bRes.json();
        setBuyers(bJson);
      }
      if (bidRes.ok) {
        const bidJson = await bidRes.json();
        setBids(bidJson);
      }
    } catch (err) {
      console.error("Error fetching buyers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenOfferModal = (buyer: any) => {
    setSelectedBuyer(buyer);
    setOfferPrice("3400"); // default ₹/quintal
    setIsOfferModalOpen(true);
    setOfferSuccessMsg("");
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyer) return;

    try {
      const res = await fetch(getApiUrl("/api/bids"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_id: "l0000000-0000-0000-0000-000000000001",
          buyer_id: selectedBuyer.id || "u0000000-0000-0000-0000-000000000002",
          buyer_name: selectedBuyer.name,
          buyer_type: selectedBuyer.buyer_type || "Processor",
          bid_price_per_quintal: parseFloat(offerPrice) || 3400,
          offered_quantity_quintals: parseFloat(offerQuantity) || 50,
          payment_terms: "Escrow on Delivery",
          delivery_location: `${selectedBuyer.district} Procurement Hub`,
          notes: offerNotes || "Direct farmer offer submitted via AgriConnect"
        })
      });

      if (res.ok) {
        setOfferSuccessMsg("Offer submitted successfully! Escrow contract initiated.");
        setTimeout(() => {
          setIsOfferModalOpen(false);
          fetchBuyersAndBids();
        }, 1500);
      }
    } catch (err) {
      console.error("Error submitting offer:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link to="/farmer/dashboard" className="mb-2 inline-flex items-center text-emerald-700 font-bold hover:underline text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-600 w-7 h-7" /> Smart Verified Buyer Match
          </h1>
          <p className="text-gray-600 text-sm">Connect directly with verified institutional buyers, food processors, and wholesale traders with transparent payment terms.</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">Crop Filter</label>
            <select 
              value={selectedCrop} 
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
              <option value="Carrot">Carrot</option>
              <option value="Cabbage">Cabbage</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">District / Region</label>
            <input 
              type="text" 
              value={district} 
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Coimbatore"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Active Offers & Bids Section */}
        {bids.length > 0 && (
          <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-sm border border-emerald-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-300">
              <DollarSign className="w-5 h-5 text-yellow-400" /> Active Digital Offers & Negotiation Stream
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bids.map((bid: any) => (
                <div key={bid.id} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-white text-base">{bid.buyer_name}</h3>
                        <span className="text-xs bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">{bid.buyer_type}</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        bid.status === 'Accepted' ? 'bg-green-500 text-white' :
                        bid.status === 'Rejected' ? 'bg-red-500 text-white' :
                        'bg-amber-400 text-gray-900'
                      }`}>
                        {bid.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3 bg-white/5 p-3 rounded-lg">
                      <div>
                        <span className="text-emerald-300 block">Offered Price:</span>
                        <span className="font-bold text-sm text-yellow-300">₹{bid.bid_price_per_quintal}/quintal</span>
                      </div>
                      <div>
                        <span className="text-emerald-300 block">Quantity Needed:</span>
                        <span className="font-bold text-sm text-white">{bid.offered_quantity_quintals} Quintals</span>
                      </div>
                    </div>
                    {bid.notes && <p className="text-xs text-emerald-200 mt-2 italic">"{bid.notes}"</p>}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-xs flex justify-between items-center text-emerald-300 font-medium">
                    <span>Payment: {bid.payment_terms}</span>
                    <span>Location: {bid.delivery_location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Buyers List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Verified Buyer Sourcing Directory</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buyers.map((buyer) => (
                <div key={buyer.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-500 transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {buyer.badge}
                        </span>
                        <h3 className="font-extrabold text-lg text-gray-900 leading-snug">{buyer.name}</h3>
                      </div>
                      <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {buyer.match_percentage}% Match
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 mb-4">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" /> Type: <span className="font-bold text-gray-800">{buyer.buyer_type}</span>
                      </p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Proximity: <span className="font-bold text-gray-800">{buyer.district}, {buyer.state} ({buyer.distance_km} km away)</span>
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Minimum Quality:</span>
                        <span className="font-bold text-gray-900">{buyer.min_grade_required}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Sourcing Capacity:</span>
                        <span className="font-bold text-gray-900">{buyer.preferred_quantity_range}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Payment Record:</span>
                        <span className="font-bold text-emerald-700">{buyer.payment_safety_record}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOpenOfferModal(buyer)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Send className="w-4 h-4" /> Send Digital Offer / Price Bid
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offer Modal */}
        {isOfferModalOpen && selectedBuyer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="text-emerald-600 w-5 h-5" /> Submit Direct Offer to {selectedBuyer.name}
                </h3>
                <button onClick={() => setIsOfferModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
              </div>

              {offerSuccessMsg ? (
                <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-sm font-bold text-center">
                  {offerSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleSendOffer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Target Crop / Lot</label>
                    <input type="text" value={`${selectedCrop} (Grade A)`} disabled className="w-full p-2.5 bg-gray-100 border rounded-lg text-sm font-medium" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Price Offer (₹ / Quintal)</label>
                      <input 
                        type="number" 
                        value={offerPrice} 
                        onChange={(e) => setOfferPrice(e.target.value)} 
                        required 
                        className="w-full p-2.5 border rounded-lg text-sm font-bold text-emerald-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Quantity (Quintals)</label>
                      <input 
                        type="number" 
                        value={offerQuantity} 
                        onChange={(e) => setOfferQuantity(e.target.value)} 
                        required 
                        className="w-full p-2.5 border rounded-lg text-sm font-bold" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Additional Terms / Delivery Notes</label>
                    <textarea 
                      value={offerNotes} 
                      onChange={(e) => setOfferNotes(e.target.value)}
                      placeholder="e.g. Produce packed in crates, available at Coimbatore Cold Storage Hub..."
                      rows={3}
                      className="w-full p-2.5 border rounded-lg text-xs"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsOfferModalOpen(false)} 
                      className="px-4 py-2 text-gray-600 text-sm font-bold border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm"
                    >
                      Submit Offer
                    </button>
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
