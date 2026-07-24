import { db } from '../config/firebase';
import { Notification } from '../types';
import { generateId, toTimestamp } from '../utils/helpers';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'general'
): Promise<Notification> {
  const notification: Notification = {
    id: generateId(),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: toTimestamp(),
  };

  await db
    .ref(`notifications/${userId}/${notification.id}`)
    .set(notification);

  return notification;
}

export async function getNotifications(
  userId: string
): Promise<Notification[]> {
  const snapshot = await db
    .ref(`notifications/${userId}`)
    .orderByChild('createdAt')
    .limitToLast(50)
    .once('value');
  const data = snapshot.val();
  if (!data) return [];

  const notifications = Object.values(data as Record<string, Notification>);
  return notifications.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .ref(`notifications/${userId}/${notificationId}/read`)
    .set(true);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const snapshot = await db
    .ref(`notifications/${userId}`)
    .once('value');
  const data = snapshot.val();
  if (!data) return;

  const updates: Record<string, boolean> = {};
  for (const id of Object.keys(data)) {
    updates[`${id}/read`] = true;
  }

  await db.ref(`notifications/${userId}`).update(updates);
}

export async function sendPushNotification(
  userId: string,
  data: { title: string; body: string }
): Promise<void> {
  try {
    const userSnapshot = await db.ref(`users/${userId}/fcmToken`).once('value');
    const fcmToken = userSnapshot.val();
    if (!fcmToken) return;

    const { getMessaging } = await import('firebase-admin/messaging');
    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: data.title,
        body: data.body,
      },
    });
  } catch {
    console.warn(`Failed to send push notification to user ${userId}`);
  }
}
