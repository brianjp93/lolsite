from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.contrib.auth.models import User
from django.contrib.auth import login


@api_view(['POST'])
def demo_login(request, format=None):
    """Login to demo user
    """
    data = {}
    status_code = 200

    if request.method == 'POST':
        password = request.data['password']
        demo_user = User.objects.get(username='demo')

        is_password_correct = demo_user.check_password(password)
        if is_password_correct:
            login(request, demo_user)
            data = {'message': 'logged in'}
        else:
            data = {'message': 'wrong password'}
            status_code = 403

    return Response(data, status=status_code)