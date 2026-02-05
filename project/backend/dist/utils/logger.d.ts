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
export declare function createAdminLog(logData: LogData): Promise<void>;
/**
 * Helper function to extract request metadata
 */
export declare function extractRequestMetadata(req: any): {
    ipAddress?: string;
    userAgent?: string;
};
/**
 * Log event creation
 */
export declare function logEventCreation(userId: string, eventId: string, eventTitle: string, metadata?: any): Promise<void>;
/**
 * Log event update
 */
export declare function logEventUpdate(userId: string, eventId: string, eventTitle: string, changes: string[], metadata?: any): Promise<void>;
/**
 * Log event deletion
 */
export declare function logEventDeletion(userId: string, eventId: string, eventTitle: string, metadata?: any): Promise<void>;
/**
 * Log admin request approval
 */
export declare function logAdminRequestApproval(userId: string, requestId: string, requestEmail: string, metadata?: any): Promise<void>;
/**
 * Log admin request rejection
 */
export declare function logAdminRequestRejection(userId: string, requestId: string, requestEmail: string, reason: string, metadata?: any): Promise<void>;
/**
 * Log user role changes
 */
export declare function logUserRoleChange(userId: string, targetUserId: string, oldRole: string, newRole: string, metadata?: any): Promise<void>;
/**
 * Log student admin privilege revocation
 */
export declare function logPrivilegeRevocation(userId: string, targetUserId: string, reason: string, metadata?: any): Promise<void>;
