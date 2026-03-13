import { apiClient } from '../api/apiClient';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

class NotificationService {
  private socket: Socket | null = null;
  private notificationCallbacks: ((notification: Notification) => void)[] = [];

  // Initialize socket for real-time notifications
  initSocket(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    const apiUrl = import.meta.env.PROD
      ? 'https://mlagronode-production.up.railway.app'
      : (import.meta.env.VITE_API_URL || 'http://localhost:7001').replace('/api', '');

    try {
      this.socket = io(apiUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.socket?.emit('notification:subscribe', { userId });
      });

      this.socket.on('notification:new', (notification: Notification) => {
        this.notificationCallbacks.forEach(cb => cb(notification));
      });
    } catch (error) {
      console.error('Notification socket connection error:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to new notifications
  onNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  // Get notifications list
  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    try {
      const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data?.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark single notification as read
  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Format time ago
  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ახლახანს';
    if (diffMins < 60) return `${diffMins} წთ წინ`;
    if (diffHours < 24) return `${diffHours} სთ წინ`;
    if (diffDays < 7) return `${diffDays} დღის წინ`;

    return date.toLocaleDateString('ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Get icon type based on notification type
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'task_assigned': return 'clipboard';
      case 'task_updated': return 'edit';
      case 'weather_alert': return 'cloud';
      case 'satellite_update': return 'satellite';
      case 'subscription': return 'credit-card';
      case 'company': return 'building';
      case 'field_update': return 'map';
      default: return 'bell';
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
