import React, { useState, useEffect, useRef } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import InfoIcon from '@mui/icons-material/Info';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MinimizeIcon from '@mui/icons-material/Minimize';
import SettingsIcon from '@mui/icons-material/Settings';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import AddCommentIcon from '@mui/icons-material/AddComment';
import GroupIcon from '@mui/icons-material/Group';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import type { ChatMessage, Conversation, OnlineUser } from '../../services/chatService';
import './ChatPage.scss';

type TabType = 'all' | 'unread' | 'groups';
type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface ExtendedConversation extends Conversation {
  role?: string;
  status?: UserStatus;
  surname?: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ExtendedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ExtendedConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  // Video call states
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected' | null>(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<ExtendedConversation | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize chat
  useEffect(() => {
    if (user?.id) {
      const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || user.email;

      chatService.initSocket(user.id, userName);
      loadConversations();

      // Subscribe to events
      const unsubMessage = chatService.onMessage(handleNewMessage);
      const unsubOnline = chatService.onOnlineUsersChange(setOnlineUsers);
      const unsubTyping = chatService.onTyping(handleTypingIndicator);

      // Get initial online users
      chatService.getOnlineUsers();

      return () => {
        unsubMessage();
        unsubOnline();
        unsubTyping();
        chatService.disconnect();
        // Clean up video stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [user?.id]);

  // Filter conversations when search or tab changes
  useEffect(() => {
    let filtered = conversations;

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(conv => conv.unreadCount > 0);
    } else if (activeTab === 'groups') {
      // Groups not implemented yet
      filtered = [];
    }

    // Filter by search
    if (searchTerm.trim()) {
      filtered = filtered.filter(conv =>
        conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredConversations(filtered);
  }, [searchTerm, conversations, activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      // Enhance with status
      const enhanced = data.map(conv => ({
        ...conv,
        status: isUserOnline(conv.userIdentityId || conv.userId) ? 'online' : 'offline' as UserStatus
      }));
      setConversations(enhanced);
      setFilteredConversations(enhanced);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation: ExtendedConversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);

    try {
      const msgs = await chatService.getMessages(conversation.userId);
      setMessages(msgs);

      // Mark messages as read
      if (conversation.unreadCount > 0) {
        await chatService.markAsRead(conversation.userId);
        setConversations(prev =>
          prev.map(c =>
            c.userId === conversation.userId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    if (selectedConversation &&
        (message.fromUserId === selectedConversation.userId ||
         message.toUserId === selectedConversation.userId)) {
      setMessages(prev => [...prev, message]);

      if (message.fromUserId === selectedConversation.userId) {
        chatService.markAsRead(selectedConversation.userId);
      }
    }

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.userId === message.fromUserId || conv.userId === message.toUserId) {
          return {
            ...conv,
            lastMessage: message.message,
            lastMessageTime: message.timestamp,
            unreadCount: selectedConversation?.userId === conv.userId
              ? 0
              : conv.unreadCount + (message.fromUserId !== user?.id ? 1 : 0)
          };
        }
        return conv;
      });

      return updated.sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
    });
  };

  const handleTypingIndicator = (data: { from: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (data.isTyping) {
        newSet.add(data.from);
      } else {
        newSet.delete(data.from);
      }
      return newSet;
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const sentMessage = await chatService.sendMessage(selectedConversation.userId, messageText);

    if (sentMessage) {
      setMessages(prev => [...prev, sentMessage]);
      setConversations(prev =>
        prev.map(conv =>
          conv.userId === selectedConversation.userId
            ? { ...conv, lastMessage: messageText, lastMessageTime: sentMessage.timestamp }
            : conv
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (selectedConversation) {
      chatService.sendTypingIndicator(selectedConversation.userId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (selectedConversation) {
          chatService.sendTypingIndicator(selectedConversation.userId, false);
        }
      }, 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await chatService.uploadFile(file);

      if (uploadResult) {
        const messageType = isImage || file.type.startsWith('image/') ? 'image' : 'file';
        const sentMessage = await chatService.sendMessage(
          selectedConversation.userId,
          file.name,
          {
            fileName: uploadResult.fileName,
            fileUrl: uploadResult.fileUrl,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            messageType
          }
        );

        if (sentMessage) {
          setMessages(prev => [...prev, sentMessage]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('შეცდომა ფაილის ატვირთვისას');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('კამერაზე წვდომა ვერ მოხერხდა');
    }
  };

  const stopLocalVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const startVideoCall = async () => {
    if (!selectedConversation) return;
    setShowVideoCall(true);
    setCallStatus('calling');
    await startLocalVideo();
    // TODO: Implement actual WebRTC peer connection
    setTimeout(() => setCallStatus('ringing'), 2000);
  };

  const endVideoCall = () => {
    stopLocalVideo();
    setShowVideoCall(false);
    setCallStatus(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const acceptIncomingCall = async () => {
    setIncomingCall(false);
    setShowVideoCall(true);
    setCallStatus('connected');
    await startLocalVideo();
  };

  const rejectIncomingCall = () => {
    setIncomingCall(false);
    setIncomingCallFrom(null);
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.userId === userId);
  };

  const getUserStatus = (conversation: ExtendedConversation): UserStatus => {
    if (isUserOnline(conversation.userIdentityId || conversation.userId)) {
      return 'online';
    }
    return 'offline';
  };

  const getStatusClass = (status: UserStatus) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'away': return 'status-away';
      case 'busy': return 'status-busy';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'online': return 'ონლაინ';
      case 'away': return 'მოშორებით';
      case 'busy': return 'დაკავებული';
      default: return 'ოფლაინ';
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'დღეს';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'გუშინ';
    } else {
      return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return 'pi-file-pdf';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'pi-file-word';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'pi-file-excel';
    if (mimeType?.includes('zip') || mimeType?.includes('archive')) return 'pi-file-archive';
    return 'pi-file';
  };

  const renderMessageStatus = (message: ChatMessage) => {
    if (message.fromUserId !== user?.id) return null;

    if (message.isRead) {
      return <DoneAllIcon className="status-read" sx={{ fontSize: 14 }} />;
    }
    return <CheckIcon className="status-sent" sx={{ fontSize: 14 }} />;
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.fromUserId === user?.id;
    const showDate = index === 0 ||
      new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString();

    return (
      <React.Fragment key={message.id}>
        {showDate && (
          <div className="date-separator">
            <span>{formatDate(message.timestamp)}</span>
          </div>
        )}
        <div className={`message ${isOwnMessage ? 'own' : 'other'}`}>
          {!isOwnMessage && (
            <div className="message-avatar">
              {message.fromUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="message-bubble">
            {!isOwnMessage && (
              <div className="message-sender">{message.fromUserName}</div>
            )}

            {/* Image Message */}
            {message.messageType === 'image' && message.fileUrl ? (
              <div className="message-image">
                <div className="image-container">
                  <img src={message.fileUrl} alt={message.fileName} />
                  <div className="image-overlay">
                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="action-btn">
                      <SearchIcon sx={{ fontSize: 16 }} />
                    </a>
                    <a href={message.fileUrl} download={message.fileName} className="action-btn">
                      <DownloadIcon sx={{ fontSize: 16 }} />
                    </a>
                  </div>
                </div>
                {message.fileName && <div className="image-caption">{message.fileName}</div>}
              </div>
            ) : message.messageType === 'file' && message.fileUrl ? (
              /* File Message */
              <a href={message.fileUrl} download={message.fileName} className="message-file">
                <div className="file-icon">
                  <InsertDriveFileIcon />
                </div>
                <div className="file-info">
                  <span className="file-name">{message.fileName}</span>
                  <span className="file-size">
                    {message.fileSize ? chatService.formatFileSize(message.fileSize) : ''}
                  </span>
                </div>
                <div className="file-action">
                  <DownloadIcon fontSize="small" />
                </div>
              </a>
            ) : message.messageType === 'call_invitation' ? (
              /* Call Invitation */
              <div className="message-call">
                <VideocamIcon className="call-icon" />
                <div className="call-info">
                  <span className="call-title">ვიდეო ზარი</span>
                  <span className="call-status">{isOwnMessage ? 'გამავალი ზარი' : 'შემომავალი ზარი'}</span>
                </div>
              </div>
            ) : (
              /* Text Message */
              <div className="message-text">{message.message}</div>
            )}

            <div className="message-info">
              <span className="message-time">{formatTime(message.timestamp)}</span>
              {renderMessageStatus(message)}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>ჩატები</h2>
          <div className="header-actions">
            <button className="icon-btn" title="ახალი ჩატი">
              <AddCommentIcon fontSize="small" />
            </button>
            <button className="icon-btn" title="ჯგუფის შექმნა">
              <GroupIcon fontSize="small" />
            </button>
            <button className="icon-btn" title="ფილტრი">
              <FilterListIcon fontSize="small" />
            </button>
            <button className="icon-btn" title="პარამეტრები">
              <MoreHorizIcon fontSize="small" />
            </button>
          </div>
        </div>

        <div className="search-box">
          <SearchIcon className="search-icon" fontSize="small" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ძებნა მესენჯერში"
          />
        </div>

        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            ყველა
          </button>
          <button
            className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            წაუკითხავი
          </button>
          <button
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            ჯგუფები
          </button>
        </div>

        <div className="conversations-list">
          {loading ? (
            <div className="loading-state">იტვირთება...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>საუბრები არ მოიძებნა</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div
                key={conversation.userId}
                className={`conversation-item ${selectedConversation?.userId === conversation.userId ? 'active' : ''}`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="avatar-container">
                  <div className="avatar">
                    {conversation.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`status-indicator ${getStatusClass(getUserStatus(conversation))}`} />
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="name">{conversation.userName}</span>
                    {conversation.lastMessageTime && (
                      <span className="time">{formatTime(conversation.lastMessageTime)}</span>
                    )}
                  </div>
                  <div className="conversation-preview">
                    <span className="last-message">
                      {conversation.lastMessage || 'დაიწყეთ საუბარი'}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="unread-badge">{conversation.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="header-info">
                <div className="avatar-container">
                  <div className="avatar">
                    {selectedConversation.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`status-indicator ${getStatusClass(getUserStatus(selectedConversation))}`} />
                </div>
                <div className="user-details">
                  <h3>{selectedConversation.userName}</h3>
                  {selectedConversation.role && (
                    <span className="user-role">{selectedConversation.role}</span>
                  )}
                  <span className={`user-status ${getStatusClass(getUserStatus(selectedConversation))}`}>
                    {typingUsers.has(selectedConversation.userId) ? (
                      <>
                        <span className="typing-indicator">წერს...</span>
                      </>
                    ) : (
                      getStatusText(getUserStatus(selectedConversation))
                    )}
                  </span>
                </div>
              </div>
              <div className="header-actions">
                <button className="action-btn" title="აუდიო ზარი">
                  <PhoneIcon fontSize="small" />
                </button>
                <button className="action-btn" title="ვიდეო ზარი" onClick={startVideoCall}>
                  <VideocamIcon fontSize="small" />
                </button>
                <button className="action-btn" title="ინფორმაცია">
                  <InfoIcon fontSize="small" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {loadingMessages ? (
                <div className="loading-state">იტვირთება...</div>
              ) : messages.length === 0 ? (
                <div className="empty-messages">
                  <div className="empty-icon">💬</div>
                  <p>მესიჯები არ არის</p>
                  <p className="hint">დაიწყეთ საუბარი შეტყობინების გაგზავნით</p>
                </div>
              ) : (
                <div className="messages-wrapper">
                  {messages.map((msg, idx) => renderMessage(msg, idx))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <div className="input-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e, false)}
                  style={{ display: 'none' }}
                  accept="*/*"
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={(e) => handleFileUpload(e, true)}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <button
                  className="input-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="ფაილის მიმაგრება"
                >
                  <AttachFileIcon fontSize="small" />
                </button>
                <button
                  className="input-btn"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  title="ფოტოს გაგზავნა"
                >
                  <ImageIcon fontSize="small" />
                </button>
                <button className="input-btn" title="ხმოვანი შეტყობინება">
                  <MicIcon fontSize="small" />
                </button>
              </div>

              <div className="message-input-wrapper">
                <textarea
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="დაწერეთ შეტყობინება..."
                  rows={1}
                  disabled={uploading}
                />
              </div>

              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!newMessage.trim() || uploading}
                title="გაგზავნა"
              >
                <SendIcon fontSize="small" />
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <div className="empty-icon">💬</div>
            <h3>აირჩიეთ საუბარი</h3>
            <p>აირჩიეთ თანამშრომელი მარცხენა სიიდან საუბრის დასაწყებად</p>
          </div>
        )}
      </div>

      {/* Video Call Window */}
      {showVideoCall && selectedConversation && (
        <div className="video-call-window">
          <div className="video-header">
            <div className="video-user-info">
              <div className="video-avatar">
                {selectedConversation.userName.charAt(0).toUpperCase()}
              </div>
              <div className="video-user-details">
                <span className="video-user-name">{selectedConversation.userName}</span>
                <span className="video-call-status">
                  {callStatus === 'calling' && 'ზარი...'}
                  {callStatus === 'ringing' && 'რეკავს...'}
                  {callStatus === 'connected' && 'დაკავშირებულია'}
                </span>
              </div>
            </div>
            <div className="video-header-controls">
              <button className="video-btn" onClick={() => setShowVideoCall(false)} title="მინიმიზაცია">
                <MinimizeIcon fontSize="small" />
              </button>
              <button className="video-btn close" onClick={endVideoCall} title="დასრულება">
                <CloseIcon fontSize="small" />
              </button>
            </div>
          </div>

          <div className="video-container">
            <div className="remote-video">
              <video ref={remoteVideoRef} autoPlay playsInline />
              <div className="video-placeholder">
                <VideocamIcon sx={{ fontSize: 48 }} />
                <p>მოლოდინში...</p>
              </div>
            </div>
            <div className="local-video">
              <video ref={localVideoRef} autoPlay playsInline muted />
              {isVideoOff && (
                <div className="video-off-overlay">
                  <VideocamOffIcon />
                </div>
              )}
            </div>
          </div>

          <div className="video-controls">
            <button
              className={`control-btn ${isMuted ? 'active' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'მიკროფონის ჩართვა' : 'მიკროფონის გამორთვა'}
            >
              {isMuted ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
            </button>
            <button
              className={`control-btn ${isVideoOff ? 'active' : ''}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'კამერის ჩართვა' : 'კამერის გამორთვა'}
            >
              {isVideoOff ? <VideocamOffIcon fontSize="small" /> : <VideocamIcon fontSize="small" />}
            </button>
            <button className="control-btn end-call" onClick={endVideoCall} title="ზარის დასრულება">
              <PhoneIcon fontSize="small" sx={{ transform: 'rotate(135deg)' }} />
            </button>
            <button className="control-btn" title="ეკრანის გაზიარება">
              <ScreenShareIcon fontSize="small" />
            </button>
            <button className="control-btn" title="პარამეტრები">
              <SettingsIcon fontSize="small" />
            </button>
          </div>
        </div>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && incomingCallFrom && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-dialog">
            <div className="call-header">
              <h3>შემომავალი ვიდეო ზარი</h3>
            </div>

            <div className="caller-info">
              <div className="caller-avatar">
                {incomingCallFrom.userName.charAt(0).toUpperCase()}
              </div>
              <div className="caller-details">
                <h2>{incomingCallFrom.userName}</h2>
                <p>გიზარებთ...</p>
              </div>
            </div>

            <div className="call-actions">
              <button className="reject-btn" onClick={rejectIncomingCall}>
                <CloseIcon />
                <span>უარყოფა</span>
              </button>
              <button className="accept-btn" onClick={acceptIncomingCall}>
                <PhoneIcon />
                <span>პასუხი</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
