import { Link } from "react-router-dom";
import { Tractor, ShoppingBasket, Truck, Leaf } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">AgriConnect <span className="text-primary font-black">F2C</span></span>
            <span className="hidden sm:inline-block text-xs text-gray-500 ml-2">Farm to Consumer</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/consumer-login" className="text-sm font-semibold text-primary hover:text-primary-dark px-3 py-2 rounded-lg bg-green-50 sm:bg-transparent">
            Login
          </Link>
          <Link to="/consumer-register" className="text-sm font-bold text-white bg-primary hover:bg-secondary px-4 py-2 rounded-lg shadow-sm transition-all">
            Join Market
          </Link>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full text-center space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-semibold mb-2">
            🌱 Direct Farmer to Consumer Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary leading-tight px-2">
            From Farm to Family, Without Unnecessary Middlemen.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Fresh, affordable produce directly from local verified farmers to nearby consumers and city hubs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 text-left">
            <Link to="/farmer-login" className="block p-6 sm:p-8 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-primary hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <Tractor className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">I am a Farmer</h2>
              <p className="text-sm text-gray-600">Sell produce directly, set fair prices, and manage orders with AI price recommendations.</p>
              <div className="mt-4 text-xs font-bold text-primary flex items-center">
                Farmer Portal →
              </div>
            </Link>

            <Link to="/consumer-login" className="block p-6 sm:p-8 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-accent hover:-translate-y-1">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <ShoppingBasket className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">I am a Consumer</h2>
              <p className="text-sm text-gray-600">Browse fresh harvest from nearby farms, request bulk orders, and enjoy farm-fresh food.</p>
              <div className="mt-4 text-xs font-bold text-accent flex items-center">
                Consumer Shop →
              </div>
            </Link>

            <Link to="/delivery-login" className="block p-6 sm:p-8 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all border-t-4 border-blue-500 hover:-translate-y-1 sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Delivery Partner</h2>
              <p className="text-sm text-gray-600">Fulfill local deliveries, verify orders with OTP, and track your daily earnings.</p>
              <div className="mt-4 text-xs font-bold text-blue-600 flex items-center">
                Delivery Portal →
              </div>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200/80 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link to="/hub-login" className="text-emerald-800 hover:text-emerald-900 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors">
              <span>🏢 City Hub Worker Login</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-500 border-t border-gray-100 bg-white">
        © 2026 AgriConnect F2C. Empowering Local Farmers & Consumers.
      </footer>
    </div>
  );
}

