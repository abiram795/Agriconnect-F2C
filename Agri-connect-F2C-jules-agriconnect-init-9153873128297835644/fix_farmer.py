import re

with open("frontend/src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add states if not present
if "const [otpInputs" not in code:
    code = code.replace(
        "const [isNavigating, setIsNavigating] = useState(false);",
        "const [isNavigating, setIsNavigating] = useState(false);\n  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});\n  const [otpError, setOtpError] = useState<string>(\"\");"
    )

# Add handleVerifyOtp if not present
if "const handleVerifyOtp" not in code:
    handle_status = """  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/farmer-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
    }
  };"""
    
    if handle_status not in code:
        # try a softer match
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
    
    # We will just inject handleVerifyOtp before return ( if it fails
    code = code.replace("  if (showProfile) {", handle_otp + "\n\n  if (showProfile) {")


# Replace Mark Delivered button
old_button = """                    <div className="flex gap-2">
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

new_button = """                    <div className="flex flex-col gap-2">
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
code = code.replace(old_button, new_button)

# Fix Address Rendering
address_regex_old = r'<p className="flex items-start"><MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" /> {o\.delivery_address\?\.address_line \|\| "Address not provided"}</p>'
address_regex_new = """<div className="flex items-start">
  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0 text-gray-400" /> 
  <div className="text-gray-800">
    {(() => {
      try {
        const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
        if (!addr) return "Address not provided";
        return (
          <>
            <span className="font-bold block">{addr.full_name || addr.title || 'Customer'} {addr.mobile_number ? `• ${addr.mobile_number}` : ''}</span>
            <span className="block mt-1 text-gray-600">{addr.address_line}</span>
            <span className="block text-gray-600">{addr.locality ? addr.locality + ', ' : ''}{addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}</span>
            {addr.label && <span className="inline-block mt-1 bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{addr.label}</span>}
          </>
        );
      } catch (e) {
        return o.delivery_address || "Address not provided";
      }
    })()}
  </div>
</div>"""

code = re.sub(address_regex_old, address_regex_new, code)

# Fix Map Location
map_regex_old = r'\{o\.delivery_address\?\.latitude && o\.delivery_address\?\.longitude \? \('
map_regex_new = """{(() => {
                      let lat, lng;
                      try {
                        const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
                        lat = addr?.latitude;
                        lng = addr?.longitude;
                      } catch (e) {}
                      return lat && lng;
                    })() ? ("""
code = re.sub(map_regex_old, map_regex_new, code)

nav_old = r'onClick=\{\(\) => handleNavigate\(o\.delivery_address\.latitude, o\.delivery_address\.longitude\)\}'
nav_new = """onClick={() => {
                        let lat, lng;
                        try {
                          const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
                          lat = addr?.latitude;
                          lng = addr?.longitude;
                        } catch (e) {}
                        handleNavigate(lat, lng);
                      }}"""
code = re.sub(nav_old, nav_new, code)

# Fix handleNavigate to use navigator.geolocation
handle_nav_old = """  const handleNavigate = (lat: number, lng: number) => {
    setIsNavigating(true);
    // Simulating GPS location fetch
    setTimeout(() => {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=11.0168,76.9558&destination=${lat},${lng}`, '_blank');
      setIsNavigating(false);
    }, 1000);
  };"""

handle_nav_new = """  const handleNavigate = (lat: number, lng: number) => {
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
  };"""

if handle_nav_old in code:
    code = code.replace(handle_nav_old, handle_nav_new)

with open("frontend/src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("FarmerDashboard.tsx fixed completely!")
