from django.contrib import messages
from django.urls import reverse
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin

from activity.models import Application, ApplicationToken


class IntegrationsListView(LoginRequiredMixin, generic.TemplateView):
    template_name = "activity/integrations.html"

    def get_context_data(self, **kwargs):
        qs = (
            ApplicationToken.objects.filter(
                user=self.request.user,
            )
            .order_by("application", "created_at")
            .select_related("application")
            .distinct("application")
        )
        items = {x.application.code: x for x in qs}
        context = super().get_context_data(**kwargs)
        context["OURA"] = items.get("OURA")
        context["applications"] = {
            x.code: {"obj": x, "authorize_url": x.api.get_authorize_url(self.request)}
            for x in Application.objects.all()
        }
        return context


class IntegrationCallbackView(LoginRequiredMixin, generic.RedirectView):
    def get_redirect_url(self, *args, **kwargs) -> str | None:
        return reverse("activity:integrations")

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
        token = api.handle_authorize_request(request)
