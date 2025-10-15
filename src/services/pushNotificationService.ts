// Push Notification Service for PWA
class PushNotificationService {
  private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0FyHnQ3UzHfe3E3X5gQ7MvL8iJ8qK1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6'; // Replace with your VAPID key
  private isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.log('This browser does not support push notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
    });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push unsubscription successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }

  async sendSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: userId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  }

  // Show local notification (for testing)
  showLocalNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });
    }
  }

  // Check if PWA is installed
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Check if app is running in standalone mode
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  // Get device type
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return /iPad|Android(?=.*Tablet)/i.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  // Check if notifications are supported
  getSupportStatus() {
    return {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      isSupported: this.isSupported,
      isPWA: this.isPWAInstalled(),
      isStandalone: this.isStandalone(),
      deviceType: this.getDeviceType()
    };
  }

  // Enhanced notification with native-like features
  showEnhancedNotification(title: string, options: NotificationOptions & {
    actions?: Array<{ action: string; title: string; icon?: string }>;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
  } = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        ...options
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
