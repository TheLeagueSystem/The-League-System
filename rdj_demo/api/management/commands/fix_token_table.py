from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Fix the token table to work with api_user model'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check constraint info
            self.stdout.write("Checking constraints...")
            cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'authtoken_token' 
            AND constraint_type = 'FOREIGN KEY'
            """)
            constraints = cursor.fetchall()
            
            self.stdout.write(f"Found constraints: {constraints}")
            
            # Remove old constraints
            for constraint in constraints:
                constraint_name = constraint[0]
                self.stdout.write(f"Dropping constraint: {constraint_name}")
                cursor.execute(f"ALTER TABLE authtoken_token DROP CONSTRAINT {constraint_name}")
            
            # Add the correct constraint
            self.stdout.write("Adding new constraint...")
            cursor.execute("""
            ALTER TABLE authtoken_token 
            ADD CONSTRAINT authtoken_token_user_id_fk
            FOREIGN KEY (user_id) REFERENCES api_user(id)
            """)
            
            self.stdout.write(self.style.SUCCESS('Token table fixed successfully'))