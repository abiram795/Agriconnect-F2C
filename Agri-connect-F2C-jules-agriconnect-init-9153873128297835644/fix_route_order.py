code = open('backend/main.py', 'r', encoding='utf-8').read()

# Fix route ordering: place delivery-otp and generate-otp ABOVE generic /api/orders/{role}/{user_id}
generic_route = '@app.get("/api/orders/{role}/{user_id}")'
otp_route = '@app.get("/api/orders/{order_id}/delivery-otp")'

if code.find(generic_route) < code.find(otp_route):
    # Move OTP routes above generic route
    gen_idx = code.find(generic_route)
    gen_end = code.find('\n@app.', gen_idx)
    gen_block = code[gen_idx:gen_end]

    otp_idx = code.find(otp_route)
    gen2_end = code.find('\n# ---', otp_idx)
    if gen2_end == -1:
        gen2_end = len(code)
    otp_block = code[otp_idx:]

    # Clean removal and relocation
    code = code[:gen_idx] + code[gen_end:otp_idx] + gen_block + "\n\n" + otp_block
    print("Reordered routes in main.py!")

open('backend/main.py', 'w', encoding='utf-8').write(code)
print("Updated main.py!")
