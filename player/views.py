"""player/views.py
"""
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.contrib.auth import authenticate, login, logout


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
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            view_name = 'home'
        else:
            view_name = '/login?error=true'
    else:
        data = {'message': 'This resource only accepts POSTs.'}

    return redirect(view_name)

def logout_action(request):
    """Log user out of session.
    """
    user = request.user
    logout(request)
    return redirect('home')
