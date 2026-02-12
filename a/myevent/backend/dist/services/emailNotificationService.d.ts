interface EmailUser {
    email: string;
    firstName?: string;
    lastName?: string;
}
export declare function sendEventUpdateNotification(eventId: string, changes: Record<string, {
    old: any;
    new: any;
}>): Promise<void>;
export declare function sendEventCancellationNotification(eventId: string): Promise<void>;
export declare function sendRegistrationConfirmationEmail(userId: string, eventId: string, isPaid?: boolean): Promise<void>;
export declare function sendWinnerCertificateEmail(winnerId: string, eventId: string, teamId?: string): Promise<void>;
export declare function sendFinalRoundNotificationEmail(teamId: string, eventId: string): Promise<void>;
export declare function sendEventCompletionReminderEmail(eventId: string): Promise<void>;
export declare function sendEventReminderEmail(eventId: string): Promise<void>;
export declare function sendNoticeEmailToAllUsers(noticeTitle: string, noticeContent: string, users: EmailUser[]): Promise<{
    sentCount: number;
    failedCount: number;
}>;
export {};
