from django.contrib import admin
from .models import Episode, UserEpisode

@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ('number', 'title_en', 'release_date', 'is_filler', 'comment')
    list_filter = ('is_filler', 'release_date')
    search_fields = ('title_en', 'title_pl', 'description', 'comment')
    ordering = ('number',)

@admin.register(UserEpisode)
class UserEpisodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'episode', 'watched', 'watched_date', 'rating')
    list_filter = ('watched', 'watched_date')
    search_fields = ('user__username', 'episode__title_en', 'episode__title_pl')
    ordering = ('user', 'episode')
