import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';  // Używamy skonfigurowanej instancji Axios
import './PlayerSection.css';

const PlayersSection = () => {
  const { code } = useParams();  // Pobieramy dynamiczny parametr 'code' z URL (gameCode)
  const [players, setPlayers] = useState([]);
  const [buyIn, setBuyIn] = useState(0);
  const [isSuperUser, setIsSuperUser] = useState(false);

  // Funkcja do pobrania graczy i buy_in z serwera
  const fetchGameData = async () => {
    try {
      const gameResponse = await api.get(`api/games/${code}/players/`);
      setPlayers(gameResponse.data.players);
      setBuyIn(gameResponse.data.buy_in);

      // Pobierz status superużytkownika
      const superuserResponse = await api.get('/api/check-superuser/');
      setIsSuperUser(superuserResponse.data.is_superuser);
    } catch (error) {
      console.error('Błąd podczas pobierania danych:', error);
    }
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(() => {
      fetchGameData();
    }, 1000);
    return () => clearInterval(interval);
  }, [code]);

  // Obsługa "Rebuy"
  const handleRebuy = async (username) => {
    try {
      await api.post(`api/games/${code}/action/`, {
        action: 'rebuy',
        username: username  // Przekazujemy nick gracza
      });
      fetchGameData();  // Aktualizujemy dane po sukcesie
    } catch (error) {
      console.error('Błąd podczas rebuya:', error);
    }
  };

  // Obsługa "Back"
  const handleBack = async (username) => {
    try {
      await api.post(`api/games/${code}/action/`, {
        action: 'back',
        username: username  // Przekazujemy nick gracza
      });
      fetchGameData();  // Aktualizujemy dane po sukcesie
    } catch (error) {
      console.error('Błąd podczas cofania rebuya:', error);
    }
  };

  return (
    <div className="players-section">
      <h2>Players</h2>
      <div className="player-list">
        {players.map((player, index) => (
          <div key={index} className="player">
            <div className="player-info">
              <span className="player-name">{player.name}</span>
              <span className="player-stack">{player.stack} PLN</span>
            </div>
            <div className="buttons-container">
              <button className="rebuy-button" onClick={() => handleRebuy(player.name)}>Rebuy</button>
              {isSuperUser && (
                <button 
                className="back-button" 
                onClick={() => handleBack(player.name)} 
                disabled={parseInt(player.stack) === 0}  // Wyłącz przycisk, jeśli stack gracza wynosi 0
              >
                Back
              </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersSection;
