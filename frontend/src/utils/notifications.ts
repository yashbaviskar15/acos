/**
 * Native Browser System Desktop Notifications Helper
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      sendSystemNotification(
        'Aravanta CloudOS Notifications Enabled',
        'You will now receive native desktop notifications for system alerts, VM state changes, and payment receipts.'
      );
      return true;
    }
  }

  return false;
};

export const sendSystemNotification = (title: string, body: string, icon: string = '/logo.png') => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: false
      });
    } catch (e) {
      console.warn("Notification error:", e);
    }
  }
};
