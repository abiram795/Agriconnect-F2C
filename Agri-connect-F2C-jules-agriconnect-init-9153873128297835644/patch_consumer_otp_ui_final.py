path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\frontend\src\pages\ConsumerHome.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add otpLoading state if not present
if 'otpLoading' not in content:
    content = content.replace(
        'const [activeOtps, setActiveOtps] = useState<Record<string, string>>({});',
        'const [activeOtps, setActiveOtps] = useState<Record<string, string>>({});\n  const [otpLoading, setOtpLoading] = useState<Record<string, boolean>>({});\n  const [otpError, setOtpError] = useState<Record<string, string>>({});'
    )

# Update fetchOtp logic
old_fetch_otp = '''  const fetchOtp = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery-otp`);
      if (res.ok) {
        const data = await res.json();
        setActiveOtps(prev => ({ ...prev, [orderId]: data.otp }));
      }
    } catch (err) {
      console.error(err);
    }
  };'''

new_fetch_otp = '''  const fetchOtp = async (orderId: string) => {
    setOtpLoading(prev => ({ ...prev, [orderId]: true }));
    setOtpError(prev => ({ ...prev, [orderId]: "" }));
    try {
      const res = await fetch(`/api/orders/${orderId}/delivery-otp`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.otp) {
          setActiveOtps(prev => ({ ...prev, [orderId]: String(data.otp) }));
        } else {
          setOtpError(prev => ({ ...prev, [orderId]: "OTP unavailable" }));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setOtpError(prev => ({ ...prev, [orderId]: errData.detail || "Failed to fetch OTP" }));
      }
    } catch (err) {
      console.error(err);
      setOtpError(prev => ({ ...prev, [orderId]: "Network error" }));
    } finally {
      setOtpLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };'''

content = content.replace(old_fetch_otp, new_fetch_otp)

# Update View Delivery Code UI block
old_otp_ui = '''                        {['Farmer Delivery', 'Delivery Partner'].includes(order.fulfillment_method) && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-xs text-blue-800 font-bold mb-2 tracking-wider">DELIVERY VERIFICATION</p>
                            {activeOtps[order.id] ? (
                              <div>
                                <p className="text-3xl font-black tracking-[0.2em] text-blue-900 mb-1">{activeOtps[order.id]}</p>
                                <p className="text-xs text-blue-700 font-medium">Give this OTP to the delivery person only after your order arrives.</p>
                                <button onClick={() => generateNewOtp(order.id)} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3"/> Request New Code</button>
                              </div>
                            ) : (
                              <button onClick={() => fetchOtp(order.id)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm">
                                View Delivery Code
                              </button>
                            )}
                          </div>
                        )}'''

new_otp_ui = '''                        {['Farmer Delivery', 'Delivery Partner'].includes(order.fulfillment_method) && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-xs text-blue-800 font-bold mb-2 tracking-wider">DELIVERY VERIFICATION</p>
                            {activeOtps[order.id] ? (
                              <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">Your Delivery OTP:</p>
                                <p className="text-3xl font-black tracking-[0.2em] text-blue-900 mb-1">{activeOtps[order.id]}</p>
                                <p className="text-xs text-blue-700 font-medium">Share this OTP with the delivery partner when your order reaches you.</p>
                                <button onClick={() => generateNewOtp(order.id)} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3"/> Request New Code</button>
                              </div>
                            ) : (
                              <div>
                                {otpError[order.id] && <p className="text-xs text-red-600 font-bold mb-2">{otpError[order.id]}</p>}
                                <button 
                                  onClick={() => fetchOtp(order.id)} 
                                  disabled={otpLoading[order.id]} 
                                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 transition-colors"
                                >
                                  {otpLoading[order.id] ? 'Fetching Code...' : 'View Delivery Code'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}'''

content = content.replace(old_otp_ui, new_otp_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ConsumerHome.tsx updated with enhanced OTP UI and error handling successfully!")
