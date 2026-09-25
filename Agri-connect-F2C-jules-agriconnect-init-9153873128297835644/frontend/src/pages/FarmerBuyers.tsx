import { ArrowLeft, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function FarmerBuyers() {
  const buyers = [
    { id: 1, name: "Fresh Mart Retail", type: "Retailer", lookingFor: "Tomato (Grade A)", quantity: "200 kg", location: "Coimbatore (12 km)", match: "95%" },
    { id: 2, name: "Kannan Stores", type: "Wholesaler", lookingFor: "Onion", quantity: "1000 kg", location: "Tiruppur (40 km)", match: "88%" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/farmer/dashboard" className="mb-6 flex items-center text-primary font-bold hover:underline">
          <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Users className="text-primary w-6 h-6" /> Smart Buyer Matching
          </h1>
          <p className="text-gray-600 mb-6">Connect with verified buyers looking for your crops.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyers.map(buyer => (
              <div key={buyer.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{buyer.name} <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{buyer.type}</span></h3>
                    <p className="text-sm text-gray-500">{buyer.location}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {buyer.match} Match
                  </span>
                </div>
                <div className="mt-4 bg-gray-50 p-3 rounded-lg flex justify-between text-sm">
                  <div><span className="text-gray-500">Looking For:</span> <span className="font-bold">{buyer.lookingFor}</span></div>
                  <div><span className="text-gray-500">Qty:</span> <span className="font-bold">{buyer.quantity}</span></div>
                </div>
                <button className="w-full mt-4 bg-primary text-white font-bold py-2 rounded-lg hover:bg-primary-dark">
                  Send Offer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
