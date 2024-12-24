import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';  // Importuj API do wykonywania zapytań
import './GameSection.css';

const GameSection = () => {
  const { code } = useParams();  // Pobieramy kod gry z URL
  // Stan przechowujący dane o grze
  const [gameData, setGameData] = useState({
    blinds: 0.50,
    gameStartTime: null, // Czas rozpoczęcia gry, który będzie podawany przez serwer
    moneyOnTable: 0,
    numberOfPlayers: 0,
    avgStack: 0
  });

  // Stan do przechowywania czasu gry (timer)
  const [gameTime, setGameTime] = useState('0:00:00');
  
  // Użyj bezpośredniej ścieżki do pliku w folderze public
  const hourSound = new Audio('/hour.mp3'); // Ścieżka do pliku hour.mp3 w folderze public

  // Funkcja formatująca czas do formatu hh:mm:ss
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Funkcja do aktualizacji timera
  const updateTimer = (startTime) => {
    const now = new Date();
    const elapsedTime = Math.floor((now - new Date(startTime)) / 1000); // Różnica w sekundach
    setGameTime(formatTime(elapsedTime));
  };

  // Funkcja pobierająca dane z serwera
  const fetchGameData = async () => {
    try {
      const response = await api.get(`/api/games/${code}/data/`);  // Wywołanie serwera z API
      const data = response.data;

      setGameData({
        blinds: data.blinds,
        gameStartTime: new Date(data.game_start_time), // Konwersja na Date
        moneyOnTable: data.money_on_table,
        numberOfPlayers: data.number_of_players,
        avgStack: data.avg_stack
      });

      // Zaktualizuj timer po pobraniu nowych danych o grze
      updateTimer(data.game_start_time);
    } catch (error) {
      console.error('Błąd podczas pobierania danych o grze:', error);
    }
  };

  // Timer - aktualizuje co sekundę
  useEffect(() => {
    let timerInterval;
    if (gameData.gameStartTime) {
      timerInterval = setInterval(() => {
        updateTimer(gameData.gameStartTime);  // Aktualizujemy czas gry co sekundę
      }, 1000);
    }

    return () => clearInterval(timerInterval); // Wyczyść timer po odmontowaniu komponentu
  }, [gameData.gameStartTime]);  // Timer zależy tylko od czasu rozpoczęcia gry

  // Pobieranie danych co kilka sekund
  useEffect(() => {
    fetchGameData();  // Pobierz dane przy pierwszym renderze

    const dataFetchInterval = setInterval(() => {
      fetchGameData(); // Pobieraj dane z serwera co 10 sekund
    }, 1000);  // Aktualizacja co 10 sekund

    return () => clearInterval(dataFetchInterval);  // Wyczyść interwał po odmontowaniu komponentu
  }, [code]);  // Pobieranie danych zależy od zmiennej code (kod gry)

  // Sprawdzanie i odtwarzanie dźwięku co pełną godzinę
  useEffect(() => {
    const [hours, minutes, seconds] = gameTime.split(':').map(Number);

    if (minutes === 0 && seconds === 0) {
      // Odtwórz dźwięk, gdy minuty i sekundy wynoszą 00
      hourSound.play().catch((error) => {
        console.log("Error playing sound:", error);
      });
    }
  }, [gameTime, hourSound]);

  return (
    <div className="game-section">
      <h1>CashBoard</h1>
      <div className="game-info">
        <p>Blinds: {gameData.blinds / 2}/{gameData.blinds}</p>
        <p>Game time:</p>
        <h1 className="timer">{gameTime}</h1> {/* Zwiększony timer */}
        <p>Money on the table: {gameData.moneyOnTable.toFixed(2)} PLN</p>
        <p>Number of players: {gameData.numberOfPlayers}</p>
        <p>Avg stack: {gameData.avgStack.toFixed(2)} PLN</p>
      </div>
    </div>
  );
};

export default GameSection;
