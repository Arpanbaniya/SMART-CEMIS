
import { Request, Response } from 'express';

declare global {
  var broadcastToUser: (userId: string, data: any) => void;
  var broadcastToAllUsers: (data: any) => void;
  var broadcastToAdmins: (data: any) => void;
  var NotificationPriority: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };
}

export enum NotificationType {
  USER_SPECIFIC = 'user_specific',
  GLOBAL = 'global',
  PRIVATE = 'private'
}

export enum NotificationCategory {
  EVENT_CREATED = 'event_created',
  EVENT_UPDATED = 'event_updated',
  EVENT_DELETED = 'event_deleted',
  EVENT_REGISTERED = 'event_registered',
  FAVORITE_ADDED = 'favorite_added',
  FAVORITE_REMOVED = 'favorite_removed',
  PROFILE_UPDATED = 'profile_updated',
  ADMIN_REQUEST_CREATED = 'admin_request_created',
  ADMIN_REQUEST_APPROVED = 'admin_request_approved',
  ADMIN_REQUEST_REJECTED = 'admin_request_rejected'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface NotificationData {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: any;
  userId?: string; // Target user ID for user-specific notifications
  excludeUserId?: string; // Exclude this user from global notifications
  priority?: NotificationPriority;
}

type BaseNotificationData = Omit<NotificationData, 'userId' | 'excludeUserId' | 'type'>;

export const createNotification = async (notification: Omit<NotificationData, 'id'>) => {
  try {
    console.log('Notification:', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const sendUserNotification = (userId: string, notification: BaseNotificationData) => {
  const notificationData: NotificationData = {
    ...notification,
    type: NotificationType.USER_SPECIFIC,
    userId
  };
  
  console.log(`User notification to ${userId}:`, notificationData);
  
  if (typeof broadcastToUser !== 'undefined') {
    broadcastToUser(userId, notificationData);
  } else {
    console.error('broadcastToUser not available');
  }
};

export const sendGlobalNotification = (notification: BaseNotificationData & { excludeUserId?: string }) => {
  const notificationData: NotificationData = {
    ...notification,
    type: NotificationType.GLOBAL,
    excludeUserId: notification.excludeUserId
  };
  
  console.log(`Global notification (excluding ${notification.excludeUserId || 'none'}):`, notificationData);
  
  if (typeof broadcastToAllUsers !== 'undefined') {
    broadcastToAllUsers(notificationData);
  } else {
    console.error('broadcastToAllUsers not available');
  }
};

export const sendAdminNotification = (notification: BaseNotificationData) => {
  const notificationData: NotificationData = {
    ...notification,
    type: NotificationType.GLOBAL,
  };
  
  console.log('Admin notification:', notificationData);
  
  if (typeof broadcastToAdmins !== 'undefined') {
    broadcastToAdmins(notificationData);
  }
};

export const sendPrivateNotification = (userId: string, notification: BaseNotificationData) => {
  const notificationData: NotificationData = {
    ...notification,
    type: NotificationType.PRIVATE,
    userId
  };
  
  console.log(`Private notification to ${userId}:`, notificationData);
  
  if (typeof broadcastToUser !== 'undefined') {
    broadcastToUser(userId, notificationData);
  }
};

export const notifyEventCreated = (creatorId: string, eventData: any) => {
  sendPrivateNotification(creatorId, {
    category: NotificationCategory.EVENT_CREATED,
    title: 'Event Created Successfully',
    message: `Your event "${eventData.title}" has been created successfully.`,
    data: eventData,
    priority: NotificationPriority.MEDIUM
  });
  
  sendGlobalNotification({
    category: NotificationCategory.EVENT_CREATED,
    title: 'New Event Created',
    message: `A new event "${eventData.title}" has been created.`,
    data: { ...eventData, creatorId },
    excludeUserId: creatorId,
    priority: NotificationPriority.MEDIUM
  });
};

export const notifyEventUpdated = (creatorId: string, eventData: any, updatedBy?: string) => {
  const userId = updatedBy || creatorId;
  
  // Send private confirmation to updater
  sendPrivateNotification(userId, {
    category: NotificationCategory.EVENT_UPDATED,
    title: 'Event Updated Successfully',
    message: `Your event "${eventData.title}" has been updated successfully.`,
    data: eventData,
    priority: NotificationPriority.MEDIUM
  });
  
  // Send global notification to all other users (for any admin update, including self-updates)
  sendGlobalNotification({
    category: NotificationCategory.EVENT_UPDATED,
    title: 'Event Updated',
    message: `Event "${eventData.title}" has been updated by ${updatedBy === creatorId ? 'the event creator' : 'an admin'}.`,
    data: { ...eventData, updatedBy },
    excludeUserId: userId,
    priority: NotificationPriority.MEDIUM
  });
};

export const notifyEventDeleted = (creatorId: string, eventData: any, deletedBy?: string) => {
  const userId = deletedBy || creatorId;
  
  // Send private confirmation to deleter
  sendPrivateNotification(userId, {
    category: NotificationCategory.EVENT_DELETED,
    title: 'Event Deleted Successfully',
    message: `Your event "${eventData.title}" has been deleted successfully.`,
    data: eventData,
    priority: NotificationPriority.HIGH
  });
  
  // Send global notification to all other users (if admin deletion)
  if (deletedBy && deletedBy !== creatorId) {
    sendGlobalNotification({
      category: NotificationCategory.EVENT_DELETED,
      title: 'Event Deleted',
      message: `Event "${eventData.title}" has been deleted by admin.`,
      data: { ...eventData, deletedBy },
      excludeUserId: deletedBy,
      priority: NotificationPriority.HIGH
    });
  }
};

export const notifyEventRegistered = (userId: string, eventData: any) => {
  // Private notification only to the registering user
  sendPrivateNotification(userId, {
    category: NotificationCategory.EVENT_REGISTERED,
    title: 'Event Registration Successful',
    message: `You have successfully registered for "${eventData.title}".`,
    data: eventData,
    priority: NotificationPriority.MEDIUM
  });
};

export const notifyFavoriteAdded = (userId: string, eventData: any) => {
  // Private notification only to the user who added to favorites
  sendPrivateNotification(userId, {
    category: NotificationCategory.FAVORITE_ADDED,
    title: 'Event Added to Favorites',
    message: `You have added "${eventData.title}" to your favorites.`,
    data: eventData,
    priority: NotificationPriority.LOW
  });
};

export const notifyFavoriteRemoved = (userId: string, eventData: any) => {
  // Private notification only to the user who removed from favorites
  sendPrivateNotification(userId, {
    category: NotificationCategory.FAVORITE_REMOVED,
    title: 'Event Removed from Favorites',
    message: `You have removed "${eventData.title}" from your favorites.`,
    data: eventData,
    priority: NotificationPriority.LOW
  });
};

