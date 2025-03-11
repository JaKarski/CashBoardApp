import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';
import './EndGameForm.css';

const EndGameModal = ({ onClose }) => {
  const { code } = useParams();
  const [players, setPlayers] = useState([]);
  const [initialTotalMoney, setInitialTotalMoney] = useState(0);
  const [totalMoneyOnTable, setTotalMoneyOnTable] = useState(0);
  const navigate = useNavigate();

  // Fetch players from the server
  const fetchPlayersFromServer = async () => {
    try {
      const response = await api.get(`/api/games/${code}/players/`);
      const serverData = response.data.players;

      setPlayers(serverData);

      // Calculate initial total money on the table
      const totalMoney = serverData.reduce((sum, player) => sum + player.stack, 0);
      setInitialTotalMoney(totalMoney);
      setTotalMoneyOnTable(totalMoney);
    } catch (err) {
      toast.error('Failed to load player data. Please try again.', { toastId: 'fetch_error' });
    }
  };

  useEffect(() => {
    fetchPlayersFromServer();
  }, [code]);

  // Handle input change for payouts
  const handleChange = (index, value) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) return;

    const newPlayers = [...players];
    newPlayers[index].payout = numericValue;
    setPlayers(newPlayers);

    // Calculate remaining money on the table
    const payoutsSum = newPlayers.reduce((sum, player) => sum + (player.payout || 0), 0);
    setTotalMoneyOnTable(initialTotalMoney - payoutsSum);
  };

  // Confirm end of the game
  const handleConfirmAll = async () => {
    try {
      const payload = players.map(player => ({
        player: player.name,
        buy_in: parseFloat(player.stack),
        cash_out: parseFloat(player.payout),
      }));

      const response = await api.post(`/api/games/${code}/end-game/`, { players: payload });

      if (response.status === 200) {
        toast.success("Game ended successfully!", { toastId: 'game_end_success' });
        navigate('/');
      }
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail, { toastId: 'server_error' });
      } else {
        toast.error("Failed to end the game. Please check the data and try again.", { toastId: 'confirm_error' });
      }
    }

    onClose();
  };

  return (
    <div role="dialog" className="endgame-modal-background">
      <div className="endgame-modal-content">
        <div className="money-info">
          <p>Money on table: {totalMoneyOnTable} PLN</p>
        </div>
        <h2 className="endgame-modal-header">End Game</h2>
        <div className="endgame-players-container">
          {players.map((player, index) => (
            <div key={index} className="endgame-player-info">
              <p className="endgame-player-text">{player.name} buy-in for: {player.stack} cash-out</p>
              <input
                className="endgame-player-input"
                type="number"
                value={player.payout || ''}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="endgame-modal-buttons">
          <button
            className="endgame-button"
            onClick={handleConfirmAll}
            disabled={totalMoneyOnTable !== 0 || players.length === 0}
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
