// backend/src/utils/logger.ts
import { AdminLog } from '../models/AdminLog';

export interface LogData {
  userId: string;
  action: 'create' | 'update' | 'delete' | 'revoke' | 'approve' | 'reject';
  entityType: 'event' | 'admin_request' | 'user_role';
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an admin log entry
 * This function is used to log all admin actions for audit purposes
 */
export async function createAdminLog(logData: LogData): Promise<void> {
  try {
    const log = new AdminLog(logData);
    await log.save();
    console.log(`📝 Admin log created: ${logData.action} ${logData.entityType} by user ${logData.userId}`);

    if (typeof global.broadcastAdminUpdate !== 'undefined') {
      global.broadcastAdminUpdate({
        type: 'adminLogCreated',
        log: log.toJSON()
      });
    }
  } catch (error) {
    console.error('Failed to create admin log:', error);
    // Don't throw error - logging failures shouldn't break the main functionality
  }
}

/**
 * Helper function to extract request metadata
 */
export function extractRequestMetadata(req: any): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
    userAgent: req.headers['user-agent']
  };
}

/**
 * Log event creation
 */
export async function logEventCreation(userId: string, eventId: string, eventTitle: string, metadata?: any): Promise<void> {
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
export async function logEventUpdate(userId: string, eventId: string, eventTitle: string, changes: string[], metadata?: any): Promise<void> {
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
export async function logEventDeletion(userId: string, eventId: string, eventTitle: string, metadata?: any): Promise<void> {
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
export async function logAdminRequestApproval(userId: string, requestId: string, requestEmail: string, metadata?: any): Promise<void> {
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
export async function logAdminRequestRejection(userId: string, requestId: string, requestEmail: string, reason: string, metadata?: any): Promise<void> {
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
export async function logUserRoleChange(userId: string, targetUserId: string, oldRole: string, newRole: string, metadata?: any): Promise<void> {
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
export async function logPrivilegeRevocation(userId: string, targetUserId: string, reason: string, metadata?: any): Promise<void> {
  await createAdminLog({
    userId,
    action: 'revoke',
    entityType: 'user_role',
    entityId: targetUserId,
    details: `Revoked student admin privileges. Reason: ${reason}`,
    ...metadata
  });
}
