with open("frontend/src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add states
if "const [otpInputs" not in code:
    code = code.replace(
        "const [isNavigating, setIsNavigating] = useState(false);",
        "const [isNavigating, setIsNavigating] = useState(false);\n  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});\n  const [otpError, setOtpError] = useState<string>(\"\");"
    )

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

if "const handleVerifyOtp" not in code:
    code = code.replace("  if (showProfile) {", handle_otp + "\n\n  if (showProfile) {")


# Replace Mark Delivered logic
old_buttons = """                    <div className="flex gap-2">
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
                    </div>"""

new_buttons = """                    <div className="flex flex-col gap-2">
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
                      </div>
                      
                      {o.status === 'Out for Delivery' && (
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
                      )}
                    </div>"""

code = code.replace(old_buttons, new_buttons)

import re
# Address pattern using string find since regex was flaky
addr_start = '<p className="flex items-start"><MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" /> {o.delivery_address?.address_line || "Address not provided"}</p>'
addr_replacement = """<div className="flex items-start">
  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" /> 
  <div className="text-gray-800 text-left w-full">
    {(() => {
      try {
        const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
        if (!addr || !addr.address_line) return o.delivery_address?.address_line || "Address not provided";
        return (
          <>
            <span className="font-bold block">{addr.full_name || addr.title || 'Customer'} {addr.mobile_number ? `• ${addr.mobile_number}` : ''}</span>
            <span className="block mt-1 text-gray-600">{addr.address_line}</span>
            <span className="block text-gray-600">{addr.locality ? addr.locality + ', ' : ''}{addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}</span>
            {addr.label && <span className="inline-block mt-1 bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{addr.label}</span>}
          </>
        );
      } catch (e) {
        return o.delivery_address?.address_line || "Address not provided";
      }
    })()}
  </div>
</div>"""
code = code.replace(addr_start, addr_replacement)

with open("frontend/src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("done")
