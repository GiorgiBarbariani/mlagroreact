import React, { useRef, useEffect, useMemo } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationService } from '../../services/notificationService';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ClipboardList,
  Edit3,
  Cloud,
  Satellite,
  CreditCard,
  Building,
  Map
} from 'lucide-react';
import './NotificationModal.scss';

const iconMap: Record<string, React.FC<{ size?: number }>> = {
  clipboard: ClipboardList,
  edit: Edit3,
  cloud: Cloud,
  satellite: Satellite,
  'credit-card': CreditCard,
  building: Building,
  map: Map,
  bell: Bell
};

export const NotificationModal: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isModalOpen,
    isLoading,
    closeModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    hasMore
  } = useNotifications();

  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeModal]);

  // Infinite scroll
  const handleScroll = () => {
    if (!listRef.current || !hasMore || isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  };

  // Sort: unread first (newest on top), then read (newest on top)
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1; // unread first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

  if (!isModalOpen) return null;

  const getIcon = (type: string) => {
    const iconName = notificationService.getNotificationIcon(type);
    const IconComponent = iconMap[iconName] || Bell;
    return <IconComponent size={20} />;
  };

  return (
    <div className="notification-overlay" onClick={closeModal}>
      <div
        className="notification-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notification-modal-header">
          <div className="header-left">
            <h2>შეტყობინებები</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="ყველას წაკითხულად მონიშვნა"
              >
                <CheckCheck size={16} />
                <span>ყველას წაკითხვა</span>
              </button>
            )}
            <button className="close-btn" onClick={closeModal}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div
          className="notification-list"
          ref={listRef}
          onScroll={handleScroll}
        >
          {sortedNotifications.length === 0 && !isLoading ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>შეტყობინებები არ არის</p>
            </div>
          ) : (
            sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              >
                <div className="notification-icon">
                  {getIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {notificationService.formatTimeAgo(notification.createdAt)}
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn"
                      onClick={() => markAsRead(notification.id)}
                      title="წაკითხულად მონიშვნა"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteNotification(notification.id)}
                    title="წაშლა"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
