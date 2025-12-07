import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartData {
  chart_type: string;
  data: {
    labels: string[];
    values: number[]; // From backend structure
  };
  title?: string;
  explanation?: string;
}

interface Props {
  chartData: ChartData;
}

export const ChartRenderer: React.FC<Props> = ({ chartData }) => {
  const { chart_type, data, title, explanation } = chartData;

  const chartDataConfig = {
    labels: data.labels,
    datasets: [
      {
        label: title || 'Data',
        data: data.values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
  };

  if (chart_type === 'bar') return <Bar options={options} data={chartDataConfig} />;
  if (chart_type === 'line') return <Line options={options} data={chartDataConfig} />;
  if (chart_type === 'pie') return <Pie options={options} data={chartDataConfig} />;
  
  if (chart_type === 'kpi') {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-gray-500 font-medium uppercase text-sm mb-2">{title || 'KPI'}</h3>
            <div className="text-4xl font-bold text-blue-600">
                {data.values[0] ? data.values[0].toLocaleString() : 0}
            </div>
            {data.labels[0] && <div className="text-sm text-gray-400 mt-1">{data.labels[0]}</div>}
        </div>
    );
  }

  return <div>Unsupported chart type: {chart_type}</div>;
};

