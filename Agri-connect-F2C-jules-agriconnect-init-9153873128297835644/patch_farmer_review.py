path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\frontend\src\pages\FarmerDashboard.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update lucide-react import
if 'Star' not in content:
    content = content.replace(
        'import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, ArrowLeft, History, Bell, MapPin, DollarSign, Activity, Navigation, Truck } from "lucide-react";',
        'import { Package, TrendingUp, Plus, ShieldCheck, CheckCircle, AlertTriangle, User, ArrowLeft, History, Bell, MapPin, DollarSign, Activity, Navigation, Truck, Star } from "lucide-react";'
    )

# 2. Add farmerReviews state
state_code = '''  const [farmerReviews, setFarmerReviews] = useState<{
    reviews: any[];
    average_rating: number;
    total_reviews: number;
  }>({ reviews: [], average_rating: 0, total_reviews: 0 });
  const [isLoading, setIsLoading] = useState(true);'''

if 'farmerReviews' not in content:
    content = content.replace('  const [isLoading, setIsLoading] = useState(true);', state_code)

# 3. Add fetch in fetchData
fetch_code = '''      const nRes = await fetch(`/api/notifications/${userId}`);
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData);
      }

      const rRes = await fetch(`/api/reviews/FARMER/${userId}`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setFarmerReviews(rData);
      }'''

if 'GET /api/reviews/FARMER' not in content and 'rRes' not in content:
    content = content.replace(
        '      const nRes = await fetch(`/api/notifications/${userId}`);\n      if (nRes.ok) {\n        const nData = await nRes.json();\n        setNotifications(nData);\n      }',
        fetch_code
    )

# 4. Render Customer Reviews section before Sales Overview
reviews_section = '''      {/* Customer Reviews Section */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" /> Customer Reviews & Ratings
            </h2>
            <p className="text-sm text-gray-500 mt-1">Feedback from consumers who purchased your produce</p>
          </div>
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="text-3xl font-black text-green-800">{farmerReviews.average_rating > 0 ? farmerReviews.average_rating.toFixed(1) : "N/A"}</div>
            <div className="text-xs text-green-700">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(farmerReviews.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-bold mt-0.5 block">{farmerReviews.total_reviews} total reviews</span>
            </div>
          </div>
        </div>

        {farmerReviews.reviews.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl">
            <p className="text-sm">No customer reviews received yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {farmerReviews.reviews.map((rev: any) => (
              <div key={rev.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{rev.review_text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales Overview */}'''

if 'Customer Reviews & Ratings' not in content:
    content = content.replace('{/* Sales Overview */}', reviews_section)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("FarmerDashboard.tsx patched successfully!")
