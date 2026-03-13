import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CloudRain,
  Grid3X3,
  FileSpreadsheet,
  LayoutGrid,
  Calendar,
  BarChart,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Sidebar.scss';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  // Main menu items matching MainMenuPage
  const menuItems = [
    { path: '/app/main-menu', label: 'მთავარი მენიუ', icon: Home },
    { path: '/app/weather', label: 'ამინდი', icon: CloudRain },
    { path: '/app/company', label: 'კომპანია', icon: Grid3X3 },
    { path: '/app/electronic-field-map', label: 'ელექტრონული საველე რუკები', icon: FileSpreadsheet },
    { path: '/app/dictionaries', label: 'ლექსიკონები', icon: LayoutGrid },
  ];

  const adminItems = [
    { path: '/app/admin', label: 'ადმინ პანელი', icon: Settings },
    { path: '/app/admin/task-scheduler', label: 'დავალებების დაგეგმვა', icon: Calendar },
    { path: '/app/admin/system-status', label: 'სისტემის სტატუსი', icon: BarChart },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h2>MLAgro</h2>}
        <button className="sidebar-toggle" onClick={onToggle}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
        <div className="nav-section admin-section">
          <div className="section-title">{isOpen && 'ადმინისტრირება'}</div>
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};