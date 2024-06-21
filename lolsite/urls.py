from django.contrib import admin
from django.urls import path, include
from player import views as player_views
from django.conf.urls.static import static
from django.conf import settings
from django.http import HttpResponse


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("lolsite.urlsapi")),
    path("", include("player.urls")),
    path("", lambda _: HttpResponse('Hello world.')),
    path("login/go/", player_views.login_action),
    path("logout/", player_views.logout_action, name="logout"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
        *urlpatterns,
    ]
