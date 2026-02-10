import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Menu, Search, User } from 'lucide-react';
import './Header.scss';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <div className="search-box">
          <Search size={20} />
          <input type="text" placeholder="ძებნა..." />
        </div>
      </div>
      <div className="header-right">
        <button className="header-icon">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        <div className="user-menu" ref={dropdownRef}>
          <button
            className="user-menu-toggle"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <User size={20} />
            <span>{user?.name || 'მომხმარებელი'}</span>
          </button>
          <div className={`user-dropdown ${isDropdownOpen ? 'show' : ''}`}>
            <a href="/app/profile">პროფილი</a>
            <a href="/app/settings">პარამეტრები</a>
            <button onClick={() => {
              logout();
              setIsDropdownOpen(false);
            }}>გასვლა</button>
          </div>
        </div>
      </div>
    </header>
  );
};