import re

with open("frontend/src/components/AddressForm.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_error_handling = """      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save address");
      }"""

new_error_handling = """      if (!res.ok) {
        let errStr = "Failed to save address";
        try {
          const err = await res.json();
          errStr = err.detail || err.message || errStr;
        } catch (e) {
          errStr = "Server error. Please try again later.";
        }
        throw new Error(errStr);
      }"""

code = code.replace(old_error_handling, new_error_handling)

with open("frontend/src/components/AddressForm.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("AddressForm.tsx patched successfully!")
