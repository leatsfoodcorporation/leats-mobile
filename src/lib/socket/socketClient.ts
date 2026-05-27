import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Mobile Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Mobile Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Mobile Socket connection error:', error.message);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinOrderRoom = (orderId: string): void => {
  if (socket) {
    socket.emit('order:join', { orderId });
  }
};

export const leaveOrderRoom = (orderId: string): void => {
  if (socket) {
    socket.emit('order:leave', { orderId });
  }
};

export const subscribeToCustomerEvents = (
  userId: string,
  callbacks: {
    onOrderUpdate?: (data: any) => void;
    onDeliveryUpdate?: (data: any) => void;
    onPartnerLocation?: (data: any) => void;
  }
): (() => void) => {
  if (!socket) {
    initializeSocket();
  }

  const cleanupFunctions: (() => void)[] = [];

  if (socket) {
    joinOrderRoom(userId);

    if (callbacks.onOrderUpdate) {
      socket.on(`customer:${userId}`, callbacks.onOrderUpdate);
      cleanupFunctions.push(() => socket?.off(`customer:${userId}`, callbacks.onOrderUpdate));
    }

    if (callbacks.onDeliveryUpdate) {
      socket.on('delivery:update', callbacks.onDeliveryUpdate);
      cleanupFunctions.push(() => socket?.off('delivery:update', callbacks.onDeliveryUpdate));
    }

    if (callbacks.onPartnerLocation) {
      socket.on('partner:location', callbacks.onPartnerLocation);
      cleanupFunctions.push(() => socket?.off('partner:location', callbacks.onPartnerLocation));
    }
  }

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};

export const subscribeToOrderTracking = (
  orderId: string,
  callbacks: {
    onDeliveryUpdate?: (data: any) => void;
    onPartnerLocation?: (data: any) => void;
  }
): (() => void) => {
  if (!socket) {
    initializeSocket();
  }

  const cleanupFunctions: (() => void)[] = [];

  if (socket) {
    joinOrderRoom(orderId);

    if (callbacks.onDeliveryUpdate) {
      socket.on('delivery:update', callbacks.onDeliveryUpdate);
      cleanupFunctions.push(() => socket?.off('delivery:update', callbacks.onDeliveryUpdate));
    }

    if (callbacks.onPartnerLocation) {
      socket.on('partner:location', callbacks.onPartnerLocation);
      cleanupFunctions.push(() => socket?.off('partner:location', callbacks.onPartnerLocation));
    }
  }

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    leaveOrderRoom(orderId);
  };
};

export const subscribeToEvent = (event: string, callback: (data: any) => void): void => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const unsubscribeFromEvent = (event: string, callback?: (data: any) => void): void => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};
