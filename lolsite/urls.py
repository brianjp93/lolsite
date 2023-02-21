from django.contrib import admin
from django.urls import path, include
from . import views
from player import views as player_views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = []

if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]

urlpatterns += [
    path("admin/", admin.site.urls),
    path("api/v1/", include("lolsite.urlsapi")),
    path("login/go/", player_views.login_action),
    path("logout/", player_views.logout_action, name="logout"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + [
    path("<path:path>/", views.home),
    path("", views.home, name="home"),
]
