class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Code to run before the view
        print(f"[DEBUG] Request {request.method} to {request.path}")
        
        response = self.get_response(request)
        
        # Code to run after the view
        print(f"[DEBUG] Response: {response.status_code}")
        
        return response