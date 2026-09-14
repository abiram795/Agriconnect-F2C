import re

with open("src/pages/ConsumerHome.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_status = r'<span className="bg-gray-200 text-gray-800 text-xs px-2 py-0\.5 rounded-full">\{order\.status\}</span>'

new_status = """<span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            {order.fulfillment_method === 'Farmer Delivery' && order.status === 'Preparing' ? 'Farmer is preparing your order' : 
                             order.fulfillment_method === 'Farmer Delivery' && order.status === 'Out for Delivery' ? 'Farmer is on the way' : 
                             order.status}
                          </span>"""

code = re.sub(old_status, new_status, code)

# Also show the fulfillment method
old_details_pattern = r'(<p className="text-xs text-gray-500">From: \{order\.users\?\.name \|\| "Farmer"\} [^<]+ \{new Date\(order\.created_at\)\.toLocaleDateString\(\)\}</p>)'

new_details_pattern = r'\1\n                        <p className="text-xs font-semibold text-blue-600 mt-1">{order.fulfillment_method}</p>'

code = re.sub(old_details_pattern, new_details_pattern, code)

with open("src/pages/ConsumerHome.tsx", "w", encoding="utf-8") as f:
    f.write(code)
