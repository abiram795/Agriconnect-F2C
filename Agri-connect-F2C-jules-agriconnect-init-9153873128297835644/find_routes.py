import re

code = open('backend/main.py', 'r', encoding='utf-8').read()
matches = re.finditer(r'@app\.(get|post|patch|put|delete)\("/api/orders[^"]*"', code)
for m in matches:
    print(m.group(0), 'at line', code[:m.start()].count('\n') + 1)
