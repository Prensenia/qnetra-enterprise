import hashlib, os, base64

ITERATIONS = 200000

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(ITERATIONS, base64.b64encode(salt).decode(), base64.b64encode(dk).decode())

def verify_password(stored: str, password: str) -> bool:
    if not stored:
        return False
    if stored.startswith("pbkdf2_sha256$"):
        try:
            _, iters, salt_b64, dk_b64 = stored.split("$", 3)
            salt = base64.b64decode(salt_b64)
            dk = base64.b64decode(dk_b64)
            calc = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iters))
            return hashlib.compare_digest(calc, dk)
        except Exception:
            return False
    return stored == password
