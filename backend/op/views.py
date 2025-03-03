from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils.timezone import now
from datetime import timedelta, date
from collections import defaultdict
from .models import Episode, UserEpisode

@login_required
def home(request):
    episodes = Episode.objects.all()
    total_episodes = episodes.count()
    watched_episodes = UserEpisode.objects.filter(user=request.user, watched=True)
    
    watched_count = watched_episodes.count()
    remaining_count = total_episodes - watched_count

    # Obsługa przypadku, gdy użytkownik nie obejrzał jeszcze żadnego odcinka
    if watched_count == 0:
        first_watched = "N/A"
        last_watched = "N/A"
        days_watching = 1
        avg_episodes_per_day = 0
        avg_minutes_per_day = 0
        estimated_end_date = "N/A"
        required_episodes_per_day = "N/A"
        max_marathon_day = "N/A"
        max_marathon_count = 0
    else:
        first_watched = watched_episodes.order_by('watched_date').first().watched_date
        last_watched = now().date()
        days_watching = max((last_watched - first_watched).days + 1, 1)  # Zapobiegamy dzieleniu przez 0

        avg_episodes_per_day = watched_count / days_watching
        avg_minutes_per_day = avg_episodes_per_day * 20  # 20 minut na odcinek

        # Obsługa przypadku, gdy użytkownik obejrzał już wszystkie odcinki
        if remaining_count == 0:
            estimated_end_date = "Completed 🎉"
            required_episodes_per_day = "N/A"
        else:
            estimated_days_remaining = remaining_count / avg_episodes_per_day
            estimated_end_date = last_watched + timedelta(days=int(estimated_days_remaining))

            target_date = date(2026, 2, 21)
            days_until_target = (target_date - last_watched).days
            required_episodes_per_day = remaining_count / days_until_target if days_until_target > 0 else "N/A"

        # Najdłuższy maraton (dzień, w którym obejrzałem najwięcej odcinków)
        daily_watched = defaultdict(int)
        for ue in watched_episodes:
            if ue.watched_date:
                daily_watched[ue.watched_date] += 1

        if daily_watched:
            max_marathon_day, max_marathon_count = max(daily_watched.items(), key=lambda x: x[1])
        else:
            max_marathon_day, max_marathon_count = "N/A", 0

    # Miesięczna statystyka obejrzanych odcinków
    monthly_data = defaultdict(int)
    for ue in watched_episodes:
        if ue.watched_date:
            month = ue.watched_date.strftime("%b")
            monthly_data[month] += 1

    ordered_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_counts = [monthly_data[month] for month in ordered_months]

    return render(request, 'base.html', {
        'episodes': episodes,
        'watched_episodes': list(watched_episodes.values_list('episode_id', flat=True)),
        'watched_count': watched_count,
        'remaining_count': remaining_count,
        'monthly_labels': ordered_months,
        'monthly_counts': monthly_counts,
        'avg_episodes_per_day': round(avg_episodes_per_day, 2),
        'avg_minutes_per_day': round(avg_minutes_per_day, 2),
        'estimated_end_date': estimated_end_date,
        'required_episodes_per_day': round(required_episodes_per_day, 2) if isinstance(required_episodes_per_day, float) else "N/A",
        'max_marathon_day': max_marathon_day,
        'max_marathon_count': max_marathon_count,
        'first_watched': first_watched,
        'last_watched': last_watched,
        'days_watching': days_watching
    })


@login_required
def mark_as_watched(request, episode_id):
    if request.method == "POST":
        episode = get_object_or_404(Episode, id=episode_id)
        user_episode, created = UserEpisode.objects.get_or_create(user=request.user, episode=episode)

        if user_episode.watched:
            # Jeśli odcinek już jest oznaczony jako obejrzany -> oznacz jako NIEobejrzany
            user_episode.watched = False
            user_episode.save()
            return JsonResponse({'status': 'unwatched', 'episode_id': episode_id})

        else:
            # Jeśli nie było obejrzane -> oznacz jako obejrzane i ustaw aktualną datę
            user_episode.watched = True
            user_episode.watched_date = now().date()
            user_episode.save()

            # **Propagacja wsteczna**: Oznacz wcześniejsze odcinki jako obejrzane
            previous_episodes = Episode.objects.filter(number__lt=episode.number).order_by('-number')
            for prev_episode in previous_episodes:
                prev_user_episode, _ = UserEpisode.objects.get_or_create(user=request.user, episode=prev_episode)
                if not prev_user_episode.watched:
                    prev_user_episode.watched = True
                    prev_user_episode.watched_date = now().date()
                    prev_user_episode.save()

            return JsonResponse({'status': 'watched', 'episode_id': episode_id})
    return JsonResponse({'status': 'error'}, status=400)
