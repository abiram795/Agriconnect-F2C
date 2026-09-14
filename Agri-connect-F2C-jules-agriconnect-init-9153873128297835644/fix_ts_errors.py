import re

code = open('frontend/src/pages/DeliveryDashboard.tsx', 'r', encoding='utf-8').read()

# Fix 1: Remove unused CheckCircle from import
code = code.replace(
    'import { Truck, MapPin, Menu, CheckCircle, Navigation, Package } from "lucide-react";',
    'import { Truck, MapPin, Menu, Navigation, Package } from "lucide-react";'
)

# Fix 2: Rename unused deliveryId parameter to _deliveryId
code = code.replace(
    'const handleAcceptDelivery = async (deliveryId: string, orderId: string) => {',
    'const handleAcceptDelivery = async (_deliveryId: string, orderId: string) => {'
)

# Fix 3: Change (error) => { to (_err) => { to silence unused variable warning
code = code.replace(
    '      (error) => {\n        alert("Location permission is required for navigation.");\n        setIsNavigating(false);\n      },',
    '      (_err) => {\n        alert("Location permission is required for navigation.");\n        setIsNavigating(false);\n      },'
)

open('frontend/src/pages/DeliveryDashboard.tsx', 'w', encoding='utf-8').write(code)
print("Fixed DeliveryDashboard TypeScript errors!")
