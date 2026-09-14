import re

with open("frontend/src/pages/ConsumerHome.tsx", "r", encoding="utf-8") as f:
    code = f.read()

pattern = r'<p className="text-xs font-semibold text-blue-600 mt-1">\{order\.fulfillment_method\}<\/p>\s*<\/div>'

replacement = """<p className="text-xs font-semibold text-blue-600 mt-1">{order.fulfillment_method}</p>
                        
                        {order.fulfillment_method === 'Farmer Delivery' && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-xs text-blue-800 font-bold mb-2 tracking-wider">DELIVERY VERIFICATION</p>
                            {activeOtps[order.id] ? (
                              <div>
                                <p className="text-3xl font-black tracking-[0.2em] text-blue-900 mb-1">{activeOtps[order.id]}</p>
                                <p className="text-xs text-blue-700 font-medium">Give this OTP to the farmer only after your order arrives.</p>
                                <button onClick={() => generateNewOtp(order.id)} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3"/> Request New Code</button>
                              </div>
                            ) : (
                              <button onClick={() => fetchOtp(order.id)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm">
                                View Delivery Code
                              </button>
                            )}
                          </div>
                        )}
                      </div>"""

code = re.sub(pattern, replacement, code)

with open("frontend/src/pages/ConsumerHome.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("ConsumerHome.tsx updated with OTP details!")
