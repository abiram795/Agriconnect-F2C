import re

with open("src/components/OrderModal.tsx", "r") as f:
    code = f.read()

old_payload = """          delivery_address: selectedAddress ? { 
            id: selectedAddress.id,
            title: selectedAddress.title,
            address_line: selectedAddress.address_line 
          } : null"""

new_payload = """          delivery_address: selectedAddress ? { 
            id: selectedAddress.id,
            title: selectedAddress.title,
            address_line: selectedAddress.address_line,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude
          } : null"""

code = code.replace(old_payload, new_payload)

with open("src/components/OrderModal.tsx", "w") as f:
    f.write(code)
