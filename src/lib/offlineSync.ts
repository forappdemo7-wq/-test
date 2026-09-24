import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeGetJSON, safeSetJSON, safeRemove } from '../constants/storage';

export interface QueuedAction {
  id: string;
  type: 'like_post' | 'save_post' | 'comment_post' | 'follow_user';
  payload: Record<string, any>;
  timestamp: number;
}

const QUEUE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;

export const getOfflineQueue = (): QueuedAction[] => {
  return safeGetJSON<QueuedAction[]>(QUEUE_KEY, []);
};

export const enqueueOfflineAction = (action: Omit<QueuedAction, 'id' | 'timestamp'>): void => {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  safeSetJSON(QUEUE_KEY, queue);
};

export const clearOfflineQueue = (): void => {
  safeRemove(QUEUE_KEY);
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
    } catch {
      // Keep in remaining queue if failed
      remaining.push(item);
    }
  }

  safeSetJSON(QUEUE_KEY, remaining);
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
