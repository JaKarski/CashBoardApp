import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api'; // Import API for server requests
import { formatTime } from '../../utils/timeUtils'; // Utility for time formatting
import './GameSection.css';

const GameSection = () => {
  const { code } = useParams(); // Retrieve the game code from the URL

  // State to hold game data
  const [gameData, setGameData] = useState({
    blinds: 0.5,
    gameStartTime: null, // Server-provided game start time
    moneyOnTable: 0,
    numberOfPlayers: 0,
    avgStack: 0,
  });

  // State for game timer
  const [gameTime, setGameTime] = useState('0:00:00');
  const [lastPlayedHour, setLastPlayedHour] = useState(null); // Track last played hour for sound

  const hourSound = useRef(new Audio('/hour.mp3')); // UseRef for audio

  // Update the timer based on start time
  const updateTimer = (startTime) => {
    const now = new Date();
    const elapsedTime = Math.floor((now - new Date(startTime)) / 1000); // Calculate elapsed time in seconds
    setGameTime(formatTime(elapsedTime));
  };

  // Fetch game data from the server
  const fetchGameData = async () => {
    try {
      const response = await api.get(`/api/games/${code}/data/`);
      const data = response.data;

      if (!data.game_start_time || !data.blinds) {
        throw new Error('Invalid data from API');
      }

      setGameData({
        blinds: data.blinds,
        gameStartTime: new Date(data.game_start_time),
        moneyOnTable: data.money_on_table,
        numberOfPlayers: data.number_of_players,
        avgStack: data.avg_stack,
      });

      updateTimer(data.game_start_time);
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  };

  // Timer effect to update game time every second
  useEffect(() => {
    let timerInterval;
    if (gameData.gameStartTime) {
      timerInterval = setInterval(() => {
        updateTimer(gameData.gameStartTime);
      }, 1000);
    }

    return () => clearInterval(timerInterval); // Clear timer on unmount
  }, [gameData.gameStartTime]);

  // Fetch game data at regular intervals
  useEffect(() => {
    fetchGameData(); // Fetch data on first render

    const dataFetchInterval = setInterval(() => {
      fetchGameData(); // Fetch data every 10 seconds
    }, 1000);

    return () => clearInterval(dataFetchInterval); // Clear interval on unmount
  }, [code]);

  // Play sound on the full hour
  useEffect(() => {
    const [hours, minutes, seconds] = gameTime.split(':').map(Number);

    if (minutes === 0 && seconds === 0 && lastPlayedHour !== hours) {
      hourSound.current.play().catch((error) => {
        console.log('Error playing sound:', error);
      });
      setLastPlayedHour(hours);
    }
  }, [gameTime, lastPlayedHour]);

  // Main component rendering
  return (
    <div className="game-section">
      <h1>CashBoard</h1>
      <div className="game-info">
        <p>Blinds: {gameData.blinds / 2}/{gameData.blinds}</p>
        <p>Game time:</p>
        <h1 className="timer">{gameTime}</h1>
        <p>Money on the table: {gameData.moneyOnTable.toFixed(2)} PLN</p>
        <p>Number of players: {gameData.numberOfPlayers}</p>
        <p>Avg stack: {gameData.avgStack.toFixed(2)} PLN</p>
      </div>
    </div>
  );
};

export default GameSection;
