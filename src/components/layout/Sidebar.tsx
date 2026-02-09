import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Map,
  Cloud,
  Satellite,
  Building,
  Calendar,
  BarChart,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Database,
  Image
} from 'lucide-react';
import './Sidebar.scss';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const menuItems = [
    { path: '/app/main-menu', label: 'მთავარი მენიუ', icon: Home },
    { path: '/app/dashboard', label: 'სამუშაო პანელი', icon: BarChart },
    { path: '/app/electronic-field-map', label: 'მინდვრების რუკა', icon: Map },
    { path: '/app/my-fields', label: 'ჩემი მინდვრები', icon: Layers },
    { path: '/app/weather', label: 'ამინდი', icon: Cloud },
    { path: '/app/satellite-data', label: 'სატელიტური მონაცემები', icon: Satellite },
    { path: '/app/satellite-images', label: 'სატელიტური სურათები', icon: Image },
    { path: '/app/dictionaries', label: 'ცნობარები', icon: Database },
    { path: '/app/company', label: 'კომპანია', icon: Building },
    { path: '/app/subscription', label: 'გამოწერა', icon: Calendar },
    { path: '/app/help/support-tickets', label: 'მხარდაჭერა', icon: HelpCircle },
    { path: '/app/settings', label: 'პარამეტრები', icon: Settings },
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