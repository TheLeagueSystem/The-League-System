from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Migrate users from auth_user to api_user table'

    def handle(self, *args, **kwargs):
        try:
            with connection.cursor() as cursor:
                # Check if auth_user has records
                cursor.execute("SELECT COUNT(*) FROM auth_user")
                count = cursor.fetchone()[0]
                self.stdout.write(f"Found {count} users in auth_user table")
                
                if count > 0:
                    # Get the next ID to use in api_user
                    cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM api_user")
                    next_id = cursor.fetchone()[0]
                    
                    # Copy users from auth_user to api_user
                    cursor.execute("""
                    INSERT INTO api_user (
                        id, password, last_login, is_superuser, username, 
                        first_name, last_name, email, is_staff, is_active, 
                        date_joined, is_admin, is_debater, is_adjudicator
                    )
                    SELECT 
                        id + %s, password, last_login, is_superuser, username, 
                        first_name, last_name, email, is_staff, is_active, 
                        date_joined, is_staff, FALSE, FALSE
                    FROM 
                        auth_user
                    WHERE 
                        id NOT IN (SELECT id FROM api_user)
                    """, [next_id - 1])  # Offset IDs to avoid conflicts
                    
                    # Get count of migrated users
                    self.stdout.write(self.style.SUCCESS(f"Migrated users to api_user table"))
                    
                    # Update auth tokens to point to new users
                    cursor.execute("""
                    ALTER TABLE authtoken_token
                    DROP CONSTRAINT IF EXISTS authtoken_token_user_id_35299eff_fk_auth_user_id
                    """)
                    
                    cursor.execute("""
                    ALTER TABLE authtoken_token
                    ADD CONSTRAINT authtoken_token_user_id_fk
                    FOREIGN KEY (user_id) REFERENCES api_user(id)
                    ON DELETE CASCADE
                    """)
                    
                    self.stdout.write(self.style.SUCCESS("Updated token foreign key constraints"))
                    
                else:
                    self.stdout.write("No users to migrate")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during migration: {str(e)}"))