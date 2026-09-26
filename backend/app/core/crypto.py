"""Real AES-256-GCM encryption/decryption for ArvVault."""
import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

# Read SECRET_KEY from env, fallback to empty to avoid error if not set, 
# but in real life it should be set
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-dev")

# Derive a 32-byte key from the SECRET_KEY for AES-256-GCM
hkdf = HKDF(
    algorithm=hashes.SHA256(),
    length=32,
    salt=None,
    info=b"platform-master-key-context"
)
PLATFORM_MASTER_KEY = hkdf.derive(SECRET_KEY.encode('utf-8'))

def generate_key_material() -> tuple[bytes, str]:
    """Generate a 256-bit AES key. Returns (raw_key_bytes, hex_hash_of_key)."""
    key = AESGCM.generate_key(bit_length=256)
    key_hash = hashlib.sha256(key).hexdigest()
    return key, key_hash

def encrypt_aes256gcm(key: bytes, plaintext: str) -> str:
    """Encrypt plaintext with AES-256-GCM. Returns base64-encoded nonce+ciphertext."""
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce
    ct = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    return base64.b64encode(nonce + ct).decode('utf-8')

def decrypt_aes256gcm(key: bytes, ciphertext_b64: str) -> str:
    """Decrypt base64-encoded nonce+ciphertext with AES-256-GCM."""
    raw = base64.b64decode(ciphertext_b64)
    nonce = raw[:12]
    ct = raw[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None).decode('utf-8')
