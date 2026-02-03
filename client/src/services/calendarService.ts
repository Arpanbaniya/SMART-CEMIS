import type { Event } from "@/lib/types";

export class CalendarService {
  private static readonly DEFAULT_TIMEZONE = 'Asia/Kathmandu';
  private static readonly DEFAULT_DURATION_MINUTES = 120; // 2 hours

  /**
   * Generates a Google Calendar "Add Event" URL with proper encoding
   */
  static generateGoogleCalendarUrl(event: Event): string {
    try {
      // Validate required fields
      if (!event.title || !event.date) {
        console.warn('CalendarService: Missing required event data');
        return '';
      }

      const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
      
      // Format: YYYYMMDDTHHmmSSZ
      const dateStr = event.date.replace(/-/g, '');
      const timeParts = event.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      
      let hours = 10;
      let minutes = 0;
      
      if (timeParts) {
        hours = parseInt(timeParts[1]);
        minutes = parseInt(timeParts[2]);
        if (timeParts[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (timeParts[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      const startDateTime = `${dateStr}T${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00Z`;
      const endDateTime = `${dateStr}T${(hours + 2).toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00Z`;

      // Simple parameters - pass event data as-is
      const params = new URLSearchParams({
        text: event.title,
        dates: `${startDateTime}/${endDateTime}`,
        details: event.description || '',
        location: event.location || '',
        sf: 'true',
        output: 'xml'
      });

      return `${baseUrl}&${params.toString()}`;
    } catch (error) {
      console.error('CalendarService: Error generating calendar URL:', error);
      return '';
    }
  }

  /**
   * Validate calendar URL before use
   */
  static validateCalendarUrl(url: string): boolean {
    return Boolean(url && 
           url.startsWith('https://www.google.com/calendar/render') && 
           url.includes('action=TEMPLATE') &&
           url.includes('text=') &&
           url.includes('dates='));
  }
}
