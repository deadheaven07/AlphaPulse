import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in project root or backend
root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
backend_env = Path(__file__).resolve().parent.parent.parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
else:
    load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
_backend_db = Path(__file__).resolve().parent.parent.parent / "alphapulse.db"
_data_db = Path(__file__).resolve().parent.parent.parent / "data" / "alphapulse.db"
_default_db = _backend_db if _backend_db.exists() else _data_db
DB_PATH = os.getenv("DB_PATH", str(_default_db))
