import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// --- Fix: CSS styles are now embedded directly within the component ---
// This avoids the need for a separate CSS file and resolves the import error.
const NotificationStyles = () => (
  <style>{`
    .notification-container {
      position: relative;
      display: flex;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .notification-bell-button {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1.6rem;
      color: #333;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }
    .notification-bell-button:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .notification-badge {
      position: absolute;
      top: 2px;
      right: 0px;
      background-color: #e53e3e;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 0.75rem;
      font-weight: bold;
      border: 2px solid white;
      line-height: 1;
    }
    .notification-panel {
      position: absolute;
      top: 130%;
      right: 0;
      width: 360px;
      max-height: 450px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f9fafb;
    }
    .notification-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1a202c;
    }
    .notification-header .notification-actions button {
      background: none;
      border: none;
      color: #4a5568;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      margin-left: 12px;
      transition: color 0.2s;
    }
    .notification-header .notification-actions button:hover {
      color: #2b6cb0;
    }
    .notification-list {
      overflow-y: auto;
      flex-grow: 1;
    }
    .notification-list::-webkit-scrollbar {
      width: 5px;
    }
    .notification-list::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 10px;
    }
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #edf2f7;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .notification-item:hover {
      background-color: #f7fafc;
    }
    .notification-item.read {
      opacity: 0.7;
    }
    .notification-item.unread {
      background-color: #ebf8ff;
    }
    .notification-icon {
      font-size: 1.2rem;
      margin-right: 12px;
      margin-top: 2px;
    }
    .notification-content {
      flex-grow: 1;
    }
    .notification-content strong {
      font-size: 0.9rem;
      font-weight: 600;
      color: #2d3748;
      display: block;
    }
    .notification-content p {
      font-size: 0.85rem;
      color: #4a5568;
      margin: 4px 0 0;
      line-height: 1.4;
    }
    .notification-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-left: 12px;
      flex-shrink: 0;
    }
    .notification-meta .timestamp {
      font-size: 0.75rem;
      color: #a0aec0;
      white-space: nowrap;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      background-color: #3182ce;
      border-radius: 50%;
      margin-top: 8px;
    }
    .notification-empty {
      padding: 40px 20px;
      text-align: center;
      color: #718096;
    }
  `}</style>
);


// This component assumes you have a way to get the current user's ID.
// For example, from a context, Redux store, or props.
const NotificationHandler = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  // --- 1. Establish WebSocket Connection ---
  useEffect(() => {
    // Connect to your backend server.
    // Ensure the URL matches your server's address.
    const socket = io('http://localhost:5000');

    // If a user is logged in, join a private room for that user.
    if (userId) {
      socket.emit('joinRoom', userId);
      console.log(`Socket joining room for user: ${userId}`);
    }

    // --- 2. Listen for Incoming Notifications ---
    // This is the core listener for real-time updates from the server.
    socket.on('notification', (data) => {
      console.log('Received notification:', data);
      const newNotification = {
        ...data,
        id: Date.now() + Math.random(), // Unique ID for the key prop
        isRead: false,
        timestamp: new Date(),
      };
      // Add the new notification to the top of the list
      setNotifications(prev => [newNotification, ...prev]);
    });

    // --- 3. Clean up on Component Unmount ---
    return () => {
      if (userId) {
        socket.emit('leaveRoom', userId);
      }
      socket.disconnect();
      console.log('Socket disconnected.');
    };
  }, [userId]); // Re-run effect if the userId changes (e.g., on login/logout)

  // --- Helper Functions for UI Interaction ---

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatRelativeTime = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  }, [notifications]);

  const handleClearAll = () => {
    setNotifications([]);
  };

  // This is a simple toggle. You might want to add logic to close the panel
  // when clicking outside of it in a real application.
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <>
      <NotificationStyles />
      <div className="notification-container">
        <button className="notification-bell-button" onClick={togglePanel} aria-label="Toggle notifications">
          <span>🔔</span>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>

        {showPanel && (
          <div className="notification-panel">
            <div className="notification-header">
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                 <div className="notification-actions">
                  <button onClick={handleMarkAllAsRead}>Mark all as read</button>
                  <button onClick={handleClearAll}>Clear</button>
                </div>
              )}
            </div>
            <div className="notification-list">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <div className="notification-icon">
                      {n.title.toLowerCase().includes('confirmed') ? '✅' : 
                       n.title.toLowerCase().includes('completed') ? '🏁' : 
                       n.title.toLowerCase().includes('cancelled') ? '❌' : 
                       'ℹ️'}
                    </div>
                    <div className="notification-content">
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                    </div>
                    <div className="notification-meta">
                      <span className="timestamp">{formatRelativeTime(n.timestamp)}</span>
                      {!n.isRead && <div className="unread-dot"></div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="notification-empty">
                  <p>You have no new notifications.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationHandler;

