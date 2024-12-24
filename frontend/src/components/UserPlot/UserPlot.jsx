import React, { useState, useEffect } from 'react';
import { splitDataAtZero } from '../../utils/splitData';
import LineChart from './LineChart';
import ColumnChart from './ColumnChart';
import './UserPlot.css';
import api from '../../api';  // Zakładam, że masz gotowy moduł API do komunikacji z backendem

const UserPlot = () => {
  const [isFullscreen, setIsFullscreen] = useState(false); // Stan pełnoekranowy
  const [plotData, setPlotData] = useState({
    labels: [],
    single_game_results: [],
    cumulative_results: []
  });

  // Pobieranie danych z API po załadowaniu komponentu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/user/plot-data/');
        setPlotData(response.data);  // Ustawiamy dane dla wykresów
      } catch (error) {
        console.error("Błąd podczas pobierania danych do wykresu:", error);
      }
    };

    fetchData();
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen); // Zmieniamy stan pełnoekranowy
  };

  // Rozdzielenie danych na dodatnie i ujemne wyniki dla LineChart
  const { labels, positive, negative, pointRadiusPositive, pointRadiusNegative } = splitDataAtZero(
    plotData.labels.map(date => new Date(date)),  // Konwersja dat na obiekty Date
    plotData.cumulative_results
  );

  return (
    <div className={`plot-section ${isFullscreen ? 'fullscreen' : ''}`}>
      <h2>Plots</h2>

      {/* Przycisk powiększenia */}
      {!isFullscreen && (
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          &#x26F6; {/* Ikona powiększenia */}
        </button>
      )}

      {/* Wykresy */}
      <LineChart
        labels={labels}
        positiveData={positive}
        negativeData={negative}
        pointRadiusPositive={pointRadiusPositive}
        pointRadiusNegative={pointRadiusNegative}
      />
      <ColumnChart labels={plotData.labels} yData={plotData.single_game_results} />

      {/* Przycisk zamknięcia trybu fullscreen */}
      {isFullscreen && (
        <button className="close-fullscreen-btn" onClick={toggleFullscreen}>
          &#x2716; {/* Ikona zamknięcia */}
        </button>
      )}
    </div>
  );
};

export default UserPlot;
