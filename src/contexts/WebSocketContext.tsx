import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiService } from '@/services/api';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (userId: string, role: string) => void;
  emitOrderStatusUpdate: (orderId: string, status: string, riderId?: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('🔌 Connecting to WebSocket:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Add debugging for all events
    newSocket.onAny((eventName, ...args) => {
      console.log('🔔 WebSocket event received:', eventName, args);
      
      // Emit custom events for notification button
      if (eventName === 'new-notification') {
        const notification = args[0];
        window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (userId: string, role: string) => {
    if (socket) {
      console.log(`🚀 Joining WebSocket room: ${role}-${userId}`);
      socket.emit('join-room', { userId, role });
    } else {
      console.log('❌ Cannot join room - socket not available');
    }
  };

  const emitOrderStatusUpdate = (orderId: string, status: string, riderId?: string) => {
    if (socket) {
      socket.emit('order-status-update', { orderId, status, riderId });
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    joinRoom,
    emitOrderStatusUpdate,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
