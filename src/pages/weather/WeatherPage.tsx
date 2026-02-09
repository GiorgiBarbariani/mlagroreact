import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Map, BarChart3 } from 'lucide-react';
import './WeatherPage.scss';

const WeatherPage: React.FC = () => {
  const navigate = useNavigate();

  const weatherModules = [
    {
      id: 'gis',
      title: 'GIS',
      icon: Globe,
      color: 'blue',
      path: '/app/weather/gis',
      description: 'გეოინფორმაციული სისტემა'
    },
    {
      id: 'weather-map',
      title: 'ამინდის რუკა',
      icon: Map,
      color: 'green',
      path: '/app/weather/map',
      description: 'ამინდის პროგნოზის რუკა'
    },
    {
      id: 'analytics',
      title: 'ანალიტიკა',
      icon: BarChart3,
      color: 'gray',
      path: '/app/weather/analytics',
      description: 'ამინდის მონაცემების ანალიზი'
    }
  ];

  return (
    <div className="weather-page">
      <div className="page-header">
        <h1>ამინდი</h1>
        <p className="page-description">ამინდის პროგნოზი და ანალიზი</p>
      </div>

      <div className="modules-grid">
        {weatherModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className={`module-card ${module.color}`}
              onClick={() => navigate(module.path)}
            >
              <div className="card-content">
                <div className="icon-wrapper">
                  <Icon size={28} />
                </div>
                <h2>{module.title}</h2>
                <p className="description">{module.description}</p>
              </div>
              <div className="card-background">
                <Icon size={120} strokeWidth={0.5} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Weather Information Section */}
      <div className="weather-info-section">
        <h2>შემაჯამებელი ინფორმაცია</h2>
        <div className="info-cards">
          <div className="info-card">
            <h3>კლიმატური გადახრები რეგიონების მიხედვით</h3>
            <ul>
              <li>Source 1: 05.03.2024</li>
              <li>Source 2: 16.08.2024</li>
              <li>Source 3: 03.09.2024</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;