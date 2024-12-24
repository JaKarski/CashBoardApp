import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayersSection from "../../components/PlayerSection/PlayerSection";
import GameSection from '../../components/GameSection/GameSection';
import AdditionalInfoSection from '../../components/AdditionalInfoSection/AdditionalInfoSection';
import api from '../../api';
import './Game.css';

const Game = () => {
  const { code } = useParams();  // Pobieramy dynamiczny parametr 'code' z URL
  const [isInGame, setIsInGame] = useState(null);  // Ustawiamy stan do sprawdzania, czy użytkownik jest w grze
  const [isGameEnded, setIsGameEnded] = useState(null);  // Stan do sprawdzania, czy gra jest zakończona
  const navigate = useNavigate();  // Używamy navigate do przekierowań

  // Funkcja do sprawdzenia, czy użytkownik jest przypisany do gry oraz czy gra jest zakończona
  const checkPlayerInGame = async () => {
    try {
      const response = await api.get(`api/games/${code}/check-player/`);  // Wysyłamy zapytanie do serwera, aby sprawdzić, czy użytkownik jest przypisany do gry
      if (response.status === 200) {
        setIsInGame(response.data.is_in_game);
        setIsGameEnded(response.data.is_game_ended);  // Ustawiamy stan na podstawie odpowiedzi serwera
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania statusu gracza:', error);
      setIsInGame(false);  // W przypadku błędu również ustawiamy isInGame na false
    }
  };

  useEffect(() => {
    checkPlayerInGame();  // Sprawdzamy status przypisania użytkownika do gry po załadowaniu komponentu
  }, [code]);  // Zależność od code, aby ponownie sprawdzić przy zmianie kodu gry

  useEffect(() => {
    if (isInGame === false || isGameEnded === true) {
      navigate('/');  // Przekierowanie na stronę główną, jeśli użytkownik nie jest w grze lub gra jest zakończona
    }
  }, [isInGame, isGameEnded, navigate]);

  if (isInGame === null || isGameEnded === null) {
    return <div>Loading...</div>;  // Wyświetlamy komunikat "Loading..." dopóki nie sprawdzimy przypisania i statusu gry
  }

  return (
    <div className='container'>
      <div className="dashboard-container">
        <PlayersSection />
        <GameSection />
        <AdditionalInfoSection />
      </div>
    </div>
  );
};

export default Game;
