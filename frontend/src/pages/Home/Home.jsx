import React, { useEffect, useState } from 'react';
import UserMenu from "../../components/UserMenu/UserMenu";
import './Home.css'; // Stylizacja dla komponentu
import MyStats from "../../components/MyStats/MyStats";
import DebtSettlement from "../../components/DebtSettlement/DebtSettlement";
import UserPlot from "../../components/UserPlot/UserPlot";
import api from '../../api';  // Zakładam, że masz gotowy moduł API do komunikacji z backendem

const Home = () => {
  const [username, setUsername] = useState(''); // Stan do przechowywania nazwy użytkownika

  // Użycie useEffect do pobrania danych użytkownika
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/user/');  // Wywołanie backendu
        setUsername(response.data.username);  // Ustawienie nazwy użytkownika
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
