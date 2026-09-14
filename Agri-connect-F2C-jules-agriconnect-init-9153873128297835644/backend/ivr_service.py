from pydantic import BaseModel

class IVRWebhookRequest(BaseModel):
    CallSid: str
    From: str
    To: str
    Digits: str = ""

class IVRResponse(BaseModel):
    twiml: str

def handle_incoming_call(req: IVRWebhookRequest) -> IVRResponse:
    # A mock simplified Twilio TwiML response
    twiml_response = """
    <Response>
        <Gather numDigits="1" action="/api/ivr/input" method="POST">
            <Say language="ta-IN" voice="Polly.Aditi">வணக்கம். AgriConnect-க்கு வரவேற்கிறோம்.</Say>
            <Say language="ta-IN" voice="Polly.Aditi">காய்கறிகளை சேர்க்க ஒன்று அழுத்தவும்.</Say>
            <Say language="ta-IN" voice="Polly.Aditi">பழங்களை சேர்க்க இரண்டு அழுத்தவும்.</Say>
            <Say language="ta-IN" voice="Polly.Aditi">சிறுதானியங்களை சேர்க்க மூன்று அழுத்தவும்.</Say>
            <Say language="ta-IN" voice="Polly.Aditi">இன்றைய ஆர்டர்களை பார்க்க நான்கு அழுத்தவும்.</Say>
            <Say language="ta-IN" voice="Polly.Aditi">உதவிக்கு ஐந்து அழுத்தவும்.</Say>
        </Gather>
    </Response>
    """
    return IVRResponse(twiml=twiml_response)

def handle_digit_input(req: IVRWebhookRequest) -> IVRResponse:
    if req.Digits == "1":
        response_text = "காய்கறிகளை சேர்க்க தயார். தயவுசெய்து காய்கறி பெயர் மற்றும் அளவை கூறவும்."
    elif req.Digits == "2":
        response_text = "பழங்களை சேர்க்க தயார். தயவுசெய்து பழம் பெயர் மற்றும் அளவை கூறவும்."
    elif req.Digits == "3":
        response_text = "சிறுதானியங்களை சேர்க்க தயார். தயவுசெய்து தானியத்தின் பெயர் மற்றும் அளவை கூறவும்."
    elif req.Digits == "4":
        response_text = "உங்களுக்கு இன்று இரண்டு ஆர்டர்கள் உள்ளன. ஒன்று: 3 கிலோ தக்காளி. இரண்டு: 2 கிலோ வெங்காயம்."
    elif req.Digits == "5":
        response_text = "எங்கள் வாடிக்கையாளர் சேவை பிரதிநிதி விரைவில் உங்களுடன் இணைக்கப்படுவார்."
    else:
        response_text = "தவறான பதிவு. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."

    twiml_response = f"""
    <Response>
        <Say language="ta-IN" voice="Polly.Aditi">{response_text}</Say>
    </Response>
    """
    return IVRResponse(twiml=twiml_response)
