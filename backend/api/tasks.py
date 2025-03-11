from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string

@shared_task
def send_notification_email(subject, message, recipient_list):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        recipient_list,
        fail_silently=False,
    )


@shared_task
def send_game_summary_email(recipient_email, game_data, transactions):
    """
    Wysyła podsumowanie zakończonej gry pokerowej na podany adres e-mail.
    """
    game_date = game_data.get("game_date", "Nieznana data")
    
    formatted_game_date = game_date
    if isinstance(game_date, str) and "-" in game_date:
        year, month, day = game_date.split("-")
        formatted_game_date = f"{day}.{month}.{year}" 

    subject = f"📊 Podsumowanie gry pokerowej – {formatted_game_date}"
    from_email = settings.DEFAULT_FROM_EMAIL

    html_content = render_to_string("emails/game_summary.html", {
        "game_duration": game_data["game_duration"],
        "buy_in": game_data["buy_in"],
        "cash_out": game_data["cash_out"],
        "total_pot": game_data["total_pot"],
        "avg_stack": game_data["avg_stack"],
        "profit": game_data["profit"],
        "profit_per_hour": game_data["profit_per_hour"],
        "transactions": transactions
    })

    email = EmailMultiAlternatives(subject, "Twoje podsumowanie gry pokerowej", from_email, [recipient_email])
    email.attach_alternative(html_content, "text/html")

    email.send()