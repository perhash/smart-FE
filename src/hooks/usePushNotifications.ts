import { useState, useEffect } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Check if already subscribed
    if (isSupported && permission === 'granted') {
      checkSubscriptionStatus();
    }
  }, [isSupported, permission]);

  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await pushNotificationService.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    try {
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        toast.success('Notification permission granted');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      toast.error('Push notifications are not available');
      return false;
    }

    setIsLoading(true);
    try {
      const subscription = await pushNotificationService.subscribeToPush();
      
      if (subscription) {
        const currentUser = apiService.getCurrentUser();
        if (currentUser) {
          const success = await pushNotificationService.sendSubscriptionToServer(
            subscription, 
            currentUser.id
          );
          
          if (success) {
            setIsSubscribed(true);
            toast.success('Successfully subscribed to push notifications');
            return true;
          } else {
            toast.error('Failed to register subscription with server');
            return false;
          }
        } else {
          toast.error('User not authenticated');
          return false;
        }
      } else {
        toast.error('Failed to subscribe to push notifications');
        return false;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to subscribe to push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribeFromPush();
      
      if (success) {
        setIsSubscribed(false);
        toast.success('Successfully unsubscribed from push notifications');
        return true;
      } else {
        toast.error('Failed to unsubscribe from push notifications');
        return false;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to unsubscribe from push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const showTestNotification = () => {
    pushNotificationService.showLocalNotification('Test Notification', {
      body: 'This is a test notification from Smart Supply',
      tag: 'test-notification'
    });
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showTestNotification
  };
};
