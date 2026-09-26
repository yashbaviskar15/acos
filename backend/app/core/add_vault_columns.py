from sqlalchemy import text
from app.core.database import engine

def add_key_material_column():
    """Adds the key_material BYTEA column to arv_vault_keys if it doesn't exist."""
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE arv_vault_keys ADD COLUMN IF NOT EXISTS key_material BYTEA;"))
            conn.commit()
        except Exception as e:
            print(f"Error adding key_material column: {e}")
