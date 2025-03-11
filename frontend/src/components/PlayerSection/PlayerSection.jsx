import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import './PlayerSection.css';

const PlayersSection = () => {
  const { code } = useParams();
  const [players, setPlayers] = useState([]);
  const [buyIn, setBuyIn] = useState(0);
  const [isSuperUser, setIsSuperUser] = useState(false);

  // Fetch players and buy-in from the server
  const fetchGameData = async () => {
    try {
      const gameResponse = await api.get(`api/games/${code}/players/`);
      setPlayers(gameResponse.data.players);
      setBuyIn(gameResponse.data.buy_in);

      // Check if the user is a superuser
      const superuserResponse = await api.get('/api/check-superuser/');
      setIsSuperUser(superuserResponse.data.is_superuser);
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 1000);
    return () => clearInterval(interval);
  }, [code]);

  // Handle "Rebuy"
  const handleRebuy = async (username) => {
    try {
      await api.post(`api/games/${code}/action/`, {
        action: 'rebuy',
        username
      });
      fetchGameData();
    } catch (error) {
      console.error('Error processing rebuy:', error);
    }
  };

  // Handle "Back"
  const handleBack = async (username) => {
    try {
      await api.post(`api/games/${code}/action/`, {
        action: 'back',
        username
      });
      fetchGameData();
    } catch (error) {
      console.error('Error processing back action:', error);
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
                  disabled={parseInt(player.stack) === 0}  
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
