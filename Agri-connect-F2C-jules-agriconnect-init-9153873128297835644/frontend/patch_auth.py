import re

with open("src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_auth_check = """    const userId = localStorage.getItem('agriconnect_user_id');
    if (!userId) {
      setIsLoading(false);
      return;
    }"""

new_auth_check = """    const userId = localStorage.getItem('agriconnect_user_id');
    if (!userId) {
      alert("Your session has expired. Please log in again.");
      window.location.href = '/farmer-login';
      return;
    }"""

code = code.replace(old_auth_check, new_auth_check)

with open("src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
