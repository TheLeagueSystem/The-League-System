import os
import django
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rdj_demo.settings')
django.setup()

from api.models import User
from django.contrib.auth.hashers import make_password, is_password_usable

# Get all users
users = User.objects.all()
fixed_count = 0

print(f"Found {users.count()} users in database.")

for user in users:
    print(f"Checking user: {user.username}, password hash: {user.password[:20]}...")
    
    # Check if the password looks like a hash
    if not is_password_usable(user.password):
        print(f"  Fixing password for {user.username}")
        plaintext = user.password  # Store original unhashed password
        user.password = make_password(plaintext)  # Hash it properly
        user.save()
        fixed_count += 1
        print(f"  ✓ Password fixed. New hash: {user.password[:20]}...")

print(f"\nFixed {fixed_count} user passwords")

# If you need to reset a specific admin password
if len(sys.argv) > 1 and sys.argv[1] == '--reset-admin':
    try:
        admin = User.objects.get(username='admin')
        admin.set_password('admin')  # Set to a simple password you can remember
        admin.save()
        print("Reset admin password to 'admin'")
    except User.DoesNotExist:
        print("Admin user not found")