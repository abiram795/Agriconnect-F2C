import re

with open("frontend/src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Fix Map Location rendering
map_pattern = r'\{o\.delivery_address\?\.latitude && o\.delivery_address\?\.longitude \? \([\s\S]*?onClick=\{\(\) => handleNavigate\(o\.delivery_address\.latitude, o\.delivery_address\.longitude\)\}[\s\S]*?Map location unavailable[\s\S]*?<\/div>\s*\}\)'
map_replacement = """{(() => {
                      let lat, lng;
                      try {
                        const addr = typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address;
                        lat = addr?.latitude;
                        lng = addr?.longitude;
                      } catch (e) {}
                      if (lat && lng) {
                        return (
                          <button 
                            onClick={() => handleNavigate(lat, lng)}
                            disabled={isNavigating}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors"
                          >
                            <Navigation className="w-4 h-4 mr-1" /> {isNavigating ? 'Locating...' : 'Navigate to Customer'}
                          </button>
                        );
                      }
                      return (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded text-center border border-orange-100">
                          Customer map location is not available for this address.
                        </div>
                      );
                    })()}"""
code = re.sub(map_pattern, map_replacement, code)

# Fix handleNavigate
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

code = code.replace(handle_nav_old, handle_nav_new)

with open("frontend/src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Map location fixed")
