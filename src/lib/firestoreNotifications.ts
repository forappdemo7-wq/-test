import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification, User } from '../types';

/**
 * Real-time listener for user's notifications in Firestore
 */
export function listenToUserNotifications(
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void
): () => void {
  if (!userId || userId === 'guest_user') {
    return () => {};
  }

  try {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let timeAgo = 'Just now';
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
            if (diffSecs < 60) timeAgo = 'Just now';
            else if (diffSecs < 3600) timeAgo = `${Math.floor(diffSecs / 60)}m`;
            else if (diffSecs < 86400) timeAgo = `${Math.floor(diffSecs / 3600)}h`;
            else if (diffSecs < 604800) timeAgo = `${Math.floor(diffSecs / 86400)}d`;
            else timeAgo = `${Math.floor(diffSecs / 604800)}w`;
          }

          notifs.push({
            id: docSnap.id,
            type: data.type || 'like',
            user: data.user,
            actors: data.actors || (data.user ? [data.user] : []),
            totalActorsCount: data.totalActorsCount || (data.actors ? data.actors.length : 1),
            isGrouped: !!data.isGrouped,
            actionGroupKey: data.actionGroupKey,
            targetPostId: data.targetPostId,
            targetMediaUrl: data.targetMediaUrl,
            targetMediaType: data.targetMediaType || 'image',
            text: data.text || '',
            commentText: data.commentText,
            timestamp: data.timestamp || timeAgo,
            rawTimestamp: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.rawTimestamp,
            isRead: !!data.isRead,
            isLikedBack: !!data.isLikedBack,
            repliedText: data.repliedText,
            priority: data.priority || 'normal',
          });
        });

        onUpdate(notifs);
      },
      (error) => {
        console.warn('Error listening to user notifications:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to setup notifications listener:', error);
    return () => {};
  }
}

/**
 * Mark a single notification as read or unread in Firestore
 */
export async function setNotificationReadInFirestore(
  userId: string,
  notificationId: string,
  isRead: boolean
): Promise<void> {
  if (!userId || !notificationId || userId === 'guest_user') return;
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await setDoc(
      notifRef,
      {
        isRead,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error updating notification read state in Firestore:', err);
  }
}

/**
 * Mark all notifications as read in Firestore
 */
export async function markAllNotificationsReadInFirestore(userId: string): Promise<void> {
  if (!userId || userId === 'guest_user') return;
  try {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notifsRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (err) {
    console.warn('Error marking all notifications read in Firestore:', err);
  }
}

/**
 * Delete a notification from Firestore
 */
export async function deleteNotificationFromFirestore(
  userId: string,
  notificationId: string
): Promise<void> {
  if (!userId || !notificationId || userId === 'guest_user') return;
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (err) {
    console.warn('Error deleting notification from Firestore:', err);
  }
}

/**
 * Send a new notification to a recipient user in Firestore
 */
export async function sendNotificationToFirestore(
  recipientId: string,
  notification: Omit<AppNotification, 'id'>
): Promise<string | null> {
  if (!recipientId || recipientId === 'guest_user') return null;
  try {
    const notifsRef = collection(db, 'users', recipientId, 'notifications');
    const docRef = await addDoc(notifsRef, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('Error sending notification to Firestore:', err);
    return null;
  }
}
