"""player/views.py
"""
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone

from player.models import EmailVerification

from lolsite.views import get_base_react_context


def login_action(request):
    """Login

    POST Parameters
    ---------------
    email : str
    password : str

    Returns
    -------
    JSON

    """
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")
        user = authenticate(request, username=email, password=password)
        if user is not None:
            if user.custom.is_email_verified:
                login(request, user)
                view_name = "home"
            else:
                view_name = "/login?error=verification"
                thresh = timezone.now() - timezone.timedelta(minutes=10)
                query = user.emailverification_set.filter(created_date__gt=thresh)
                if query.exists():
                    # recent emailverification models exist
                    # don't need to create a new one
                    pass
                else:
                    # Create new email verification model.
                    EmailVerification(user=user).save()
        else:
            view_name = "/login?error=true"
    else:
        view_name = "/login"

    return redirect(view_name)


def logout_action(request):
    """Log user out of session.
    """
    user = request.user
    logout(request)
    return redirect("home")
