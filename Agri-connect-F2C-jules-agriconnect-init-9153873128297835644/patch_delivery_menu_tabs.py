path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\frontend\src\pages\DeliveryDashboard.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update activeTab state type
content = content.replace(
    'const [activeTab, setActiveTab] = useState<"license" | "reviews" | "personal" | "vehicle">("personal");',
    'const [activeTab, setActiveTab] = useState<"license" | "reviews" | "personal" | "vehicle" | "history" | "earnings">("personal");'
)

# Update Menu Nav Tabs grid to grid-cols-3 sm:grid-cols-6 with history and earnings tabs
tabs_nav = '''            {/* Menu Nav Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
              <button 
                onClick={() => setActiveTab("personal")}
                className={`py-3 border-b-2 ${activeTab === "personal" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("vehicle")}
                className={`py-3 border-b-2 ${activeTab === "vehicle" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Vehicle
              </button>
              <button 
                onClick={() => setActiveTab("license")}
                className={`py-3 border-b-2 ${activeTab === "license" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                License
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`py-3 border-b-2 ${activeTab === "reviews" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Reviews
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`py-3 border-b-2 ${activeTab === "history" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                History
              </button>
              <button 
                onClick={() => setActiveTab("earnings")}
                className={`py-3 border-b-2 ${activeTab === "earnings" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Earnings
              </button>
            </div>'''

old_tabs_nav = '''            {/* Menu Nav Tabs */}
            <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
              <button 
                onClick={() => setActiveTab("personal")}
                className={`py-3 border-b-2 ${activeTab === "personal" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("vehicle")}
                className={`py-3 border-b-2 ${activeTab === "vehicle" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Vehicle
              </button>
              <button 
                onClick={() => setActiveTab("license")}
                className={`py-3 border-b-2 ${activeTab === "license" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                License
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`py-3 border-b-2 ${activeTab === "reviews" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                Reviews
              </button>
            </div>'''

content = content.replace(old_tabs_nav, tabs_nav)

# Add Tab content for History & Earnings
tab_content_additions = '''
              {/* 5. DELIVERY HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><Package className="w-5 h-5 mr-2 text-blue-600"/> Delivery History</h4>
                  {completedDeliveries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg">No completed deliveries yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {completedDeliveries.map((cd: any) => (
                        <div key={cd.order_id} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">Order #{cd.order_id.slice(0,8)}</p>
                              <p className="text-xs text-slate-400">{new Date(cd.date).toLocaleDateString()}</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">₹{cd.fee}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-600">
                            <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-500"/> Dropoff: {renderFormattedAddress(cd.customer_address)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. EARNINGS */}
              {activeTab === "earnings" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center text-lg"><Star className="w-5 h-5 mr-2 text-yellow-500"/> Earnings Overview</h4>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs uppercase font-bold tracking-wider text-blue-100">Total Lifetime Earnings</p>
                    <p className="text-3xl font-black mt-1">₹{totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-blue-200 mt-2">Rate: ₹30 per completed delivery</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center text-sm font-semibold">
                    <span>Completed Deliveries</span>
                    <span className="text-blue-600 font-bold">{completedDeliveries.length}</span>
                  </div>
                </div>
              )}
'''

content = content.replace(
    '{/* 4. REVIEWS */}',
    tab_content_additions + '\n              {/* 4. REVIEWS */}'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("DeliveryDashboard.tsx updated with 6 menu tabs successfully!")
