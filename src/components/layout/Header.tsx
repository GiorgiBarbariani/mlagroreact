import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { companyService } from '../../services/companyService';
import { Bell, Menu, Search, User } from 'lucide-react';
import { NotificationModal } from './NotificationModal';
import { Modal } from '../common';
import './Header.scss';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { unreadCount, openModal } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyCreatedAt, setCompanyCreatedAt] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCompanyRole = user?.role === 'Company' || user?.role === 'Admin';

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const months = [
        'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
        'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
      ];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Fetch company info when role modal opens
  useEffect(() => {
    if (isRoleModalOpen && user?.companyId && !companyName) {
      companyService.getCompanyInfo()
        .then((company) => {
          setCompanyName(company.name);
          setCompanyCreatedAt(company.createdAt);
        })
        .catch(() => {
          setCompanyName(null);
        });
    }
  }, [isRoleModalOpen, user?.companyId, companyName]);

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
    <>
      <header className="app-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={onMenuToggle}>
            <Menu size={24} />
          </button>
         
        </div>
        <div className="header-right">
          <button className="header-icon" onClick={openModal}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
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
              <a href="/app/subscription">გამოწერა</a>
              <button onClick={() => {
                setIsRoleModalOpen(true);
                setIsDropdownOpen(false);
              }}>თქვენი როლი</button>
              <button onClick={() => {
                logout();
                setIsDropdownOpen(false);
              }}>გასვლა</button>
            </div>
          </div>
        </div>
      </header>
      <NotificationModal />
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="როლი"
        className="role-modal"
      >
        <div className="role-modal-info">
          <div className="role-info-row">
            <span className="role-info-label">თქვენი როლი</span>
            <span className="role-info-value">
              {isCompanyRole ? 'კომპანიის მფლობელი' : user?.role || '—'}
            </span>
          </div>
          <div className="role-info-row">
            <span className="role-info-label">
              {isCompanyRole ? 'თქვენი კომპანიის დასახელება' : 'კომპანია რომელმაც დაგამატათ'}
            </span>
            <span className="role-info-value">
              {companyName || 'არ არის მითითებული'}
            </span>
          </div>
          <div className="role-info-row">
            <span className="role-info-label">
              {isCompanyRole ? 'კომპანიის ანგარიშის შექმნის თარიღი' : 'დამატების თარიღი'}
            </span>
            <span className="role-info-value">
              {isCompanyRole
                ? (companyCreatedAt ? formatDate(companyCreatedAt) : '—')
                : (user?.createdAt ? formatDate(user.createdAt) : '—')
              }
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};
