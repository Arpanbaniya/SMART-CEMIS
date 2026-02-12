/**
 * Start the event reminder scheduler
 * Runs every 5 minutes to check for events needing reminders
 */
export declare function startEventReminderScheduler(): NodeJS.Timeout;
/**
 * Reset reminder state (useful for testing or manual resets)
 */
export declare function resetReminderState(): void;
/**
 * Get current reminder state
 */
export declare function getReminderState(): {
    sentPreReminders: string[];
    sentFeedbackReminders: string[];
};
/**
 * Stop the scheduler (for testing/shutdown)
 */
export declare function stopEventReminderScheduler(intervalId: NodeJS.Timeout): void;
