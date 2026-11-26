import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.store import CASES
print("Seeded cases:", list(CASES.keys()))
for cid, c in CASES.items():
    print(cid, c["title"], c["total_inr"])
