import { Link } from "react-router-dom";
import { Tractor, ShoppingBasket, Truck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-primary">AgriConnect F2C</h1>
        <p className="text-xl text-text">
          From Farm to Family, Without Unnecessary Middlemen.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Link to="/farmer-login" className="block p-8 bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-primary">
            <Tractor className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">I am a Farmer</h2>
            <p className="text-gray-600">Sell your produce directly to consumers and get fair prices.</p>
          </Link>

          <Link to="/consumer-login" className="block p-8 bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-accent">
            <ShoppingBasket className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">I am a Consumer</h2>
            <p className="text-gray-600">Buy fresh produce directly from local farmers at better prices.</p>
          </Link>

          <Link to="/delivery-login" className="block p-8 bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500">
            <Truck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Delivery Partner</h2>
            <p className="text-gray-600">Deliver fresh produce locally and earn on every delivery.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
