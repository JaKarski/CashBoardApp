import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';  // Pobranie kodu gry z URL
import { FaGamepad, FaMoneyBillWave } from 'react-icons/fa'; // FontAwesome ikony
import { GiSpades } from 'react-icons/gi'; // Ikona pików z Game Icons
import api from '../../api';  // Import API do wykonywania zapytań
import './AdditionalInfoSection.css';
import EndGameModal from '../EndGameForm/EndGameForm'; // Import formularza jako modala


const AdditionalInfoSection = () => {
  const { code } = useParams();  // Pobieramy kod gry z URL
  const [additionalInfo, setAdditionalInfo] = useState({
    buyIn: '',
    games: [],
    jackpots: []
  });

  const [isSuperUser, setIsSuperUser] = useState(false);  // Stan do kontrolowania statusu superużytkownika
  const [showModal, setShowModal] = useState(false); // Stan do kontrolowania modala

  useEffect(() => {
    // Pobieramy dane z serwera tylko raz po załadowaniu komponentu
    fetchAdditionalInfo();
    checkSuperUserStatus();  // Sprawdzamy, czy użytkownik jest superużytkownikiem
  }, [code]);

  // Funkcja pobierająca dodatkowe dane o grze
  const fetchAdditionalInfo = async () => {
    try {
      const response = await api.get(`/api/games/${code}/additional-data/`);  // Używamy dynamicznego `code` w API
      const gameData = response.data;
      const blindsValue = parseFloat(gameData.blind) || 0

      const pokerShowdown = (10 * blindsValue).toFixed(2) + ' PLN';
      const win27o = (4 * blindsValue).toFixed(2) + ' PLN';


      setAdditionalInfo({
        buyIn: `${gameData.buy_in} PLN`,
        games: [
          { title: 'PLO', value: `${gameData.how_many_plo} rozdania/2h`, visible: gameData.how_many_plo > 0 },
          { title: 'Stand-Up', value: `${gameData.how_often_stand_up}h`, visible: gameData.how_often_stand_up > 0 },
        ].filter(game => game.visible),
        jackpots: [
          { title: "Poker z Showdown'em", value: pokerShowdown, visible: gameData.is_poker_jackpot },
          { title: 'Win 27o', value: win27o, visible: gameData.is_win_27 }
        ].filter(jackpot => jackpot.visible)
      });
    } catch (error) {
      console.error('Błąd podczas pobierania dodatkowych danych o grze:', error);
    }
  };

  // Funkcja sprawdzająca, czy użytkownik jest superużytkownikiem
  const checkSuperUserStatus = async () => {
    try {
      const response = await api.get('/api/check-superuser/');
      setIsSuperUser(response.data.is_superuser);  // Ustawiamy, czy użytkownik jest superużytkownikiem
    } catch (error) {
      console.error('Błąd podczas sprawdzania statusu superużytkownika:', error);
    }
  };

  const handleEndGameClick = () => {
    setShowModal(true); // Wyświetl modal
  };

  const handleCloseModal = () => {
    setShowModal(false); // Ukryj modal
  };

  return (
    <div className="additional-info-section">
      <h2>Dodatkowe info</h2>
      <div className="section buyin">
        <p>Buyin: {additionalInfo.buyIn}</p>
      </div>
      <div className="section games">
        <h3>
          <FaGamepad /> GAMES <GiSpades />
        </h3>
        {additionalInfo.games.map((game, index) => (
          <p key={index}>
            {game.title}: {game.value}
          </p>
        ))}
      </div>
      <div className="section jackpots">
        <h3>
          <FaMoneyBillWave /> JACKPOTS <FaMoneyBillWave />
        </h3>
        {additionalInfo.jackpots.map((jackpot, index) => (
          <p key={index}>
            {jackpot.title}: {jackpot.value}
          </p>
        ))}
      </div>

      <button className="button">
        <a href="/" style={{ color: 'white', textDecoration: 'none' }}>Menu</a>
      </button>

      {/* Przycisk "End Game" widoczny tylko dla superużytkownika */}
      {isSuperUser && (
        <button className="button" onClick={handleEndGameClick}>
          End Game
        </button>
      )}

      {/* Wyświetl modal, jeśli showModal jest true */}
      {showModal && <EndGameModal onClose={handleCloseModal} />}
    </div>
  );
};

export default AdditionalInfoSection;
