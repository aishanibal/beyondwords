#!/usr/bin/env python3
"""
Check what password the hash corresponds to
"""

import hashlib

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

# The hash from admin_config.json
stored_hash = "a0a63a178c269cb13803a67a1f79869f048372e20c9ad6932b7c84cad0a58538"

# Test common passwords
test_passwords = ["admin123", "admin", "password", "123456", "admin123!"]

print("Testing passwords against stored hash:")
print(f"Stored hash: {stored_hash}")
print()

for password in test_passwords:
    test_hash = hash_password(password)
    matches = test_hash == stored_hash
    print(f"Password: '{password}' -> Hash: {test_hash} -> Matches: {matches}")

# Also test the exact password from the test
test_hash = hash_password("admin123")
print(f"\nTest password 'admin123' hash: {test_hash}")
print(f"Matches stored hash: {test_hash == stored_hash}") 