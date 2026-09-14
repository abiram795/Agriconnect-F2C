import { Link } from "react-router-dom";
import { Smartphone, Phone } from "lucide-react";

export default function FarmerSelection() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-primary mb-2">Welcome, Farmer</h1>
        <p className="text-lg text-gray-600 mb-8">How would you like to use AgriConnect today?</p>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Link to="/farmer-register" className="block p-10 bg-card rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-primary">
            <Smartphone className="w-20 h-20 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-3">📱 Smartphone Farmer</h2>
            <p className="text-gray-600">Use our website directly from your smartphone to manage listings, take photos, and track orders.</p>
          </Link>

          <div className="block p-10 bg-card rounded-xl shadow-md border-2 border-transparent relative overflow-hidden group">
            <Phone className="w-20 h-20 text-accent mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-3">☎️ Button Phone Farmer</h2>
            <p className="text-gray-600">Use our IVR phone service without a smartphone. Just call our toll-free number.</p>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
               <p className="font-bold text-yellow-800 text-lg mb-1">Call: 1800-XXX-XXXX</p>
               <p className="text-sm text-yellow-700">Available in Tamil & English</p>
            </div>

            <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="bg-white px-4 py-2 rounded-full font-bold shadow text-gray-800">No smartphone needed</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
            <Link to="/" className="text-primary hover:underline font-medium">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
