// Profile.jsx
import React from "react";
import UserDetail from "../../components/UserDetail/UserDetail";
import UserGameData from "../../components/UserGameData/UserGameData";
import UserStatistics from "../../components/UserStatistics/UserStatistics";
import "./Profile.css"; 

const Profile = () => {
  return (
    <div className="profile-page">
      <section className="user-section">
        <h2>Dane użytkownika</h2>
        <UserDetail />
      </section>

      <section className="game-section">
        <h2>Dane dotyczące gier</h2>
        <UserGameData />
      </section>

      <section className="stat-section">
        <h2>Dane statystyczne</h2>
        <UserStatistics />
      </section>
    </div>
  );
};

export default Profile;
