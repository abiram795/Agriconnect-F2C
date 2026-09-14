from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_msgs = []
    for error in errors:
        loc = " -> ".join(str(l) for l in error.get("loc", []))
        error_msgs.append(f"{loc}: {error.get('msg')}")
    
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error: " + "; ".join(error_msgs)}
    )
