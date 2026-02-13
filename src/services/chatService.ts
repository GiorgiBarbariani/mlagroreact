import { apiClient } from '../api/apiClient';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  messageType?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Conversation {
  userId: string;
  userIdentityId?: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface OnlineUser {
  userId: string;
  userName: string;
}

class ChatService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private onlineUsersCallbacks: ((users: OnlineUser[]) => void)[] = [];
  private typingCallbacks: ((data: { from: string; isTyping: boolean }) => void)[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;

  // Initialize socket connection
  initSocket(userId: string, userName: string) {
    if (this.socket?.connected) {
      return;
    }

    this.currentUserId = userId;
    this.currentUserName = userName;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7001';
    const socketUrl = apiUrl.replace('/api', '');

    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        // Register user
        this.socket?.emit('register', { userId, userName });
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Listen for new messages
      this.socket.on('new-message', (message: ChatMessage) => {
        this.messageCallbacks.forEach(cb => cb(message));
      });

      // Listen for online users
      this.socket.on('online-users', (users: OnlineUser[]) => {
        this.onlineUsersCallbacks.forEach(cb => cb(users));
      });

      this.socket.on('user-online', (user: OnlineUser) => {
        // Trigger refresh of online users
        this.socket?.emit('get-online-users');
      });

      this.socket.on('user-offline', (user: OnlineUser) => {
        // Trigger refresh of online users
        this.socket?.emit('get-online-users');
      });

      // Listen for typing indicators
      this.socket.on('typing', (data: { from: string; isTyping: boolean }) => {
        this.typingCallbacks.forEach(cb => cb(data));
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      // Start polling as fallback
      this.startPolling();
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopPolling();
  }

  // Start polling as fallback
  private startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      // Poll for new messages - this is a simple implementation
      // In production, you'd want to track last message timestamp
    }, 3000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Get all conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get('/chat/conversations');
      if (response.data && response.data.conversations) {
        return response.data.conversations;
      }
      return [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get messages with specific user
  async getMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`/chat/messages/${userId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Send message
  async sendMessage(toUserId: string, message: string, fileData?: {
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    messageType?: string;
  }): Promise<ChatMessage | null> {
    try {
      const payload: any = {
        toUserId,
        message,
        messageType: fileData?.messageType || 'text'
      };

      if (fileData) {
        payload.fileName = fileData.fileName;
        payload.fileUrl = fileData.fileUrl;
        payload.fileSize = fileData.fileSize;
        payload.mimeType = fileData.mimeType;
      }

      const response = await apiClient.post('/chat/send', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Mark messages as read
  async markAsRead(userId: string): Promise<void> {
    try {
      await apiClient.post(`/chat/mark-read/${userId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Upload file
  async uploadFile(file: File): Promise<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/chat/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  // Send typing indicator
  sendTypingIndicator(toUserId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { to: toUserId, isTyping });
    }
  }

  // Get online users
  getOnlineUsers() {
    if (this.socket?.connected) {
      this.socket.emit('get-online-users');
    }
  }

  // Subscribe to new messages
  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to online users changes
  onOnlineUsersChange(callback: (users: OnlineUser[]) => void) {
    this.onlineUsersCallbacks.push(callback);
    return () => {
      this.onlineUsersCallbacks = this.onlineUsersCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to typing indicators
  onTyping(callback: (data: { from: string; isTyping: boolean }) => void) {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on mime type
  getFileIcon(mimeType: string): string {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('zip') || mimeType?.includes('archive')) return '📦';
    if (mimeType?.startsWith('video/')) return '🎬';
    if (mimeType?.startsWith('audio/')) return '🎵';
    return '📎';
  }
}

export const chatService = new ChatService();
export default chatService;
