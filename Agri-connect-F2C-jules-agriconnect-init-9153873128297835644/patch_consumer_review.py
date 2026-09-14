import re

path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\frontend\src\pages\ConsumerHome.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update lucide-react import
if 'Star' not in content:
    content = content.replace(
        'import { Search, MapPin, AlertTriangle, Users, Image as ImageIcon, Bell, Clock, X } from "lucide-react";',
        'import { Search, MapPin, AlertTriangle, Users, Image as ImageIcon, Bell, Clock, X, Star } from "lucide-react";'
    )

# 2. Add state
state_code = '''  const [reviewModalTarget, setReviewModalTarget] = useState<{
    orderId: string;
    revieweeType: 'FARMER' | 'DELIVERY_PARTNER';
    revieweeId: string;
    targetName: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<Record<string, boolean>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const consumerId = localStorage.getItem("agriconnect_user_id")'''

if 'reviewModalTarget' not in content:
    content = content.replace('  const consumerId = localStorage.getItem("agriconnect_user_id")', state_code)

# 3. Add handleReviewSubmit
submit_code = '''
  const handleReviewSubmit = async () => {
    if (!reviewModalTarget) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: reviewModalTarget.orderId,
          consumer_id: consumerId,
          reviewee_type: reviewModalTarget.revieweeType,
          reviewee_id: reviewModalTarget.revieweeId,
          rating: reviewRating,
          review_text: reviewText
        })
      });
      if (res.ok) {
        const key = `${reviewModalTarget.orderId}_${reviewModalTarget.revieweeType}`;
        setReviewSubmitted(prev => ({ ...prev, [key]: true }));
        setReviewModalTarget(null);
        setReviewText("");
        setSuccessMessage("Thank you! Your review has been submitted.");
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit review");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBulkSubmit = async () => {'''

if 'handleReviewSubmit' not in content:
    content = content.replace('  const handleBulkSubmit = async () => {', submit_code)

# 4. Add review buttons inside order list item
buttons_code = '''
                        {['Delivered', 'Completed'].includes(order.status) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                            {order.fulfillment_method === 'Delivery Partner' && (
                              <button
                                disabled={reviewSubmitted[`${order.id}_DELIVERY_PARTNER`]}
                                onClick={() => setReviewModalTarget({
                                  orderId: order.id,
                                  revieweeType: 'DELIVERY_PARTNER',
                                  revieweeId: order.delivery_partner_id || order.deliveries?.[0]?.delivery_partner_id || "00000000-0000-0000-0000-000000000001",
                                  targetName: "Delivery Partner"
                                })}
                                className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                {reviewSubmitted[`${order.id}_DELIVERY_PARTNER`] ? '✓ Delivery Partner Reviewed' : 'Rate Delivery Partner'}
                              </button>
                            )}
                            <button
                              disabled={reviewSubmitted[`${order.id}_FARMER`]}
                              onClick={() => setReviewModalTarget({
                                orderId: order.id,
                                revieweeType: 'FARMER',
                                revieweeId: order.farmer_id || order.products?.farmer_id || "00000000-0000-0000-0000-000000000000",
                                targetName: order.users?.name || "Farmer"
                              })}
                              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                              {reviewSubmitted[`${order.id}_FARMER`] ? '✓ Farmer Reviewed' : 'Rate Farmer'}
                            </button>
                          </div>
                        )}
                      </div>
                  </div>'''

if 'Rate Delivery Partner' not in content:
    content = content.replace('                      </div>\n                  </div>', buttons_code)

# 5. Add Review Modal
modal_code = '''
      {reviewModalTarget && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Review {reviewModalTarget.targetName}</h3>
              <button onClick={() => setReviewModalTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience (prompt delivery, fresh quality, polite service...)"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setReviewModalTarget(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={handleReviewSubmit} disabled={isSubmittingReview} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}'''

if 'reviewModalTarget &&' not in content:
    content = content.replace('    </div>\n  );\n}', modal_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ConsumerHome.tsx patched successfully!")
