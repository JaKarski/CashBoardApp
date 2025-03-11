import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayersSection from "../../components/PlayerSection/PlayerSection";
import GameSection from '../../components/GameSection/GameSection';
import AdditionalInfoSection from '../../components/AdditionalInfoSection/AdditionalInfoSection';
import api from '../../api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Game.css';

const Game = () => {
  const { code } = useParams(); // Get dynamic parameter 'code' from URL
  const [isInGame, setIsInGame] = useState(null); // State to check if the user is in the game
  const [isGameEnded, setIsGameEnded] = useState(null); // State to check if the game is ended
  const [loading, setLoading] = useState(true); // Loading state for better UX
  const navigate = useNavigate(); // Navigation hook

  // Function to check if the user is in the game and if the game is ended
  const checkPlayerInGame = async () => {
    try {
      const response = await api.get(`api/games/${code}/check-player/`);
      if (response.status === 200) {
        setIsInGame(response.data.is_in_game);
        setIsGameEnded(response.data.is_game_ended);
        if (!response.data.is_in_game) {
          toast.warning("You are not assigned to this game.", {
            toastId: "not-assigned",
          });
        }
      }
    } catch (error) {
      if (error.response?.status === 410) {
        toast.info("This game has ended.", {
          toastId: "game-ended",
        });
        setIsGameEnded(true);
        setIsInGame(false);
      } else if (error.response?.status === 404) {
        toast.error("Game not found.", {
          toastId: "game-not-found",
        });
        setIsInGame(false);
      } else {
        toast.error("An unexpected error occurred. Please try again later.", {
          toastId: "unexpected-error",
        });
        setIsInGame(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPlayerInGame(); // Check the user's status in the game on component mount
  }, [code]); // Dependency on 'code' to re-check when game code changes

  useEffect(() => {
    if (!loading && (isInGame === false || isGameEnded === true)) {
      navigate('/'); // Redirect to the homepage if the user is not in the game or the game is ended
    }
  }, [isInGame, isGameEnded, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
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
