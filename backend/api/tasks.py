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
    # Pobieramy datę gry z danych (zakładam, że format to YYYY-MM-DD i trzeba go sformatować)
    game_date = game_data.get("game_date", "Nieznana data")  # Powinien być podany np. "2025-02-12"
    
    # Formatowanie daty, jeśli istnieje
    formatted_game_date = game_date
    if isinstance(game_date, str) and "-" in game_date:
        year, month, day = game_date.split("-")
        formatted_game_date = f"{day}.{month}.{year}"  # Zamiana na format DD.MM.YYYY

    subject = f"📊 Podsumowanie gry pokerowej – {formatted_game_date}"
    from_email = settings.DEFAULT_FROM_EMAIL

    # Renderowanie HTML z danymi gry
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

    # Tworzymy wiadomość e-mail (tekst + HTML)
    email = EmailMultiAlternatives(subject, "Twoje podsumowanie gry pokerowej", from_email, [recipient_email])
    email.attach_alternative(html_content, "text/html")
    
    # Wysyłamy e-mail
    email.send()