from django.contrib import messages
from django.urls import reverse
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin

from activity.models import Application


class IntegrationCallbackView(LoginRequiredMixin, generic.RedirectView):
    def get_redirect_url(self, *args, **kwargs) -> str | None:
        return reverse("home")

    def get(self, request, *args, **kwargs):
        self.error = request.GET.get("error", None)
        code = self.kwargs["code"]
        if self.error:
            messages.error(request, f"{code} integration denied.")
            return super().get(request, *args, **kwargs)
        else:
            self.handle_callback(request)
            messages.success(request, f"{code} integration added successfully.")
        return super().get(request, *args, **kwargs)

    def handle_callback(self, request):
        code = self.kwargs["code"]
        application = Application.objects.get(code=code.upper())
        api = application.api
        api.handle_authorize_request(request)
