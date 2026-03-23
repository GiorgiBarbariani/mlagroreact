import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Map, BarChart3, ArrowLeft, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import './WeatherPage.scss';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button className="collapsible-header" onClick={() => setExpanded(!expanded)}>
        <span className="collapsible-title">{title}</span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {expanded && <div className="collapsible-content">{children}</div>}
    </div>
  );
};

interface ReportItemProps {
  title: string;
  date: string;
  color?: string;
}

const ReportItem: React.FC<ReportItemProps> = ({ title, date, color = '#E74C3C' }) => (
  <div className="report-item">
    <div className="report-item-left">
      <FileText size={18} color={color} />
      <div>
        <span className="report-title">{title}</span>
        <span className="report-date">{date}</span>
      </div>
    </div>
    <button className="download-btn">
      <Download size={18} color={color} />
    </button>
  </div>
);

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
        <button className="back-btn" onClick={() => navigate('/app/main-menu')}>
          <ArrowLeft size={20} />
          <span>უკან</span>
        </button>
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
            {/* Section 1: Climate Deviations */}
            <CollapsibleSection title="კლიმატური გადახრები რეგიონების მიხედვით" defaultOpen>
              <ReportItem title="Source 1" date="თარიღი: 05.03.2024" color="#E74C3C" />
              <ReportItem title="Source 2" date="თარიღი: 16.08.2024" color="#E74C3C" />
              <ReportItem title="Source 3" date="თარიღი: 03.09.2024" color="#E74C3C" />
            </CollapsibleSection>

            <div className="section-divider" />

            {/* Section 2: Weather Reports by Date */}
            <CollapsibleSection title="ამინდის რეპორტი თარიღების მიხედვით">
              <ReportItem title="თვიური რეპორტი - თებერვალი 2024" date="ატვირთვის თარიღი: 01.03.2024" color="#4A90D9" />
              <ReportItem title="თვიური რეპორტი - იანვარი 2024" date="ატვირთვის თარიღი: 02.02.2024" color="#4A90D9" />
              <ReportItem title="წლიური რეპორტი - 2023" date="ატვირთვის თარიღი: 15.01.2024" color="#4A90D9" />
            </CollapsibleSection>

            <div className="section-divider" />

            {/* Section 3: Seasonal Analysis */}
            <CollapsibleSection title="სეზონური ანალიზი და რეკომენდაციები">
              <ReportItem title="გაზაფხულის სეზონი 2024 - ანალიზი" date="ატვირთვის თარიღი: 15.06.2024" color="#27AE60" />
              <ReportItem title="ზამთრის სეზონი 2023-2024" date="ატვირთვის თარიღი: 01.03.2024" color="#27AE60" />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;