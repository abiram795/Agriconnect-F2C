import re

with open("src/pages/FarmerDashboard.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Remove from old position
old_is_nav_code = """  const [isNavigating, setIsNavigating] = useState(false);"""
code = code.replace(old_is_nav_code, "")

# Add to the top
top_hooks = """  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);"""

new_top_hooks = """  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);"""

code = code.replace(top_hooks, new_top_hooks)

with open("src/pages/FarmerDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(code)
