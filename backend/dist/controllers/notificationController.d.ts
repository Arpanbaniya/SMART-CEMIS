declare global {
    var broadcastToUser: (userId: string, data: any) => void;
    var broadcastToAllUsers: (data: any) => void;
    var broadcastToAdmins: (data: any) => void;
    var NotificationPriority: {
        LOW: 'low';
        MEDIUM: 'medium';
        HIGH: 'high';
    };
}
export declare enum NotificationType {
    USER_SPECIFIC = "user_specific",
    GLOBAL = "global",
    PRIVATE = "private"
}
export declare enum NotificationCategory {
    EVENT_CREATED = "event_created",
    EVENT_UPDATED = "event_updated",
    EVENT_DELETED = "event_deleted",
    EVENT_REGISTERED = "event_registered",
    FAVORITE_ADDED = "favorite_added",
    FAVORITE_REMOVED = "favorite_removed",
    PROFILE_UPDATED = "profile_updated",
    ADMIN_REQUEST_CREATED = "admin_request_created",
    ADMIN_REQUEST_APPROVED = "admin_request_approved",
    ADMIN_REQUEST_REJECTED = "admin_request_rejected"
}
export declare enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export interface NotificationData {
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    data?: any;
    userId?: string;
    excludeUserId?: string;
    priority?: NotificationPriority;
}
type BaseNotificationData = Omit<NotificationData, 'userId' | 'excludeUserId' | 'type'>;
export declare const createNotification: (notification: Omit<NotificationData, "id">) => Promise<Omit<NotificationData, "id">>;
export declare const sendUserNotification: (userId: string, notification: BaseNotificationData) => void;
export declare const sendGlobalNotification: (notification: BaseNotificationData & {
    excludeUserId?: string;
}) => void;
export declare const sendAdminNotification: (notification: BaseNotificationData) => void;
export declare const sendPrivateNotification: (userId: string, notification: BaseNotificationData) => void;
export declare const notifyEventCreated: (creatorId: string, eventData: any) => void;
export declare const notifyEventUpdated: (creatorId: string, eventData: any, updatedBy?: string) => void;
export declare const notifyEventDeleted: (creatorId: string, eventData: any, deletedBy?: string) => void;
export declare const notifyEventRegistered: (userId: string, eventData: any) => void;
export declare const notifyFavoriteAdded: (userId: string, eventData: any) => void;
export declare const notifyFavoriteRemoved: (userId: string, eventData: any) => void;
export {};
