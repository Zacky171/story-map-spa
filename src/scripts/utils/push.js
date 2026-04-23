import { API_BASE } from '../config.js';

// Correct VAPID public key from Story API Dicoding
const VAPID_PUBLIC_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

let isSubscribed = false;

export function isPushSubscribed() {
  return isSubscribed;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function togglePushSubscription(swRegistration) {
  if (isSubscribed) {
    await unsubscribePush(swRegistration);
    isSubscribed = false;
    return 'unsubscribed';
  }

  await subscribePush(swRegistration);
  isSubscribed = true;
  return 'subscribed';
}

export async function subscribePush(swRegistration) {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const subscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey,
  });

  // Send subscription to Story API Dicoding push endpoint
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No auth token found');
  }

  const subscriptionJson = subscription.toJSON();
  const pushPayload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscriptionJson?.keys?.p256dh || '',
      auth: subscriptionJson?.keys?.auth || '',
    },
  };

  const response = await fetch(`${API_BASE}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pushPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Push subscription failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(result.message || 'Push subscription failed');
  }

  isSubscribed = true;
  return subscription;
}

export async function unsubscribePush(swRegistration) {
  const subscription = await swRegistration.pushManager.getSubscription();
  if (!subscription) {
    isSubscribed = false;
    return;
  }

  await subscription.unsubscribe();

  // Send unsubscribe to Story API Dicoding
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch(`${API_BASE}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch (e) {
      console.warn('Push unsubscribe failed (server may not support DELETE):', e);
    }
  }

  isSubscribed = false;
}

export async function checkPushSubscriptionStatus(swRegistration) {
  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.warn('Check subscription error:', error);
    return false;
  }
}
