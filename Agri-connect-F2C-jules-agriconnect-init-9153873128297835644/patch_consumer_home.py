import re

with open("frontend/src/pages/ConsumerHome.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add states for addresses
state_code_old = """  const [showOrders, setShowOrders] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);"""

state_code_new = """  const [showOrders, setShowOrders] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddresses, setShowAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [activeOtps, setActiveOtps] = useState<Record<string, string>>({});"""

code = code.replace(state_code_old, state_code_new)

# Add fetchAddresses inside useEffect
use_effect_old = """  useEffect(() => {
    fetchProducts();
    fetchNotifications();
    fetchOrders();
  }, [searchQuery]);"""

use_effect_new = """  useEffect(() => {
    fetchProducts();
    fetchNotifications();
    fetchOrders();
    fetchAddresses();
  }, [searchQuery]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/addresses/${consumerId}`);
      if (res.ok) setAddresses(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOtp = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery-otp`);
      if (res.ok) {
        const data = await res.json();
        setActiveOtps(prev => ({ ...prev, [orderId]: data.otp }));
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const generateNewOtp = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/generate-otp`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActiveOtps(prev => ({ ...prev, [orderId]: data.otp }));
      }
    } catch (err) {
      console.error(err);
    }
  };"""

code = code.replace(use_effect_old, use_effect_new)

# Add buttons
buttons_old = """                <button onClick={() => setShowOrders(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4" /> Order History
                </button>"""

buttons_new = """                <button onClick={() => setShowAddresses(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" /> My Addresses
                </button>
                <button onClick={() => setShowOrders(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4" /> Order History
                </button>"""

code = code.replace(buttons_old, buttons_new)

# Add import for AddressForm
import_old = """import OrderModal from "../components/OrderModal";"""
import_new = """import OrderModal from "../components/OrderModal";
import AddressForm from "../components/AddressForm";"""
code = code.replace(import_old, import_new)

# Add OTP UI in Order History
order_list_old = """                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{order.products?.name}</h3>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {order.fulfillment_method === 'Farmer Delivery' && order.status === 'Preparing' ? 'Farmer is preparing your order' : 
                               order.fulfillment_method === 'Farmer Delivery' && order.status === 'Out for Delivery' ? 'Farmer is on the way' : 
                               order.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Qty: {order.quantity} • Total: ₹{order.total_amount}</p>
                        <p className="text-xs text-gray-500">From: {order.users?.name || "Farmer"} • {new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-xs font-semibold text-blue-600 mt-1">{order.fulfillment_method}</p>
                      </div>"""

order_list_new = """                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{order.products?.name}</h3>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {order.fulfillment_method === 'Farmer Delivery' && order.status === 'Preparing' ? 'Farmer is preparing your order' : 
                               order.fulfillment_method === 'Farmer Delivery' && order.status === 'Out for Delivery' ? 'Farmer is on the way' : 
                               order.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Qty: {order.quantity} • Total: ₹{order.total_amount}</p>
                        <p className="text-xs text-gray-500">From: {order.users?.name || "Farmer"} • {new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-xs font-semibold text-blue-600 mt-1">{order.fulfillment_method}</p>
                          
                          {order.fulfillment_method === 'Farmer Delivery' && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="text-xs text-blue-800 font-medium mb-2">DELIVERY VERIFICATION</p>
                              {activeOtps[order.id] ? (
                                <div>
                                  <p className="text-2xl font-bold tracking-widest text-blue-900 mb-1">{activeOtps[order.id]}</p>
                                  <p className="text-xs text-blue-700">Share this code with the farmer only when your order has arrived.</p>
                                  <button onClick={() => generateNewOtp(order.id)} className="mt-2 text-xs text-blue-600 hover:underline">Request New Code</button>
                                </div>
                              ) : (
                                <button onClick={() => fetchOtp(order.id)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">
                                  View Delivery Code
                                </button>
                              )}
                            </div>
                          )}
                      </div>"""

code = code.replace(order_list_old, order_list_new)


# Add Address Modal rendering
address_modal_code = """
      {showAddresses && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowAddresses(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" /> My Saved Addresses
            </h2>
            
            {showAddressForm ? (
              <AddressForm
                consumerId={consumerId}
                existingAddress={editingAddress}
                onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
                onSuccess={() => { setShowAddressForm(false); setEditingAddress(null); fetchAddresses(); }}
              />
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">You can save up to 3 addresses.</p>
                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl">No addresses saved yet.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded uppercase">{addr.label}</span>
                            {addr.is_default && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">DEFAULT</span>}
                          </div>
                          <p className="font-bold text-gray-900 mt-2">{addr.full_name} • {addr.mobile_number}</p>
                          <p className="text-sm text-gray-600 mt-1">{addr.address_line}</p>
                          <p className="text-sm text-gray-600">{addr.locality ? addr.locality + ', ' : ''}{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }} className="text-sm text-blue-600 font-medium hover:underline">Edit</button>
                          <button onClick={() => deleteAddress(addr.id)} className="text-sm text-red-600 font-medium hover:underline">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {addresses.length < 3 && (
                  <button onClick={() => { setEditingAddress(null); setShowAddressForm(true); }} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    + Add New Address
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
"""

if "{showOrders &&" in code:
    code = code.replace("{showOrders &&", address_modal_code + "\n      {showOrders &&")

with open("frontend/src/pages/ConsumerHome.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("ConsumerHome.tsx patched successfully!")
