import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './UserPlot.css';

// Rejestracja skal i elementów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale, // Rejestracja TimeScale, która była przyczyną błędu
  PointElement,
  BarElement,
  LineElement,
  Tooltip,
  Filler
);

const ColumnChart = ({ labels, yData }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: yData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Usuwamy legendę
      },
      title: {
        display: false, // Usuwamy tytuł
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          tooltipFormat: 'yyyy-MM-dd',
        },
        ticks: {
          display: false,
          color: 'white',
          font: {
            size: 14,
          },
        },
      },
      y: {
        beginAtZero: true, // Oś Y zaczyna się od zera
        ticks: {
            display: false,
          color: 'white',
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return (
    <div className="plot-placeholder">
      <Bar data={data} options={options} />
    </div>
  );
};

export default ColumnChart;
