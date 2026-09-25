import { Link } from "react-router-dom";
import { Tractor, ShoppingBasket, Truck } from "lucide-react";

export default function UnifiedLogin({ isRegister = false }: { isRegister?: boolean }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-primary">
          {isRegister ? "Join AgriConnect F2C" : "Login to AgriConnect F2C"}
        </h1>
        <p className="text-gray-600">Select your role to continue</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link to={isRegister ? "/farmer-register" : "/farmer-login"} className="p-6 bg-gray-50 rounded-xl hover:bg-green-50 hover:shadow-md transition-all border border-gray-200">
            <Tractor className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Farmer</h2>
          </Link>
          <Link to={isRegister ? "/consumer-register" : "/consumer-login"} className="p-6 bg-gray-50 rounded-xl hover:bg-amber-50 hover:shadow-md transition-all border border-gray-200">
            <ShoppingBasket className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Buyer</h2>
          </Link>
          <Link to={isRegister ? "/delivery-register" : "/delivery-login"} className="p-6 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all border border-gray-200">
            <Truck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Transporter</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
