/**
 * Event Lookup Service
 * Handles dynamic queries about events from the database
 */
export declare class EventLookupService {
    /**
     * Check if message contains event-related queries
     */
    hasEventQuery(message: string): boolean;
    /**
     * Extract event name or query from message
     */
    private extractEventQuery;
    /**
     * Get response for event-related query
     */
    getEventResponse(message: string): Promise<string | null>;
    /**
     * Find event by name
     */
    private getEventByName;
    /**
     * Find events by category
     */
    private getEventsByCategory;
    /**
     * Find events by date
     */
    private getEventsByDate;
}
export declare const eventLookupService: EventLookupService;
