import { API_BASE } from './config.js';

const VAPID_PUBLIC_KEY = 'BJMC5ROZad0v9NEFAdIrRP7G3bitXKBrMFN9kI-9RJFqfNUOmKWf6QXv5VYzMWRCCcBPVVbAL4nu0bIfg9HJY5c';

export async function getSubscription() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }
  return null;
}

export async function subscribeToPush() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission denied');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Send subscription to Story API Dicoding push endpoint
    const token = localStorage.getItem('token');
    if (token) {
      const subscriptionJson = subscription.toJSON();
      const pushPayload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJson?.keys?.p256dh || '',
          auth: subscriptionJson?.keys?.auth || '',
        },
      };

      await fetch(`${API_BASE}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pushPayload)
      });
    }
    return subscription;
  }
  return null;
}

export async function unsubscribeFromPush() {
  const subscription = await getSubscription();
  if (subscription) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE}/notifications/subscribe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      } catch (e) {
        console.warn('Push unsubscribe to server failed:', e);
      }
    }
    await subscription.unsubscribe();
    return true;
  }
  return false;
}

export async function togglePushNotification(enable) {
  if (enable) {
    return await subscribeToPush();
  } else {
    return await unsubscribeFromPush();
  }
}

// Initialize subscription state from service worker
export async function checkPushSubscriptionStatus() {
  const sub = await getSubscription();
  return !!sub;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

