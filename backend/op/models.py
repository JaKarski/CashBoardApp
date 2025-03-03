from django.db import models
from django.contrib.auth.models import User

class Episode(models.Model):
    """
    Model representing an episode of One Piece.
    """

    number = models.PositiveIntegerField(unique=True, help_text="Episode number.")
    title_pl = models.CharField(max_length=255, help_text="Episode title in Polish.")
    title_en = models.CharField(max_length=255, help_text="Episode title in English.")
    release_date = models.DateField(help_text="Episode release date.")
    is_filler = models.BooleanField(default=False, help_text="Is this episode a filler?")
    description = models.TextField(blank=True, help_text="Short description of the episode.")
    comment = models.TextField(blank=True, help_text="User comment about the episode.", null=True)  # NEW COLUMN

    class Meta:
        ordering = ['number']
        verbose_name = "Episode"
        verbose_name_plural = "Episodes"

    def __str__(self):
        return f"Episode {self.number}: {self.title_en}"

class UserEpisode(models.Model):
    """
    Model representing the relationship between a user and an episode.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, help_text="User who watched the episode.")
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, help_text="Watched episode.")
    watched = models.BooleanField(default=False, help_text="Has the user watched this episode?")
    watched_date = models.DateField(null=True, blank=True, help_text="Date when the user watched the episode.")
    rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 11)], help_text="User rating (1-10).")
    note = models.TextField(blank=True, help_text="User's personal notes about the episode.")

    class Meta:
        unique_together = ('user', 'episode')  # Zapobiega dodaniu duplikatów
        verbose_name = "User Episode"
        verbose_name_plural = "User Episodes"

    def __str__(self):
        return f"{self.user.username} - Episode {self.episode.number} ({'Watched' if self.watched else 'Not Watched'})"