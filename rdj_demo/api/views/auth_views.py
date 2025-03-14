from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from api.models import User, Token  # Import from your custom models
from rest_framework import status
from django.contrib.auth.hashers import check_password

@csrf_exempt
@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.method == "GET":
        return JsonResponse({"message": "Login endpoint. Use POST to authenticate."}, status=200)

    if request.method == "POST":
        try:
            # Parse JSON data
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                return JsonResponse({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)
            
            identifier = data.get("identifier")
            password = data.get("password")
            
            print(f"Login attempt with identifier: {identifier}")
            
            if not identifier or not password:
                return JsonResponse({"error": "Username/email and password are required"}, status=400)

            # Try to find the user by username or email
            try:
                if '@' in identifier:
                    user = User.objects.get(email=identifier)
                else:
                    user = User.objects.get(username=identifier)
                    
                # At this point we found the user, now check password
                print(f"Found user: {user.username}, checking password...")
                
                # Try Django's authenticate first
                authenticated_user = authenticate(request, username=user.username, password=password)
                
                if authenticated_user is not None:
                    # Standard authentication worked
                    login(request, authenticated_user)
                    token, created = Token.objects.get_or_create(user=authenticated_user)
                    
                    response_data = {
                        "message": "Login successful",
                        "token": token.key,
                        "username": authenticated_user.username,
                        "is_admin": authenticated_user.is_admin,
                    }
                    return JsonResponse(response_data, status=status.HTTP_200_OK)
                else:
                    # If standard auth failed, log what's happening
                    print(f"Standard authenticate() failed for {user.username}")
                    print(f"Password hash in DB: {user.password[:20]}...")
                    
                    # Try manual password check as fallback
                    if check_password(password, user.password):
                        print(f"Manual password check succeeded!")
                        login(request, user)
                        token, created = Token.objects.get_or_create(user=user)
                        
                        response_data = {
                            "message": "Login successful (manual check)",
                            "token": token.key,
                            "username": user.username,
                            "is_admin": user.is_admin,
                        }
                        return JsonResponse(response_data, status=status.HTTP_200_OK)
                    else:
                        print(f"Manual password check failed too")
                        return JsonResponse({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
                
            except User.DoesNotExist:
                print(f"No user found with identifier: {identifier}")
                return JsonResponse({"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
            except User.MultipleObjectsReturned:
                print(f"Multiple users found with email: {identifier}")
                return JsonResponse({"error": "Multiple users with this email"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Unexpected error during login: {str(e)}")
            return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)