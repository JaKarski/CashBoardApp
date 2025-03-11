import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faClock, faTrophy, faChartLine, faCoins, faPlayCircle, faWallet } from '@fortawesome/free-solid-svg-icons';

import "./MyStats.css";
import api from '../../api';

const MyStats = () => {
  const [stats, setStats] = useState({
    earn: 0,
    games_played: 0,
    total_play_time: 0,
    hourly_rate: 0,
    highest_win: 0,
    average_stake: 0,
    win_rate: 0,
    total_buyin: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/user/stats/');
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStats();
  }, []);

  // Map labels to corresponding icons
  const getIconForLabel = (label) => {
    switch (label) {
      case 'Earn':
      case 'Highest Win':
        return faDollarSign;
      case 'Games Played':
        return faPlayCircle;
      case 'Total Play Time':
        return faClock;
      case 'Hourly Rate':
      case 'Average Stake':
        return faCoins;
      case 'Tournaments Won':
        return faTrophy;
      case 'Win Rate':
        return faChartLine;
      case 'Total Buy-in':
        return faWallet;
      default:
        return null;
    }
  };

  const statsData = [
    { label: 'Earn', value: `PLN ${stats.earn}` },
    { label: 'Games Played', value: stats.games_played },
    { label: 'Total Play Time', value: `${stats.total_play_time} hours` },
    { label: 'Hourly Rate', value: `PLN ${stats.hourly_rate}/hour` },
    { label: 'Highest Win', value: `PLN ${stats.highest_win}` },
    { label: 'Average Stake', value: `PLN ${stats.average_stake}` },
    { label: 'Win Rate', value: `${stats.win_rate}` },
    { label: 'Total Buy-in', value: `PLN ${stats.total_buyin}` },
  ];

  return (
    <div className="stats-section">
      <h2>My Poker Stats</h2>
      {statsData.map((stat, index) => (
        <div className="stat" key={index}>
          <FontAwesomeIcon icon={getIconForLabel(stat.label)} className="icon" />
          <p>
            <strong>{stat.label}:</strong> {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MyStats;
