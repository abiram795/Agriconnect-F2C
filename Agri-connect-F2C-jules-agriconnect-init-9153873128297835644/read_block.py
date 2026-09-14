code = open('backend/main.py', 'r', encoding='utf-8').read()
marker = '@app.post("/api/farmers/register"'
idx = code.find(marker)
print(repr(code[idx:idx+2500]))
