import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from 'recharts';

interface RiskDataPoint {
  date: string;
  weather: number;
  water: number;
  nutrient: number;
  disease: number;
  overall: number;
}

interface RiskTrendChartProps {
  data: RiskDataPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-date">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data, height = 300 }) => {
  const riskLabels: Record<string, string> = {
    weather: 'ამინდი',
    water: 'წყალი',
    nutrient: 'საკვები',
    disease: 'დაავადება',
    overall: 'საერთო'
  };

  const colors = {
    weather: '#2196F3',
    water: '#00BCD4',
    nutrient: '#4CAF50',
    disease: '#FF5722',
    overall: '#9C27B0'
  };

  return (
    <div className="risk-trend-chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            fontSize={12}
            tickMargin={10}
          />
          <YAxis
            stroke="#666"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => riskLabels[value] || value}
            wrapperStyle={{ paddingTop: 20 }}
          />
          <Line
            type="monotone"
            dataKey="overall"
            stroke={colors.overall}
            strokeWidth={3}
            dot={{ fill: colors.overall, strokeWidth: 2 }}
            activeDot={{ r: 8 }}
            name="overall"
          />
          <Line
            type="monotone"
            dataKey="weather"
            stroke={colors.weather}
            strokeWidth={2}
            dot={{ fill: colors.weather }}
            name="weather"
          />
          <Line
            type="monotone"
            dataKey="water"
            stroke={colors.water}
            strokeWidth={2}
            dot={{ fill: colors.water }}
            name="water"
          />
          <Line
            type="monotone"
            dataKey="nutrient"
            stroke={colors.nutrient}
            strokeWidth={2}
            dot={{ fill: colors.nutrient }}
            name="nutrient"
          />
          <Line
            type="monotone"
            dataKey="disease"
            stroke={colors.disease}
            strokeWidth={2}
            dot={{ fill: colors.disease }}
            name="disease"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface YieldHistoryDataPoint {
  date: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface YieldHistoryChartProps {
  data: YieldHistoryDataPoint[];
  height?: number;
}

export const YieldHistoryChart: React.FC<YieldHistoryChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="yield-history-chart">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            fontSize={12}
            tickMargin={10}
          />
          <YAxis
            yAxisId="left"
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}t`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#666"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: any, name?: string) => {
              if (name === 'confidence') return [`${value}%`, 'სანდოობა'];
              return [`${(value / 1000).toFixed(2)} t`, name === 'predicted' ? 'პროგნოზი' : 'ფაქტიური'];
            }}
          />
          <Legend
            formatter={(value) => {
              const labels: Record<string, string> = {
                predicted: 'პროგნოზირებული',
                actual: 'ფაქტიური',
                confidence: 'სანდოობა'
              };
              return labels[value] || value;
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="predicted"
            fill="#4CAF50"
            opacity={0.8}
            name="predicted"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="actual"
            fill="#FF9800"
            opacity={0.8}
            name="actual"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="confidence"
            stroke="#9C27B0"
            strokeWidth={2}
            dot={{ fill: '#9C27B0' }}
            name="confidence"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

interface RiskGaugeChartProps {
  score: number;
  level: 'low' | 'medium' | 'high';
  size?: number;
}

export const RiskGaugeChart: React.FC<RiskGaugeChartProps> = ({ score, level, size = 200 }) => {
  const getColor = () => {
    switch (level) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="risk-gauge-chart" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text
          x="50"
          y="45"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={getColor()}
        >
          {score}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="10"
          fill="#666"
        >
          რისკის ქულა
        </text>
      </svg>
    </div>
  );
};

interface RiskDistributionChartProps {
  weather: number;
  water: number;
  nutrient: number;
  disease: number;
  height?: number;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  weather,
  water,
  nutrient,
  disease,
  height = 250
}) => {
  const data = [
    { name: 'ამინდი', score: weather, fill: '#2196F3' },
    { name: 'წყალი', score: water, fill: '#00BCD4' },
    { name: 'საკვები', score: nutrient, fill: '#4CAF50' },
    { name: 'დაავადება', score: disease, fill: '#FF5722' }
  ];

  return (
    <div className="risk-distribution-chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke="#666" fontSize={12} />
          <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
          <Tooltip formatter={(value: any) => [`${value}%`, 'რისკი']} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#8884d8"
            fill="url(#colorGradient)"
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskTrendChart;
