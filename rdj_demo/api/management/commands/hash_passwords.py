# In api/management/commands/hash_passwords.py
from django.core.management.base import BaseCommand
from api.models import User

class Command(BaseCommand):
    help = 'Hash plain text passwords in the database'

    def handle(self, *args, **options):
        users = User.objects.all()
        count = 0
        
        for user in users:
            # Better check for unhashed passwords - they won't start with algorithm identifiers
            if not user.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
                self.stdout.write(f"Hashing password for user: {user.username}")
                plaintext = user.password  # Store original password
                user.set_password(plaintext)  # Hash it
                user.save()
                count += 1
                
        self.stdout.write(self.style.SUCCESS(f'Successfully hashed {count} user passwords'))