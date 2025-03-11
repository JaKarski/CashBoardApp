import React, { useState, useEffect } from 'react';
import { splitDataAtZero } from '../../utils/splitData';
import LineChart from './LineChart';
import ColumnChart from './ColumnChart';
import './UserPlot.css';
import api from '../../api'; 

const UserPlot = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [plotData, setPlotData] = useState({
    labels: [],
    single_game_results: [],
    cumulative_results: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/user/plot-data/');
        setPlotData(response.data); 
      } catch (error) {
        console.error("Błąd podczas pobierania danych do wykresu:", error);
      }
    };

    fetchData();
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const { labels, positive, negative, pointRadiusPositive, pointRadiusNegative } = splitDataAtZero(
    plotData.labels.map(date => new Date(date)),
    plotData.cumulative_results
  );

  return (
    <div className={`plot-section ${isFullscreen ? 'fullscreen' : ''}`}>
      <h2>Plots</h2>

      {!isFullscreen && (
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          &#x26F6; 
        </button>
      )}

      <LineChart
        labels={labels}
        positiveData={positive}
        negativeData={negative}
        pointRadiusPositive={pointRadiusPositive}
        pointRadiusNegative={pointRadiusNegative}
      />
      <ColumnChart labels={plotData.labels} yData={plotData.single_game_results} />

      {isFullscreen && (
        <button className="close-fullscreen-btn" onClick={toggleFullscreen}>
          &#x2716; 
        </button>
      )}
    </div>
  );
};

export default UserPlot;
