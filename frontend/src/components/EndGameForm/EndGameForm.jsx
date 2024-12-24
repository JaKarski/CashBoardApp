import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';  // Import API do wykonywania zapytań
import './EndGameForm.css';

const EndGameModal = ({ onClose }) => {
  const { code } = useParams();  // Pobieramy kod gry z URL
  const [players, setPlayers] = useState([]);
  const [initialTotalMoney, setInitialTotalMoney] = useState(0); // Całkowita początkowa suma pieniędzy na stole
  const [totalMoneyOnTable, setTotalMoneyOnTable] = useState(0); // Aktualna pozostała suma
  const navigate = useNavigate(); 

  // Funkcja pobierająca graczy z serwera
  const fetchPlayersFromServer = async () => {
    try {
      // Wysyłamy zapytanie do API, aby pobrać graczy powiązanych z grą o danym kodzie
      const response = await api.get(`/api/games/${code}/players/`);
      const serverData = response.data.players;
      console.log(serverData)

      setPlayers(serverData);

      // Obliczamy początkową sumę pieniędzy na stole (deposited sum)
      const totalMoney = serverData.reduce((sum, player) => sum + player.stack, 0);
      setInitialTotalMoney(totalMoney);
      setTotalMoneyOnTable(totalMoney); // Ustawiamy początkową wartość pieniędzy na stole
    } catch (error) {
      console.error('Błąd podczas pobierania danych o graczach:', error);
    }
  };

  useEffect(() => {
    fetchPlayersFromServer(); // Pobieranie graczy z serwera po załadowaniu komponentu
  }, [code]);

  // Funkcja obsługi zmiany w polach formularza
  const handleChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index].payout = value;

    // Aktualizujemy stan graczy
    setPlayers(newPlayers);

    // Obliczamy na bieżąco sumę wypłat i aktualizujemy kwotę pozostałą na stole
    const payoutsSum = newPlayers.reduce((sum, player) => {
      return sum + (parseFloat(player.payout) || 0);
    }, 0);

    const remainingMoney = initialTotalMoney - payoutsSum; // Pozostała kwota na stole
    setTotalMoneyOnTable(remainingMoney); // Ustaw aktualną pozostałą kwotę
  };

  // Funkcja obsługi zatwierdzenia
  const handleConfirmAll = async () => {
    try {
      // Tworzymy dane do wysłania na serwer
      const payload = players.map(player => ({
        player: player.name,
        buy_in: parseFloat(player.stack), 
        cash_out: parseFloat(player.payout),
      }));
      console.log(payload)
      // Wysyłamy dane do serwera
      const response = await api.post(`/api/games/${code}/end-game/`, { players: payload });

      if (response.status === 200) {
        console.log("Gra zakończona pomyślnie:", response.data);
        navigate('/'); // Przekierowanie na stronę główną po zatwierdzeniu
      }
    } catch (error) {
      console.error("Błąd podczas zatwierdzania gry:", error);
    }

    onClose(); // Zamykamy formularz
  };

  return (
    <div className="endgame-modal-background">
      <div className="endgame-modal-content">
        <div className="money-info">
          <p>Money on table: {totalMoneyOnTable} PLN</p> {/* Informacja o kwocie */}
        </div>
        <h2 className="endgame-modal-header">End Game</h2>
        <div className="endgame-players-container">
          {players.map((player, index) => (
            <div key={index} className="endgame-player-info">
              <p className="endgame-player-text">{player.name} buyin for: {player.stack} cashout</p>
              <input
                className="endgame-player-input"
                type="number"
                value={player.payout}
                onChange={(e) => handleChange(index, e.target.value)} // Zmiana wartości w polach
              />
            </div>
          ))}
        </div>
        <div className="endgame-modal-buttons">
          <button
            className="endgame-button"
            onClick={handleConfirmAll}
            disabled={totalMoneyOnTable !== 0} // Przycisk jest zablokowany, gdy suma nie wynosi 0
          >
            Confirm
          </button>
          <button className="endgame-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EndGameModal;
