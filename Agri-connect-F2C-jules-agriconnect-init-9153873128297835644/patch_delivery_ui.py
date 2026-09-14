import re

dashboard_code = """import { Truck, MapPin, Menu, CheckCircle, Navigation, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function DeliveryDashboard() {
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<string>("");

  const partnerId = localStorage.getItem("agriconnect_user_id");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!partnerId) return;
    setIsLoading(true);
    try {
      const [availRes, activeRes] = await Promise.all([
        fetch("/api/orders/available-deliveries"),
        fetch(`/api/deliveries/partner/${partnerId}`)
      ]);
      
      if (availRes.ok) setAvailableDeliveries(await availRes.json());
      if (activeRes.ok) {
        const active = await activeRes.json();
        if (active && active.length > 0) {
          setActiveDelivery(active[0]);
        } else {
          setActiveDelivery(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleAcceptDelivery = async (deliveryId: string, orderId: string) => {
    if (!partnerId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/assign-delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_partner_id: partnerId }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to accept delivery");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, status: string) => {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleVerifyOtp = async (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      setOtpError("Please enter a 4-digit OTP.");
      return;
    }
    setOtpError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, farmer_id: partnerId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCompletedDeliveries(c => c + 1);
        fetchData();
      } else {
        setOtpError(data.detail || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setOtpError("An error occurred during verification");
    }
  };

  const handleNavigate = (lat: number, lng: number) => {
    setIsNavigating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsNavigating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const originLat = position.coords.latitude;
        const originLng = position.coords.longitude;
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lat},${lng}`, '_blank');
        setIsNavigating(false);
      },
      (error) => {
        alert("Location permission is required for navigation.");
        setIsNavigating(false);
      },
      { timeout: 10000 }
    );
  };
  
  const renderAddress = (addressObj: any) => {
    try {
      const addr = typeof addressObj === 'string' ? JSON.parse(addressObj) : addressObj;
      if (!addr || !addr.address_line) return addressObj?.address_line || "Address not provided";
      return (
        <span className="text-sm text-slate-600 block mt-1">
          <span className="font-bold">{addr.full_name || addr.title || 'Customer'} {addr.mobile_number ? `• ${addr.mobile_number}` : ''}</span>
          <br/>{addr.address_line}
          <br/>{addr.locality ? addr.locality + ', ' : ''}{addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}
        </span>
      );
    } catch (e) {
      return addressObj?.address_line || addressObj || "Address not provided";
    }
  };

  if (!partnerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <Truck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Partner Hub</h2>
          <p className="text-slate-500 mb-4">Please login to access your delivery dashboard.</p>
          <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium inline-block">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button className="p-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-md">
            <Menu className="w-6 h-6" />
          </button>
          <Truck className="w-6 h-6 mr-2 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Partner Hub</h1>
        </div>
        <Link to="/" className="text-sm font-medium text-blue-600">Home</Link>
      </header>

      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${activeDelivery ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                <p className="font-bold text-slate-800">{activeDelivery ? 'On a Delivery' : 'Available for Delivery'}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Today's Earnings</p>
            <p className="text-2xl font-bold text-green-600">₹{completedDeliveries * 50}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Completed Deliveries</p>
            <p className="text-2xl font-bold text-slate-800">{completedDeliveries}</p>
          </div>
        </div>

        {activeDelivery && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center"><Navigation className="w-5 h-5 mr-2 text-blue-600"/> Active Route</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {activeDelivery.status}
              </span>
            </div>
            
            <div className="p-4">
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 relative">
                  <div className="absolute -left-3 top-4 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-xs">1</div>
                  <h3 className="font-bold text-orange-800 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Pickup: Farmer</h3>
                  <div className="text-sm text-orange-900">
                    <p className="font-bold">{activeDelivery.orders?.order_items?.[0]?.products?.farmers?.users?.name || "Farmer"}</p>
                    <p>{activeDelivery.orders?.order_items?.[0]?.products?.farmers?.farm_location || "Location not provided"}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 relative">
                  <div className="absolute -left-3 top-4 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-xs">2</div>
                  <h3 className="font-bold text-green-800 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-1"/> Dropoff: Customer</h3>
                  {renderAddress(activeDelivery.orders?.delivery_address)}
                </div>
              </div>
              
              {activeDelivery.status !== 'Out for Delivery' && activeDelivery.status !== 'Delivered' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {activeDelivery.status === 'Accepted' && (
                    <button onClick={() => handleStatusUpdate(activeDelivery.id, 'Pickup')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors shadow-sm">
                      Reached Farmer (Pickup)
                    </button>
                  )}
                  {activeDelivery.status === 'Pickup' && (
                    <button onClick={() => handleStatusUpdate(activeDelivery.id, 'Out for Delivery')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors shadow-sm">
                      Start Delivery to Customer
                    </button>
                  )}
                </div>
              )}

              {activeDelivery.status === 'Out for Delivery' && (
                <div className="mt-2">
                  {(() => {
                      let lat, lng;
                      try {
                        const addr = typeof activeDelivery.orders?.delivery_address === 'string' ? JSON.parse(activeDelivery.orders.delivery_address) : activeDelivery.orders?.delivery_address;
                        lat = addr?.latitude;
                        lng = addr?.longitude;
                      } catch (e) {}
                      if (lat && lng) {
                        return (
                          <button 
                            onClick={() => handleNavigate(lat, lng)}
                            disabled={isNavigating}
                            className="w-full mb-4 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold flex items-center justify-center transition-colors shadow-sm"
                          >
                            <Navigation className="w-5 h-5 mr-2" /> {isNavigating ? 'Locating...' : 'Navigate to Customer'}
                          </button>
                        );
                      }
                      return (
                        <div className="mb-4 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg text-center border border-orange-100">
                          Customer map location is not available for this address.
                        </div>
                      );
                  })()}
                  
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <p className="text-sm font-bold text-blue-900 mb-3 text-center">Ask the customer for the 4-digit delivery OTP</p>
                    {otpError && <p className="text-xs font-bold text-red-600 mb-3 text-center bg-red-50 py-2 rounded-lg">{otpError}</p>}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-sm mx-auto">
                      <input 
                        type="text" 
                        maxLength={4} 
                        placeholder="0000"
                        value={otpInputs[activeDelivery.orders?.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setOtpInputs(prev => ({...prev, [activeDelivery.orders?.id]: val}));
                        }}
                        className="w-24 h-12 text-center text-xl font-black tracking-widest border-2 border-blue-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                      />
                      <button 
                        onClick={() => handleVerifyOtp(activeDelivery.orders?.id)} 
                        className="flex-1 w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Available Requests Near You</h2>
            </div>
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 font-medium">Refreshing deliveries...</div>
            ) : availableDeliveries.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="font-medium text-lg">No delivery requests right now.</p>
                <p className="text-sm mt-1">We'll notify you when new orders arrive.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableDeliveries.map(d => (
                  <div key={d.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-black text-slate-800 text-xl tracking-tight">Order #{d.order_id.slice(0,8)}</p>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">{d.status}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-orange-500 shrink-0"/> 
                          <div className="text-sm text-slate-600">
                            <span className="font-bold block text-slate-800">Pickup</span>
                            {d.orders?.order_items?.[0]?.products?.farmers?.farm_location || "Farmer Location"}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-500 shrink-0"/> 
                          <div className="text-sm text-slate-600">
                            <span className="font-bold block text-slate-800">Dropoff</span>
                            {(() => {
                              try {
                                const addr = typeof d.orders?.delivery_address === 'string' ? JSON.parse(d.orders.delivery_address) : d.orders?.delivery_address;
                                return addr?.locality ? `${addr.locality}, ${addr.city}` : (addr?.city || "Customer Area");
                              } catch (e) {
                                return "Customer Area";
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0">
                      <p className="font-black text-green-600 text-2xl mb-0 md:mb-3">₹{d.fee || 50}</p>
                      <button 
                        onClick={() => handleAcceptDelivery(d.id, d.order_id)}
                        disabled={!!activeDelivery}
                        className={`font-bold px-8 py-3 rounded-xl transition-all shadow-sm ${activeDelivery ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md text-white'}`}
                      >
                        {activeDelivery ? 'Busy' : 'Accept Request'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
"""
with open("frontend/src/pages/DeliveryDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(dashboard_code)
print("Updated DeliveryDashboard.tsx!")
