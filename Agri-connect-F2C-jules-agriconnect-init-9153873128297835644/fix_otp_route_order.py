code = open('backend/main.py', 'r', encoding='utf-8').read()

role_route = '@app.get("/api/orders/{role}/{user_id}")'
otp_route = '@app.get("/api/orders/{order_id}/delivery-otp")'

idx_role = code.find(role_route)
idx_otp = code.find(otp_route)

if idx_role < idx_otp:
    role_block_end = code.find('\n@app.get("/api/orders/{order_id}/delivery-otp")', idx_role)
    role_block = code[idx_role:role_block_end]
    otp_block = code[role_block_end:]
    
    code = code[:idx_role] + otp_block + "\n\n" + role_block
    print("Reordered OTP routes above role route!")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated main.py!")
