/**
 * Event Status Utility
 * Computes event status based on timestamps
 */
export type EventStatus = 'draft' | 'upcoming' | 'live' | 'completed' | 'archived' | 'cancelled';
export interface EventDates {
    date: Date;
    time?: string;
    endDate: Date;
    endTime?: string;
    archivedAt?: Date | null;
    isCancelled?: boolean;
}
/**
 * Compute event status based on current time and event dates
 * Status hierarchy:
 * 1. cancelled (if isCancelled = true)
 * 2. archived (if archivedAt is set and in past)
 * 3. completed (if endDate+endTime has passed but not archived)
 * 4. live (if date+time has passed and endDate+endTime hasn't passed)
 * 5. upcoming (if date has not started)
 * 6. draft (default)
 */
export declare function computeEventStatus(eventDates: EventDates): EventStatus;
/**
 * Check if an event is archived
 */
export declare function isEventArchived(archivedAt?: Date | null): boolean;
/**
 * Check if an event can be edited
 * (Cannot edit archived or completed events)
 */
export declare function canEditEvent(eventStatus: EventStatus): boolean;
/**
 * Check if an event should be archived
 * (Should archive 5 days after completion)
 */
export declare function shouldArchiveEvent(endDate: Date, endTime?: string, archivedAt?: Date | null): boolean;
