import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    let socketInstance = null;
    
    // Only connect if user is authenticated
    if (user) {
      try {
        // Connect to the same URL as the API
        const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        socketInstance = io(socketUrl, {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          withCredentials: true,
          transports: ['websocket', 'polling']
        });
        
        socketInstance.on('connect', () => {
          console.log('Socket connected');
          setConnected(true);
        });
        
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setConnected(false);
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setConnected(false);
        });
        
        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
        });
        
        setSocket(socketInstance);
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [user]);

  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};