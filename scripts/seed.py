import sys
import os
import uuid

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash, generate_mfa_secret
from app.services.arvgate.models import User, AuditLog

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@aravanta.cloud").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@aravanta.cloud",
                full_name="Super Administrator",
                hashed_password=get_password_hash("AravantaAdmin2026!"),
                role="SuperAdmin",
                is_active=True,
                mfa_secret=generate_mfa_secret()
            )
            db.add(admin)
            print("[+] Created SuperAdmin: admin@aravanta.cloud / AravantaAdmin2026!")

        # Check if developer user exists
        dev = db.query(User).filter(User.email == "developer@aravanta.cloud").first()
        if not dev:
            dev = User(
                id=str(uuid.uuid4()),
                email="developer@aravanta.cloud",
                full_name="Lead Developer",
                hashed_password=get_password_hash("AravantaDev2026!"),
                role="Developer",
                is_active=True,
                mfa_secret=generate_mfa_secret()
            )
            db.add(dev)
            print("[+] Created Developer: developer@aravanta.cloud / AravantaDev2026!")

        # Seed initial audit log entry
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_email="system@aravanta.cloud",
            action="SEED_DATABASE",
            resource="Database",
            ip_address="127.0.0.1",
            details="Initial database seeding completed successfully"
        )
        db.add(audit)
        
        db.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
