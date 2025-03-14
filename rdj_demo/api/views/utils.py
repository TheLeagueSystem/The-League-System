# Add this to a views file, e.g., api/views/utils.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

@csrf_exempt
def check_db_structure(request):
    """Check the database structure and return information."""
    if request.method == 'GET':
        try:
            with connection.cursor() as cursor:
                # Get table info
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'api_motion'
                """)
                columns = [
                    {"name": col[0], "type": col[1], "nullable": col[2]} 
                    for col in cursor.fetchall()
                ]
                
                # Get sample data
                cursor.execute("SELECT * FROM api_motion LIMIT 5")
                desc = cursor.description
                if desc:
                    column_names = [col[0] for col in desc]
                    sample_data = [dict(zip(column_names, row)) for row in cursor.fetchall()]
                else:
                    sample_data = []
                
                return JsonResponse({
                    "status": "success",
                    "table_structure": columns,
                    "sample_data": sample_data
                })
        except Exception as e:
            import traceback
            return JsonResponse({
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)
    
    return JsonResponse({"status": "error", "message": "Only GET method is allowed"}, status=405)

@csrf_exempt
def check_db_connection(request):
    """Check if the database connection is working."""
    if request.method == 'GET':
        try:
            from django.db import connections
            from django.db.utils import OperationalError
            
            db_conn = connections['default']
            db_conn.cursor()
            
            return JsonResponse({
                "status": "success",
                "message": "Database connection successful",
                "database": {
                    "engine": connections.databases['default']['ENGINE'],
                    "name": connections.databases['default']['NAME'],
                    "user": connections.databases['default']['USER'][:5] + "...",  # Hide full username
                    "host": connections.databases['default']['HOST'],
                    "port": connections.databases['default']['PORT'],
                }
            })
        except OperationalError as e:
            import traceback
            return JsonResponse({
                "status": "error",
                "message": "Database connection failed",
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)
    
    return JsonResponse({"status": "error", "message": "Only GET method is allowed"}, status=405)