import React, { useState, useEffect, useRef } from 'react';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import api from "../../api";
import './UserMenu.css';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isSuperUser, setIsSuperUser] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => navigate('/logout');
  const handleProfile = () => navigate('/wip');
  const handleCreateGame = () => navigate('/createGame');

  const handleJoinRoom = async () => {
    if (roomCode.trim() !== '') {
      try {
        const response = await api.post('api/games/join/', { room_code: roomCode });

        if (response.status === 200) {
          toast.success("Included in the game!", { toastId: "included" });
          navigate(`/game/${roomCode}`);
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 400 && error.response.data.detail === "Already attached to this game.") {
            toast.error("You have already joined the game", { toastId: "already_in_game" });
            navigate(`/game/${roomCode}`);
          } else {
            toast.error(error.response.data.detail || "There was a problem when joining the game.", { toastId: "network_problem" });
          }
        } else {
          toast.error("There was a network problem.", { toastId: "network_problem" });
        }
      }
    }
  };

  useEffect(() => {
    const checkSuperUserStatus = async () => {
      try {
        const response = await api.get('/api/check-superuser/');
        if (response.data.is_superuser) {
          setIsSuperUser(true);
        }
      } catch (error) {}
    };
    checkSuperUserStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="user-menu-container" ref={menuRef}>
      <div className="avatar" role="button" onClick={toggleMenu}>
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
                placeholder="Room code"
              />
              <label className="form-label">Room code</label>
            </div>
            <button className="join-room-button" onClick={handleJoinRoom}>Join</button>
          </div>

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
