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
  ChevronRight,
  FileText,
  MessageSquare,
  FolderOpen,
  Bug,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.scss';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const menuItems = [
    { path: '/app/main-menu', label: 'მთავარი მენიუ', icon: Home },
    { path: '/app/weather', label: 'ამინდი', icon: CloudRain },
    { path: '/app/company', label: 'კომპანია', icon: Grid3X3 },
    { path: '/app/electronic-field-map', label: 'ელექტრონული საველე რუკები', icon: FileSpreadsheet },
    { path: '/app/dictionaries', label: 'ლექსიკონები', icon: LayoutGrid },
    { path: '/app/plant-disease', label: 'დაავადების ანალიზი', icon: Bug },
  ];

  const adminItems = [
    { path: '/app/admin', label: 'ადმინ პანელი', icon: Settings },
    { path: '/app/admin/task-scheduler', label: 'დავალებების დაგეგმვა', icon: Calendar },
    { path: '/app/admin/system-status', label: 'სისტემის სტატუსი', icon: BarChart },
    { path: '/app/admin/logging', label: 'ლოგები', icon: FileText },
    { path: '/app/admin/appeals', label: 'აპელაციები', icon: MessageSquare },
    { path: '/app/admin/file-storage', label: 'ფაილ სტორიჯი', icon: FolderOpen },
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
        <div className="nav-section chat-section">
          <NavLink
            to="/app/company/chat"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={20} />
            {isOpen && <span>ჩატი</span>}
          </NavLink>
        </div>
        {isAdmin && (
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
        )}
      </nav>
    </aside>
  );
};