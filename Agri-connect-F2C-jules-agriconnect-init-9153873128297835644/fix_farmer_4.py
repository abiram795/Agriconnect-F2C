import re

with open("frontend/src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Try to find the button block
match = re.search(r'<button[^>]*onClick=\{\(\) => handleStatusUpdate\(o\.id, \'Delivered\'\)\}[^>]*>\s*Mark Delivered\s*</button>', code)
if match:
    print("Found 'Mark Delivered' button!")
    
    # We will replace the entire enclosing div that has the buttons
    start_tag = r'<div className="flex gap-2">'
    end_tag = r'</button>\s*\}\)\}\s*</div>'
    
    # Just do a regex substitute for the whole button group block
    pattern = r'<div className="flex gap-2">\s*\{o\.status === \'Order Placed\' && \([\s\S]*?Mark Delivered\s*<\/button>\s*\)\}\s*<\/div>'
    
    new_buttons = """<div className="flex flex-col gap-2">
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
    
    code = re.sub(pattern, new_buttons, code)
    print("Replaced!")
    
with open("frontend/src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
