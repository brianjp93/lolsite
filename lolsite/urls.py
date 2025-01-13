from django.contrib import admin
from django.urls import path, include
from player import views as player_views
from lolsite import views
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("lolsite.urlsapi")),
    path("", include("player.urls", namespace="player")),
    path("", include("match.urls")),
    path("", views.Home.as_view(), name="home"),
    path("feed/", views.FeedView.as_view(), name="feed"),
    path("following/", views.FollowingListView.as_view(), name="following"),
    path("stats", include("stats.urls", namespace="stats")),
    path("data/", include("data.urls", namespace="data")),
    path("login/go/", player_views.login_action),
    path("logout/", player_views.logout_action, name="logout"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
        *urlpatterns,
    ]
