import os
from dotenv import load_dotenv

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development")
TZ = os.getenv("TZ", "Asia/Kolkata")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cybernautics-qnetra-super-secret-jwt-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "qnetra_enterprise")
POSTGRES_USER = os.getenv("POSTGRES_USER", "qnetra_admin")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "qnetra_pg_secure_2026")

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "qnetra_neo4j_secure_2026")

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ALCHEMY_RPC_URL = os.getenv("ALCHEMY_RPC_URL", "")
TRONGRID_API_KEY = os.getenv("TRONGRID_API_KEY", "")
