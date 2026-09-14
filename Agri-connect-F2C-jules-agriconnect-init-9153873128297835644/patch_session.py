import re

with open("frontend/src/components/AddressForm.tsx", "r", encoding="utf-8") as f:
    code = f.read()

submit_old = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobileNumber.trim() || !addressLine.trim() || !city.trim() || !pincode.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    
    setIsLoading(true);"""

submit_new = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consumerId || consumerId === "00000000-0000-0000-0000-000000000000") {
      setError("Your session has expired. Please login again.");
      return;
    }
    
    if (!fullName.trim() || !mobileNumber.trim() || !addressLine.trim() || !city.trim() || !pincode.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    
    setIsLoading(true);"""

code = code.replace(submit_old, submit_new)

with open("frontend/src/components/AddressForm.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Session validation added to AddressForm")
