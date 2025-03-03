from django.urls import path
from django.contrib.auth import views as auth_views
from .views import home, mark_as_watched


urlpatterns = [
    path('', home, name='home'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/op'), name='logout'),
    path('mark-as-watched/<int:episode_id>/', mark_as_watched, name='mark_as_watched'),
]

