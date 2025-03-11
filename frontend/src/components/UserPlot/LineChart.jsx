import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './UserPlot.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const LineChart = ({ labels, positiveData, negativeData, pointRadiusPositive, pointRadiusNegative }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Negative Balance',
        data: negativeData,
        fill: {
          target: 'origin',
          below: 'rgba(255, 0, 0, 0.3)',
        },
        borderColor: 'red',
        pointBackgroundColor: 'red',
        tension: 0.1,
        borderWidth: 2,
        pointRadius: pointRadiusNegative,
        pointHoverRadius: 5,
      },
      {
        label: 'Positive Balance',
        data: positiveData,
        fill: {
          target: 'origin',
          above: 'rgba(0, 255, 0, 0.3)',
        },
        borderColor: 'green',
        pointBackgroundColor: 'green',
        tension: 0.1,
        borderWidth: 2,
        pointRadius: pointRadiusPositive,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
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
        min: Math.min(...positiveData.concat(negativeData)) - 100,
        max: Math.max(...positiveData.concat(negativeData)) + 100,
        ticks: {
          display: false,
          color: 'white',
          font: {
            size: 14,
          },
          callback: function (value) {
            return value.toLocaleString();
          },
        },
        title: {
          display: false,
          text: 'Cumulative Balance',
          color: 'white',
          font: {
            size: 16,
          },
        },
      },
    },
  };

  return (
    <div className="plot-placeholder">
      <Line data={data} options={options} />
    </div>
  );
};

export default LineChart;
