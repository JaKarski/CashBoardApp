import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaGamepad, FaMoneyBillWave } from 'react-icons/fa';
import { GiSpades } from 'react-icons/gi';
import api from '../../api';
import './AdditionalInfoSection.css';
import EndGameModal from '../EndGameForm/EndGameForm';

const AdditionalInfoSection = () => {
  const { code } = useParams();  
  const [additionalInfo, setAdditionalInfo] = useState({
    buyIn: '',
    games: [],
    jackpots: []
  });

  const [isSuperUser, setIsSuperUser] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAdditionalInfo();
    checkSuperUserStatus();
  }, [code]);

  // Fetch additional game data
  const fetchAdditionalInfo = async () => {
    try {
      const response = await api.get(`/api/games/${code}/additional-data/`);
      const gameData = response.data;
      const blindsValue = parseFloat(gameData.blind) || 0;

      const pokerShowdown = (10 * blindsValue).toFixed(2) + ' PLN';
      const win27o = (4 * blindsValue).toFixed(2) + ' PLN';

      setAdditionalInfo({
        buyIn: `${gameData.buy_in} PLN`,
        games: [
          { title: 'PLO', value: `${gameData.how_many_plo} hands/2h`, visible: gameData.how_many_plo > 0 },
          { title: 'Stand-Up', value: `${gameData.how_often_stand_up}h`, visible: gameData.how_often_stand_up > 0 },
        ].filter(game => game.visible),
        jackpots: [
          { title: "Poker with Showdown", value: pokerShowdown, visible: gameData.is_poker_jackpot },
          { title: 'Win 27o', value: win27o, visible: gameData.is_win_27 }
        ].filter(jackpot => jackpot.visible)
      });
    } catch (error) {
      console.error('Error fetching additional game data:', error);
    }
  };

  // Check if the user is a superuser
  const checkSuperUserStatus = async () => {
    try {
      const response = await api.get('/api/check-superuser/');
      setIsSuperUser(response.data.is_superuser);
    } catch (error) {
      console.error('Error checking superuser status:', error);
    }
  };

  const handleEndGameClick = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="additional-info-section">
      <h2>Additional Info</h2>
      <div className="section buyin">
        <p>Buy-in: {additionalInfo.buyIn}</p>
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

      {/* "End Game" button visible only for superusers */}
      {isSuperUser && (
        <button className="button" onClick={handleEndGameClick}>
          End Game
        </button>
      )}

      {/* Display modal if showModal is true */}
      {showModal && <EndGameModal onClose={handleCloseModal} />}
    </div>
  );
};

export default AdditionalInfoSection;
