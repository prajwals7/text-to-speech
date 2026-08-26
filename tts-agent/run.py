"""
Launch script for TTS Agent Studio.
"""

import sys
import uvicorn

if __name__ == "__main__":
    port = 8000
    host = "127.0.0.1"
    print(f"\n=======================================================")
    print(f"  Starting AuraVoice Studio on http://{host}:{port}")
    print(f"=======================================================\n")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
