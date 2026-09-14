import re

with open("frontend/src/components/OrderModal.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Fix Address interface
old_interface = """interface Address {
  id: string;
  title: string;
  address_line: string;
  latitude?: number;
  longitude?: number;
}"""

new_interface = """interface Address {
  id: string;
  label: string;
  full_name: string;
  mobile_number: string;
  address_line: string;
  locality?: string;
  city: string;
  state?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}"""

if old_interface in code:
    code = code.replace(old_interface, new_interface)

# Fix default address selection
old_effect = """        if (res.ok) {
          const data = await res.json();
          setAddresses(data);
          if (data.length > 0) {
            setSelectedAddress(data[0]);
          }
        }"""
new_effect = """        if (res.ok) {
          const data = await res.json();
          setAddresses(data);
          const defAddr = data.find((a: any) => a.is_default);
          if (defAddr) {
            setSelectedAddress(defAddr);
          } else if (data.length > 0) {
            setSelectedAddress(data[0]);
          }
        }"""
code = code.replace(old_effect, new_effect)

# Fix payload
old_payload = """          delivery_address: selectedAddress ? { 
            id: selectedAddress.id,
            title: selectedAddress.title,
            address_line: selectedAddress.address_line,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude
          } : null"""
new_payload = """          delivery_address: selectedAddress ? { 
            id: selectedAddress.id,
            label: selectedAddress.label,
            full_name: selectedAddress.full_name,
            mobile_number: selectedAddress.mobile_number,
            address_line: selectedAddress.address_line,
            locality: selectedAddress.locality,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude
          } : null"""
code = code.replace(old_payload, new_payload)

# Fix rendering
old_render = """                      <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input 
                          type="radio" 
                          name="address" 
                          checked={selectedAddress?.id === addr.id} 
                          onChange={() => setSelectedAddress(addr)}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-bold block text-gray-800 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" /> {addr.title}
                          </span>
                          <span className="text-sm text-gray-600 block mt-1 whitespace-pre-wrap">
                            {addr.address_line}
                          </span>
                        </div>
                      </label>"""
new_render = """                      <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input 
                          type="radio" 
                          name="address" 
                          checked={selectedAddress?.id === addr.id} 
                          onChange={() => setSelectedAddress(addr)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-gray-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-green-600" /> {addr.label}
                            </span>
                          </div>
                          <span className="text-sm text-gray-800 font-medium block mt-1">
                            {addr.full_name} • {addr.mobile_number}
                          </span>
                          <span className="text-sm text-gray-600 block mt-1">
                            {addr.address_line}
                          </span>
                          <span className="text-sm text-gray-600 block">
                            {addr.locality ? addr.locality + ', ' : ''}{addr.city}, {addr.state} - {addr.pincode}
                          </span>
                        </div>
                      </label>"""
code = code.replace(old_render, new_render)

with open("frontend/src/components/OrderModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("OrderModal.tsx patched successfully!")
