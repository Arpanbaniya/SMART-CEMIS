/**
 * Event Status Utility
 * Computes event status based on timestamps
 */

export type EventStatus = 'draft' | 'upcoming' | 'live' | 'completed' | 'archived' | 'cancelled';

export interface EventDates {
  date: Date; // Start date
  time?: string; // Start time (HH:mm format)
  endDate: Date; // End date
  endTime?: string; // End time (HH:mm format)
  archivedAt?: Date | null; // Archive timestamp
  isCancelled?: boolean; // Is cancelled
}

/**
 * Helper function to construct datetime from date and time
 */
function constructDateTime(date: Date, time?: string): Date {
  const dateObj = new Date(date);
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
  } else {
    dateObj.setHours(0, 0, 0, 0);
  }
  return dateObj;
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
export function computeEventStatus(eventDates: EventDates): EventStatus {
  const now = new Date();
  const { date, time, endDate, endTime, archivedAt, isCancelled } = eventDates;

  // 1. Check if cancelled
  if (isCancelled) {
    return 'cancelled';
  }

  // 2. Check if archived
  if (archivedAt && new Date(archivedAt) <= now) {
    return 'archived';
  }

  // Construct start and end datetimes
  const startDateTime = constructDateTime(date, time);
  const endDateTime = constructDateTime(endDate, endTime);

  // 3. Check if completed (endDateTime has passed)
  if (endDateTime <= now) {
    return 'completed';
  }

  // 4. Check if live (event has started but not ended)
  if (startDateTime <= now && endDateTime > now) {
    return 'live';
  }

  // 5. Check if upcoming (event hasn't started)
  if (startDateTime > now) {
    return 'upcoming';
  }

  // 6. Default to draft
  return 'draft';
}

/**
 * Check if an event is archived
 */
export function isEventArchived(archivedAt?: Date | null): boolean {
  if (!archivedAt) return false;
  return new Date(archivedAt) <= new Date();
}

/**
 * Check if an event can be edited
 * (Cannot edit archived or completed events)
 */
export function canEditEvent(eventStatus: EventStatus): boolean {
  return !['archived', 'completed', 'cancelled'].includes(eventStatus);
}

/**
 * Check if an event should be archived
 * (Should archive 5 days after completion)
 */
export function shouldArchiveEvent(endDate: Date, endTime?: string, archivedAt?: Date | null): boolean {
  if (archivedAt) return false; // Already archived
  
  const now = new Date();
  const completedAt = constructDateTime(endDate, endTime);
  const archiveThreshold = new Date(completedAt.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
  
  return now >= archiveThreshold;
}
