import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import api from "../../api";
import './UserMenu.css';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isSuperUser, setIsSuperUser] = useState(false);  // stan, czy użytkownik jest superużytkownikiem
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const handleProfile = () => {
    navigate('/wip');
  };

  const handleCreateGame = () => {
    navigate('/createGame');
  };

  const handleJoinRoom = async () => {
    if (roomCode.trim() !== '') {
      try {
        // Wysyłamy żądanie POST do API, aby dodać gracza do gry
        const response = await api.post('api/games/join/', { room_code: roomCode });
  
        // Sprawdzamy odpowiedź serwera
        if (response.status === 200) {
          alert("Dołączono do gry!");
          navigate(`/game/${roomCode}`);
        }
      } catch (error) {
        // Obsługa błędów
        if (error.response) {
          // Jeśli użytkownik już jest w grze
          if (error.response.status === 400 && error.response.data.detail === "Już dołączono do tej gry.") {
            alert("Już dołączono do tej gry.");
            // Przekierowanie do gry, jeśli użytkownik już w niej jest
            navigate(`/game/${roomCode}`);
          } else {
            alert(error.response.data.detail || "Wystąpił problem podczas dołączania do gry.");
          }
        } else {
          console.error("Błąd sieci:", error.message);
          alert("Wystąpił problem z siecią.");
        }
      }
    }
  };

  // Funkcja do sprawdzenia, czy użytkownik jest superużytkownikiem
  useEffect(() => {
    const checkSuperUserStatus = async () => {
      try {
        // Wysyłanie zapytania GET za pomocą Axios
        const response = await api.get('/api/check-superuser/');
    
        if (response.data.is_superuser) {
          setIsSuperUser(true);
        }
      } catch (error) {
        if (error.response) {
        }
      }
    };
    
    checkSuperUserStatus();
  }, []);  // Ten efekt uruchomi się raz, przy montowaniu komponentu

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="user-menu-container" ref={menuRef}>
      <div className="avatar" onClick={toggleMenu}>
        <FiUser size={24} />
      </div>
      {isOpen && (
        <div className="dropdown">
          <div className="dropdown-item join-room">
            <div className="form-group">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="form-input"
                required
                placeholder=" "
              />
              <label className="form-label">Room code</label>
            </div>
            <button className="join-room-button" onClick={handleJoinRoom}>
              Join
            </button>
          </div>

          {/* Wyświetl przycisk Create Game tylko dla superużytkowników */}
          {isSuperUser && (
            <button className="dropdown-item" onClick={handleCreateGame}>Create game</button>
          )}
          
          <button className="dropdown-item" onClick={handleProfile}>My profile</button>
          <button className="dropdown-item" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
