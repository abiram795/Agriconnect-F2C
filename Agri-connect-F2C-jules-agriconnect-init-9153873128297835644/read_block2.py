code = open('backend/main.py', 'r', encoding='utf-8').read()
marker = '@app.post("/api/delivery/register"'
idx = code.find(marker)
print(f"Found at {idx}")
print(repr(code[idx:idx+2000]))
