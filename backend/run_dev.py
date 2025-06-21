import os

import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    uvicorn.run(
        "evalassist.main:app",
        host=os.getenv("NEXT_PUBLIC_BACKEND_API_HOST", "http://127.0.0.1:8000").split(
            ":"
        )[1][2:],
        port=8000,
        reload=True,
        loop="asyncio",
        workers=1,
    )
