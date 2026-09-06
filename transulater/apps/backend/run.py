import os
import sys
import uvicorn
from dotenv import load_dotenv

# Ensure the backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load .env from backend directory or parent directories
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(backend_dir, "..", "..", ".env"))

if __name__ == "__main__":
    from app.config import settings
    port = int(os.environ.get("PORT", settings.port))
    host = os.environ.get("HOST", settings.host)
    print(f"Starting Voice Assistant Backend on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
