/**
 * Web Notifications service for Time Warp Focus Companion.
 * Safe for SSR/non-browser environments and gracefully handles permission states.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function sendFocusNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    return new Notification(title, {
      icon: '/hourglass.svg',
      badge: '/hourglass.svg',
      silent: false,
      ...options
    });
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
    return null;
  }
}
