import re

with open("frontend/src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add state
old_states = """  const [showNotifications, setShowNotifications] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);"""
new_states = """  const [showNotifications, setShowNotifications] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<string>("");"""
code = code.replace(old_states, new_states)

# Add handleVerifyOtp function right after handleStatusUpdate
handle_status = """  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/farmer-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };"""

handle_otp = """  const handleVerifyOtp = async (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      setOtpError("Please enter a 4-digit OTP.");
      return;
    }
    setOtpError("");
    try {
      const farmerId = localStorage.getItem('agriconnect_user_id');
      const res = await fetch(`/api/orders/${orderId}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, farmer_id: farmerId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Delivery verified successfully!");
        fetchData();
      } else {
        setOtpError(data.detail || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      setOtpError("An error occurred during verification");
    }
  };"""

if handle_status in code:
    code = code.replace(handle_status, handle_status + "\n\n" + handle_otp)

# Address parsing fix
old_address_render = """<p className="flex items-start"><MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" /> {o.delivery_address?.address_line || "Address not provided"}</p>"""
new_address_render = """<div className="flex items-start">
  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" /> 
  <div>
    {o.delivery_address ? (
      <>
        <span className="font-bold text-gray-800">{o.delivery_address.full_name} • {o.delivery_address.mobile_number}</span>
        <span className="block text-gray-600 mt-1">{o.delivery_address.address_line}</span>
        <span className="block text-gray-600">{o.delivery_address.locality ? o.delivery_address.locality + ', ' : ''}{o.delivery_address.city}, {o.delivery_address.state} - {o.delivery_address.pincode}</span>
        {o.delivery_address.label && <span className="inline-block mt-1 bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{o.delivery_address.label}</span>}
      </>
    ) : "Address not provided"}
  </div>
</div>"""
code = code.replace(old_address_render, new_address_render)

# OTP Input replace mark delivered
old_buttons = """                      {o.status === 'Out for Delivery' && (
                        <button onClick={() => handleStatusUpdate(o.id, 'Delivered')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                          Mark Delivered
                        </button>
                      )}"""
new_buttons = """                      {o.status === 'Out for Delivery' && (
                        <div className="w-full mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Ask the customer for the 4-digit delivery OTP</p>
                          {otpError && <p className="text-xs text-red-600 mb-2">{otpError}</p>}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              maxLength={4} 
                              placeholder="0000"
                              value={otpInputs[o.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setOtpInputs(prev => ({...prev, [o.id]: val}));
                              }}
                              className="w-20 text-center font-bold tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            />
                            <button 
                              onClick={() => handleVerifyOtp(o.id)} 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Verify Delivery OTP
                            </button>
                          </div>
                        </div>
                      )}"""
code = code.replace(old_buttons, new_buttons)

with open("frontend/src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("FarmerDashboard.tsx patched successfully!")
