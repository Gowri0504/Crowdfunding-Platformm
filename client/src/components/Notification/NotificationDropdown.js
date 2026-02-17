import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import NotificationItem from './NotificationItem';
import axios from 'axios';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  /* ===============================
     Close dropdown when clicking outside
  =============================== */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* ===============================
     Fetch notifications when opened
  =============================== */
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  /* ===============================
     Fetch unread count initially
  =============================== */
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  /* ===============================
     Fetch Notifications
  =============================== */
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/notifications?limit=10');

      const notifications =
        response?.data?.data?.notifications ||
        response?.data?.notifications ||
        [];

      setNotifications(notifications);

      // Mark as seen
      await axios.put('/api/notifications/mark-seen');

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Fetch Unread Count (FIXED)
  =============================== */
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications?read=false&limit=1');

      const total =
        response?.data?.data?.pagination?.total ||
        response?.data?.pagination?.total ||
        0;

      setUnreadCount(total);

    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  /* ===============================
     Mark One As Read
  =============================== */
  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);

      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /* ===============================
     Mark All As Read
  =============================== */
  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');

      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date(),
        }))
      );

      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg"
      >
        <FaBell className="text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden"
          >
            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  <FaCheck className="inline mr-1" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    compact
                  />
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
