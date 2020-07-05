from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.contrib.auth.models import User
from django.contrib.auth import login


@api_view(["POST"])
def demo_login(request, format=None):
    """Login to demo user
    """
    data = {}
    status_code = 200

    if request.method == "POST":
        password = request.data["password"]
        demo_user = User.objects.get(username="demo")

        is_password_correct = demo_user.check_password(password)
        if is_password_correct:
            login(request, demo_user)
            data = {"message": "logged in"}
        else:
            data = {"message": "wrong password"}
            status_code = 403

    return Response(data, status=status_code)


def require_login(func):
    """A decorator to return an error if the use is not logged in.
    """

    def wrapper(request, *args, **kwargs):
        if request.user.is_anonymous:
            data = {"message": "User must be logged in.", "status": "NOT_LOGGED_IN"}
            return Response(data, status=403)
        else:
            return func(request, *args, **kwargs)

    return wrapper
