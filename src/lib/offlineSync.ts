import { useState, useEffect } from 'react';

export interface QueuedAction {
  id: string;
  type: 'like_post' | 'save_post' | 'comment_post' | 'follow_user';
  payload: Record<string, any>;
  timestamp: number;
}

const QUEUE_KEY = 'instavibe_offline_actions_queue';

export const getOfflineQueue = (): QueuedAction[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

export const enqueueOfflineAction = (action: Omit<QueuedAction, 'id' | 'timestamp'>): void => {
  try {
    const queue = getOfflineQueue();
    const newAction: QueuedAction = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
    };
    queue.push(newAction);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to enqueue offline action:', e);
  }
};

export const clearOfflineQueue = (): void => {
  localStorage.removeItem(QUEUE_KEY);
};

export const flushOfflineQueue = async (
  onActionSynced?: (action: QueuedAction) => void
): Promise<number> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let syncedCount = 0;
  const remaining: QueuedAction[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'like_post') {
        await fetch(`/api/posts/${item.payload.postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: item.payload.userId }),
        });
      } else if (item.type === 'save_post') {
        await fetch(`/api/posts/${item.payload.postId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: item.payload.userId }),
        });
      } else if (item.type === 'comment_post') {
        await fetch(`/api/posts/${item.payload.postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: item.payload.userId, text: item.payload.text }),
        });
      } else if (item.type === 'follow_user') {
        await fetch(`/api/users/${item.payload.targetUserId}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUserId: item.payload.currentUserId }),
        });
      }
      syncedCount++;
      if (onActionSynced) onActionSynced(item);
    } catch (err) {
      // Keep in remaining queue if failed
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return syncedCount;
};

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
};
