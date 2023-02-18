from django.http.response import HttpResponse


def home(request, path=""):
    return HttpResponse('Hello world!')
