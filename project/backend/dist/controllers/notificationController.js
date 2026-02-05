"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyFavoriteRemoved = exports.notifyFavoriteAdded = exports.notifyEventRegistered = exports.notifyEventDeleted = exports.notifyEventUpdated = exports.notifyEventCreated = exports.sendPrivateNotification = exports.sendAdminNotification = exports.sendGlobalNotification = exports.sendUserNotification = exports.createNotification = exports.NotificationPriority = exports.NotificationCategory = exports.NotificationType = void 0;
// Notification types
var NotificationType;
(function (NotificationType) {
    NotificationType["USER_SPECIFIC"] = "user_specific";
    NotificationType["GLOBAL"] = "global";
    NotificationType["PRIVATE"] = "private";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationCategory;
(function (NotificationCategory) {
    NotificationCategory["EVENT_CREATED"] = "event_created";
    NotificationCategory["EVENT_UPDATED"] = "event_updated";
    NotificationCategory["EVENT_DELETED"] = "event_deleted";
    NotificationCategory["EVENT_REGISTERED"] = "event_registered";
    NotificationCategory["FAVORITE_ADDED"] = "favorite_added";
    NotificationCategory["FAVORITE_REMOVED"] = "favorite_removed";
    NotificationCategory["PROFILE_UPDATED"] = "profile_updated";
    NotificationCategory["ADMIN_REQUEST_CREATED"] = "admin_request_created";
    NotificationCategory["ADMIN_REQUEST_APPROVED"] = "admin_request_approved";
    NotificationCategory["ADMIN_REQUEST_REJECTED"] = "admin_request_rejected";
})(NotificationCategory || (exports.NotificationCategory = NotificationCategory = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["MEDIUM"] = "medium";
    NotificationPriority["HIGH"] = "high";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
// Store notifications in database (for persistence)
const createNotification = async (notification) => {
    try {
        // This would integrate with a Notification model in a real implementation
        console.log('📔 Notification created:', notification);
        return notification;
    }
    catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
};
exports.createNotification = createNotification;
// Broadcast user-specific notification (only to specific user)
const sendUserNotification = (userId, notification) => {
    const notificationData = {
        ...notification,
        type: NotificationType.USER_SPECIFIC,
        userId
    };
    console.log(`👤 Sending user-specific notification to ${userId}:`, notificationData);
    if (typeof broadcastToUser !== 'undefined') {
        broadcastToUser(userId, notificationData);
    }
    else {
        console.error('❌ broadcastToUser function not available');
    }
};
exports.sendUserNotification = sendUserNotification;
// Broadcast global notification (to all users except excluded)
const sendGlobalNotification = (notification) => {
    const notificationData = {
        ...notification,
        type: NotificationType.GLOBAL,
        excludeUserId: notification.excludeUserId
    };
    console.log(`🌍 Sending global notification (excluding ${notification.excludeUserId || 'none'}):`, notificationData);
    console.log('🔍 Available broadcast functions:', {
        broadcastToAllUsers: typeof broadcastToAllUsers !== 'undefined',
        broadcastToAdmins: typeof broadcastToAdmins !== 'undefined'
    });
    if (typeof broadcastToAllUsers !== 'undefined') {
        broadcastToAllUsers(notificationData);
    }
    else {
        console.error('❌ broadcastToAllUsers function not available');
    }
};
exports.sendGlobalNotification = sendGlobalNotification;
// Broadcast admin-only notification (to all admins)
const sendAdminNotification = (notification) => {
    const notificationData = {
        ...notification,
        type: NotificationType.GLOBAL, // Admin notifications are global to admins
    };
    console.log(`👑 Sending admin notification:`, notificationData);
    if (typeof broadcastToAdmins !== 'undefined') {
        broadcastToAdmins(notificationData);
    }
};
exports.sendAdminNotification = sendAdminNotification;
// Send private notification (only to the user who performed the action)
const sendPrivateNotification = (userId, notification) => {
    const notificationData = {
        ...notification,
        type: NotificationType.PRIVATE,
        userId
    };
    console.log(`🔒 Sending private notification to ${userId}:`, notificationData);
    if (typeof broadcastToUser !== 'undefined') {
        broadcastToUser(userId, notificationData);
    }
};
exports.sendPrivateNotification = sendPrivateNotification;
// Helper functions for common notification types
const notifyEventCreated = (creatorId, eventData) => {
    console.log('🎯 notifyEventCreated called with:', { creatorId, eventData: eventData.title });
    // Send private confirmation to creator
    (0, exports.sendPrivateNotification)(creatorId, {
        category: NotificationCategory.EVENT_CREATED,
        title: 'Event Created Successfully',
        message: `Your event "${eventData.title}" has been created successfully.`,
        data: eventData,
        priority: NotificationPriority.MEDIUM
    });
    // Send global notification to all other users
    console.log('📢 About to send global notification for event creation');
    (0, exports.sendGlobalNotification)({
        category: NotificationCategory.EVENT_CREATED,
        title: 'New Event Created',
        message: `A new event "${eventData.title}" has been created.`,
        data: { ...eventData, creatorId },
        excludeUserId: creatorId,
        priority: NotificationPriority.MEDIUM
    });
    console.log('✅ notifyEventCreated completed');
};
exports.notifyEventCreated = notifyEventCreated;
const notifyEventUpdated = (creatorId, eventData, updatedBy) => {
    const userId = updatedBy || creatorId;
    // Send private confirmation to updater
    (0, exports.sendPrivateNotification)(userId, {
        category: NotificationCategory.EVENT_UPDATED,
        title: 'Event Updated Successfully',
        message: `Your event "${eventData.title}" has been updated successfully.`,
        data: eventData,
        priority: NotificationPriority.MEDIUM
    });
    // Send global notification to all other users (for any admin update, including self-updates)
    (0, exports.sendGlobalNotification)({
        category: NotificationCategory.EVENT_UPDATED,
        title: 'Event Updated',
        message: `Event "${eventData.title}" has been updated by ${updatedBy === creatorId ? 'the event creator' : 'an admin'}.`,
        data: { ...eventData, updatedBy },
        excludeUserId: userId,
        priority: NotificationPriority.MEDIUM
    });
};
exports.notifyEventUpdated = notifyEventUpdated;
const notifyEventDeleted = (creatorId, eventData, deletedBy) => {
    const userId = deletedBy || creatorId;
    // Send private confirmation to deleter
    (0, exports.sendPrivateNotification)(userId, {
        category: NotificationCategory.EVENT_DELETED,
        title: 'Event Deleted Successfully',
        message: `Your event "${eventData.title}" has been deleted successfully.`,
        data: eventData,
        priority: NotificationPriority.HIGH
    });
    // Send global notification to all other users (if admin deletion)
    if (deletedBy && deletedBy !== creatorId) {
        (0, exports.sendGlobalNotification)({
            category: NotificationCategory.EVENT_DELETED,
            title: 'Event Deleted',
            message: `Event "${eventData.title}" has been deleted by admin.`,
            data: { ...eventData, deletedBy },
            excludeUserId: deletedBy,
            priority: NotificationPriority.HIGH
        });
    }
};
exports.notifyEventDeleted = notifyEventDeleted;
const notifyEventRegistered = (userId, eventData) => {
    // Private notification only to the registering user
    (0, exports.sendPrivateNotification)(userId, {
        category: NotificationCategory.EVENT_REGISTERED,
        title: 'Event Registration Successful',
        message: `You have successfully registered for "${eventData.title}".`,
        data: eventData,
        priority: NotificationPriority.MEDIUM
    });
};
exports.notifyEventRegistered = notifyEventRegistered;
const notifyFavoriteAdded = (userId, eventData) => {
    // Private notification only to the user who added to favorites
    (0, exports.sendPrivateNotification)(userId, {
        category: NotificationCategory.FAVORITE_ADDED,
        title: 'Event Added to Favorites',
        message: `You have added "${eventData.title}" to your favorites.`,
        data: eventData,
        priority: NotificationPriority.LOW
    });
};
exports.notifyFavoriteAdded = notifyFavoriteAdded;
const notifyFavoriteRemoved = (userId, eventData) => {
    // Private notification only to the user who removed from favorites
    (0, exports.sendPrivateNotification)(userId, {
        category: NotificationCategory.FAVORITE_REMOVED,
        title: 'Event Removed from Favorites',
        message: `You have removed "${eventData.title}" from your favorites.`,
        data: eventData,
        priority: NotificationPriority.LOW
    });
};
exports.notifyFavoriteRemoved = notifyFavoriteRemoved;
//# sourceMappingURL=notificationController.js.map