import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudRain, Grid3X3, FileSpreadsheet, LayoutGrid, Bug, Brain } from 'lucide-react';
import './MainMenuPage.scss';

const MainMenuPage: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'weather',
      title: 'ამინდი',
      icon: CloudRain,
      color: 'yellow',
      path: '/app/weather',
      description: 'ამინდის პროგნოზი და ანალიზი'
    },
    {
      id: 'company',
      title: 'კომპანია',
      icon: Grid3X3,
      color: 'green',
      path: '/app/company',
      description: 'კომპანიის მართვა'
    },
    {
      id: 'electronic-field-map',
      title: 'ელექტრონული საველე რუკები',
      icon: FileSpreadsheet,
      color: 'blue',
      path: '/app/electronic-field-map',
      description: 'საველე რუკების მართვა'
    },
    {
      id: 'dictionaries',
      title: 'ლექსიკონები',
      icon: LayoutGrid,
      color: 'gray',
      path: '/app/dictionaries',
      description: 'სისტემის ლექსიკონები'
    },
    {
      id: 'plant-disease',
      title: 'დაავადების ანალიზი',
      icon: Bug,
      color: 'orange',
      path: '/app/plant-disease',
      description: 'მცენარეთა დაავადებების იდენტიფიკაცია'
    },
    {
      id: 'field-analysis',
      title: 'AI მინდვრის ანალიზი',
      icon: Brain,
      color: 'purple',
      path: '/app/field-analysis',
      description: 'ხელოვნური ინტელექტით მინდვრის ანალიზი'
    }
  ];

  return (
    <div className="mainmenu-page">
      <div className="menu-header">
        <h1>მთავარი მენიუ</h1>
      </div>

      <div className="menu-grid">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`menu-card ${item.color}`}
              onClick={() => navigate(item.path)}
            >
              <div className="card-content">
                <div className="icon-wrapper">
                  <Icon size={32} />
                </div>
                <h2>{item.title}</h2>
                <p className="description">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MainMenuPage;
