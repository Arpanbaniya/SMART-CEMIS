"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminLog = createAdminLog;
exports.extractRequestMetadata = extractRequestMetadata;
exports.logEventCreation = logEventCreation;
exports.logEventUpdate = logEventUpdate;
exports.logEventDeletion = logEventDeletion;
exports.logAdminRequestApproval = logAdminRequestApproval;
exports.logAdminRequestRejection = logAdminRequestRejection;
exports.logUserRoleChange = logUserRoleChange;
exports.logPrivilegeRevocation = logPrivilegeRevocation;
// backend/src/utils/logger.ts
const AdminLog_1 = require("../models/AdminLog");
/**
 * Create an admin log entry
 * This function is used to log all admin actions for audit purposes
 */
async function createAdminLog(logData) {
    try {
        const log = new AdminLog_1.AdminLog(logData);
        await log.save();
        console.log(`📝 Admin log created: ${logData.action} ${logData.entityType} by user ${logData.userId}`);
        if (typeof global.broadcastAdminUpdate !== 'undefined') {
            global.broadcastAdminUpdate({
                type: 'adminLogCreated',
                log: log.toJSON()
            });
        }
    }
    catch (error) {
        console.error('Failed to create admin log:', error);
        // Don't throw error - logging failures shouldn't break the main functionality
    }
}
/**
 * Helper function to extract request metadata
 */
function extractRequestMetadata(req) {
    return {
        ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
        userAgent: req.headers['user-agent']
    };
}
/**
 * Log event creation
 */
async function logEventCreation(userId, eventId, eventTitle, metadata) {
    await createAdminLog({
        userId,
        action: 'create',
        entityType: 'event',
        entityId: eventId,
        details: `Created event: ${eventTitle}`,
        ...metadata
    });
}
/**
 * Log event update
 */
async function logEventUpdate(userId, eventId, eventTitle, changes, metadata) {
    await createAdminLog({
        userId,
        action: 'update',
        entityType: 'event',
        entityId: eventId,
        details: `Updated event: ${eventTitle}. Changes: ${changes.join(', ')}`,
        ...metadata
    });
}
/**
 * Log event deletion
 */
async function logEventDeletion(userId, eventId, eventTitle, metadata) {
    await createAdminLog({
        userId,
        action: 'delete',
        entityType: 'event',
        entityId: eventId,
        details: `Deleted event: ${eventTitle}`,
        ...metadata
    });
}
/**
 * Log admin request approval
 */
async function logAdminRequestApproval(userId, requestId, requestEmail, metadata) {
    await createAdminLog({
        userId,
        action: 'approve',
        entityType: 'admin_request',
        entityId: requestId,
        details: `Approved admin request for: ${requestEmail}`,
        ...metadata
    });
}
/**
 * Log admin request rejection
 */
async function logAdminRequestRejection(userId, requestId, requestEmail, reason, metadata) {
    await createAdminLog({
        userId,
        action: 'reject',
        entityType: 'admin_request',
        entityId: requestId,
        details: `Rejected admin request for: ${requestEmail}. Reason: ${reason}`,
        ...metadata
    });
}
/**
 * Log user role changes
 */
async function logUserRoleChange(userId, targetUserId, oldRole, newRole, metadata) {
    await createAdminLog({
        userId,
        action: 'update',
        entityType: 'user_role',
        entityId: targetUserId,
        details: `Changed user role from ${oldRole} to ${newRole}`,
        ...metadata
    });
}
/**
 * Log student admin privilege revocation
 */
async function logPrivilegeRevocation(userId, targetUserId, reason, metadata) {
    await createAdminLog({
        userId,
        action: 'revoke',
        entityType: 'user_role',
        entityId: targetUserId,
        details: `Revoked student admin privileges. Reason: ${reason}`,
        ...metadata
    });
}
//# sourceMappingURL=logger.js.map