import os
import sys
from sqlalchemy import create_engine, text

def main():
    database_url = os.environ.get("DATABASE_URL", "postgresql://neondb_owner:npg_rJL0kIVv7Xuj@ep-small-pond-a5i9ohyh-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require")
    engine = create_engine(database_url)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE arv_functions ADD COLUMN IF NOT EXISTS code TEXT;"))
        conn.commit()
    print("Migration completed: added code column to arv_functions.")

if __name__ == "__main__":
    main()
