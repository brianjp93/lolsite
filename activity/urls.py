from django.urls import path
from . import views

app_name = 'activity'

urlpatterns = [
    path("integrations/", views.IntegrationsListView.as_view(), name="integrations"),
    path("<slug:code>/callback/", views.IntegrationCallbackView.as_view(), name="integration-callback"),
]
