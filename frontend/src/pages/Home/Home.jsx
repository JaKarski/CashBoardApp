import React, { useEffect, useState } from 'react';
import UserMenu from "../../components/UserMenu/UserMenu";
import './Home.css';
import MyStats from "../../components/MyStats/MyStats";
import DebtSettlement from "../../components/DebtSettlement/DebtSettlement";
import UserPlot from "../../components/UserPlot/UserPlot";
import api from '../../api';
const Home = () => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/user/');
        setUsername(response.data.username); 
      } catch (error) {
        console.error("Błąd podczas pobierania danych użytkownika:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="home-container">
      <UserMenu />
      <h1>Welcome {username}</h1>  {/* Wyświetlanie nazwy użytkownika */}
      <div className="content-grid">
        <MyStats />
        <DebtSettlement />
        <UserPlot />
      </div>
    </div>
  );
};

export default Home;
