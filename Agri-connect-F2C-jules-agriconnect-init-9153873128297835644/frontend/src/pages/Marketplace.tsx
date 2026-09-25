import { Search, MapPin, Star, Filter, Package, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getApiUrl } from "../config/api";
import OrderModal from "../components/OrderModal";

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const url = searchQuery.trim() ? `/api/products/search?q=${encodeURIComponent(searchQuery.trim())}` : '/api/products';
      const res = await fetch(getApiUrl(url));
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4 px-4 md:px-8 flex flex-col sm:flex-row justify-between sm:items-center sticky top-0 z-40 gap-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">AgriConnect <span className="text-primary">Marketplace</span></h1>
        <div className="flex items-center gap-3">
          <Link to="/buyer/dashboard" className="text-primary bg-green-50 px-4 py-2 rounded-xl font-bold hover:bg-green-100 transition shadow-sm">My Dashboard</Link>
          <Link to="/logistics" className="text-blue-600 bg-blue-50 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition shadow-sm">Logistics</Link>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {/* Search & Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 border border-gray-100">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by crop, farmer, or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition font-medium" 
            />
          </div>
          <button className="bg-gray-100 text-gray-700 px-6 py-3.5 font-bold rounded-xl flex items-center justify-center hover:bg-gray-200 transition">
            <Filter className="w-5 h-5 mr-2" /> Filters
          </button>
        </div>
        
        {/* Product Grid */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-800">Fresh Harvest</h2>
          <span className="text-sm font-semibold text-gray-500">{products.length} Products Found</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 h-80 animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-lg">No products found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col group">
                <div className="h-44 bg-green-50 flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-green-800/40 font-bold uppercase tracking-wider">{product.name.substring(0,2)}</span>
                  )}
                  {product.farmers?.verification_status === 'Approved' && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center shadow-sm">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" /> Verified
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-primary font-black text-xl mb-3 flex items-baseline gap-1">
                    ₹{product.price} <span className="text-sm text-gray-500 font-semibold">/{product.unit}</span>
                  </p>
                  
                  <div className="space-y-1.5 mb-4 flex-1">
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> 
                      {product.farmers?.village ? `${product.farmers?.village}, ` : ''}{product.farmers?.district || 'Unknown location'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Package className="w-4 h-4 mr-1.5 text-gray-400" /> 
                      Available: <span className="font-bold ml-1">{product.quantity_available} {product.unit}</span>
                    </p>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs mt-2">
                      <Link
                        to={`/farmer/profile/${product.farmer_id}`}
                        className="flex items-center gap-1.5 text-emerald-800 font-bold hover:underline"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Farmer: {product.farmers?.users?.name || "Abiram S"}</span>
                      </Link>
                      <Link
                        to={`/farmer/profile/${product.farmer_id}`}
                        className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="w-full bg-primary/10 text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-white transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Order Modal */}
      {selectedProduct && (
        <OrderModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onSuccess={() => {
            setSelectedProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
