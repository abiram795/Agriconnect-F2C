import re

with open("src/pages/FarmerDashboard.tsx", "r") as f:
    code = f.read()

# Add Navigation import
code = code.replace(
    'import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, ArrowLeft, History, Bell, MapPin, DollarSign, Activity } from "lucide-react";',
    'import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, ArrowLeft, History, Bell, MapPin, DollarSign, Activity, Navigation, Truck } from "lucide-react";'
)

# Add state and handle functions inside component
inject_str = """  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (lat: number, lon: number) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsNavigating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        const destination = `${lat},${lon}`;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, "_blank");
        setIsNavigating(false);
      },
      (err) => {
        alert("Unable to retrieve your location for navigation. Please check your permissions.");
        setIsNavigating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/farmer-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      alert("Failed to update status. Please try again.");
    }
  };
"""

code = code.replace('  const unreadCount = notifications.filter(n => !n.is_read).length;\n', inject_str + '\n  const unreadCount = notifications.filter(n => !n.is_read).length;\n')


# Add Active Delivery Orders UI after Sales Overview
delivery_orders_ui = """
      {/* Active Farmer Delivery Orders */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <Truck className="w-6 h-6 mr-2 text-primary" /> Active Delivery Orders
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.filter(o => o.fulfillment_method === 'Farmer Delivery' && !['Completed', 'Delivered', 'Cancelled'].includes(o.status)).length === 0 ? (
            <div className="col-span-full p-6 bg-white border border-gray-100 rounded-xl shadow-sm text-center text-gray-500">
              No active delivery orders.
            </div>
          ) : (
            orders.filter(o => o.fulfillment_method === 'Farmer Delivery' && !['Completed', 'Delivered', 'Cancelled'].includes(o.status)).map(o => (
              <div key={o.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{o.users?.name || "Customer"}</h3>
                    <p className="text-sm text-gray-600">{o.products?.name} - {o.quantity} kg</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                    {o.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4 flex-1">
                  <p className="flex items-start"><MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" /> {o.delivery_address?.address_line || "Address not provided"}</p>
                </div>

                <div className="mt-auto space-y-2">
                  {o.delivery_address?.latitude && o.delivery_address?.longitude ? (
                    <button 
                      onClick={() => handleNavigate(o.delivery_address.latitude, o.delivery_address.longitude)}
                      disabled={isNavigating}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors"
                    >
                      <Navigation className="w-4 h-4 mr-1" /> {isNavigating ? 'Locating...' : 'Navigate to Customer'}
                    </button>
                  ) : (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded text-center border border-orange-100">
                      Map location unavailable
                    </div>
                  )}

                  <div className="flex gap-2">
                    {o.status === 'Order Placed' && (
                      <button onClick={() => handleStatusUpdate(o.id, 'Preparing')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-semibold transition-colors">
                        Accept & Prepare
                      </button>
                    )}
                    {(o.status === 'Preparing' || o.status === 'Order Placed') && (
                      <button onClick={() => handleStatusUpdate(o.id, 'Out for Delivery')} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                        Start Delivery
                      </button>
                    )}
                    {o.status === 'Out for Delivery' && (
                      <button onClick={() => handleStatusUpdate(o.id, 'Delivered')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
"""

code = code.replace('      {/* Sales Overview */}', delivery_orders_ui + '\n      {/* Sales Overview */}')

with open("src/pages/FarmerDashboard.tsx", "w") as f:
    f.write(code)
