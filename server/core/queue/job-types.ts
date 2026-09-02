export enum JobType {
  DISPATCH_NOTIFICATION = 'DISPATCH_NOTIFICATION',
  PROCESS_MEDIA = 'PROCESS_MEDIA',
  SEND_EMAIL_VERIFICATION = 'SEND_EMAIL_VERIFICATION',
  RECORD_METRIC = 'RECORD_METRIC',
  PRE_GENERATE_AI_CACHE = 'PRE_GENERATE_AI_CACHE',
}

export interface JobPayloadMap {
  [JobType.DISPATCH_NOTIFICATION]: {
    recipientId: string;
    senderId: string;
    type: 'like' | 'comment' | 'follow' | 'story_like' | 'mention' | 'tag';
    targetMediaUrl?: string;
    postId?: string;
    text: string;
  };
  [JobType.PROCESS_MEDIA]: {
    postId?: string;
    reelId?: string;
    storyId?: string;
    mediaUrl: string;
    targetFormat?: string;
  };
  [JobType.SEND_EMAIL_VERIFICATION]: {
    email: string;
    token: string;
    userId: string;
  };
  [JobType.RECORD_METRIC]: {
    event: string;
    userId?: string;
    metadata?: Record<string, any>;
  };
  [JobType.PRE_GENERATE_AI_CACHE]: {
    userId: string;
    interests: string[];
  };
}

export interface Job<T extends JobType = JobType> {
  id: string;
  type: T;
  payload: JobPayloadMap[T];
  attempts: number;
  maxRetries: number;
  priority: number; // Higher number = higher priority
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
}
