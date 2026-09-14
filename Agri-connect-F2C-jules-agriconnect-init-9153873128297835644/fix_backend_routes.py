import re

with open("backend/main.py", "r") as f:
    content = f.read()

# Replace the first instance of @app.post("/api/orders" with @app.post("/api/orders_mock"
content = content.replace('@app.post("/api/orders", response_model=OrderResponse)', '@app.post("/api/orders_mock", response_model=OrderResponse)', 1)

with open("backend/main.py", "w") as f:
    f.write(content)
