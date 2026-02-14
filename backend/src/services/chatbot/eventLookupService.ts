/**
  Handles dynamic queries about events from the database
 */

import { Event } from '../../models/Event';
import { Registration } from '../../models/Registration';
import { formatDate } from '../../utils/dateFormatter';

export class EventLookupService {
  /**
   Check if message contains event-related queries
   */
  public hasEventQuery(message: string): boolean {
    const eventKeywords = [
      'when is',
      'when are',
      'what time',
      'how many',
      'registered',
      'participants',
      'upcoming',
      'today',
      'tomorrow',
      'this week',
      'next week',
      'location',
      'where is',
      'event details',
      'what event',
    ];

    const lowerMessage = message.toLowerCase();
    return eventKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
    Extract event name or query from message
   */
  private extractEventQuery(message: string): {
    type: 'name' | 'category' | 'date' | 'generic';
    value: string;
  } {
    const lowerMessage = message.toLowerCase();

    // "When is Basketball tournament?"
    if (lowerMessage.includes('when is') || lowerMessage.includes('when are')) {
      const eventName = message
        .replace(/when is|when are/gi, '')
        .replace(/\?/g, '')
        .trim();
      return { type: 'name', value: eventName };
    }

    // "How many registered for [Event]?"
    if (lowerMessage.includes('how many')) {
      const eventName = message
        .replace(/how many.*for/gi, '')
        .replace(/\?/g, '')
        .trim();
      return { type: 'name', value: eventName };
    }

    // "Upcoming Sports events"
    if (lowerMessage.includes('upcoming')) {
      const category = message
        .replace(/upcoming/gi, '')
        .replace(/events/gi, '')
        .trim();
      return { type: 'category', value: category };
    }

    // "Sports events today/tomorrow"
    if (lowerMessage.includes('today') || lowerMessage.includes('tomorrow')) {
      const isToday = lowerMessage.includes('today');
      return { type: 'date', value: isToday ? 'today' : 'tomorrow' };
    }

    return { type: 'generic', value: '' };
  }

  /**
   * Get response for event-related query
   */
  public async getEventResponse(message: string): Promise<string | null> {
    try {
      const query = this.extractEventQuery(message);

      if (query.type === 'name' && query.value) {
        return await this.getEventByName(query.value);
      }

      if (query.type === 'category' && query.value) {
        return await this.getEventsByCategory(query.value);
      }

      if (query.type === 'date') {
        return await this.getEventsByDate(query.value);
      }

      return null;
    } catch (error) {
      console.error('Event lookup error:', error);
      return null;
    }
  }

  /**
   * Find event by name
   */
  private async getEventByName(eventName: string): Promise<string | null> {
    try {
      const event = await Event.findOne({
        title: { $regex: eventName, $options: 'i' },
        archived: { $ne: true }
      });

      if (!event) {
        return `I couldn't find an event matching "${eventName}". Please try searching with a different name or check the events list.`;
      }

      const registrationCount = await Registration.countDocuments({
        eventId: String(event._id),
        status: 'registered'
      });

      const formattedDate = formatDate(event.date);
      const response = `📅 **${event.title}**\n\n` +
        `**Date & Time:** ${formattedDate} at ${event.time}\n` +
        `**Location:** ${event.location || 'TBA'}\n` +
        `**Category:** ${event.category || 'General'}\n` +
        `**Registered Participants:** ${registrationCount}/${event.capacity || 'Unlimited'}\n` +
        `**Status:** ${event.status || 'Scheduled'}\n\n` +
        `${event.description || 'No description available'}\n\n` +
        `Click on the event to register or learn more!`;

      return response;
    } catch (error) {
      console.error('Error fetching event by name:', error);
      return null;
    }
  }

  /**
   * Find events by category
   */
  private async getEventsByCategory(category: string): Promise<string | null> {
    try {
      const events = await Event.find({
        category: { $regex: category, $options: 'i' },
        archived: { $ne: true },
        date: { $gte: new Date() }
      })
        .limit(5)
        .sort({ date: 1 });

      if (events.length === 0) {
        return `No upcoming events found in the "${category}" category. Check back later for new events!`;
      }

      let response = `🎯 **Upcoming ${category} Events:**\n\n`;

      for (const event of events) {
        const formattedDate = formatDate(event.date);
        const regCount = await Registration.countDocuments({
          eventId: String(event._id),
          status: 'registered'
        });

        response += `📌 **${event.title}**\n` +
          `   📅 ${formattedDate} at ${event.time}\n` +
          `   📍 ${event.location || 'TBA'}\n` +
          `   👥 ${regCount} registered\n\n`;
      }

      return response + `Browse more events on the Events page!`;
    } catch (error) {
      console.error('Error fetching events by category:', error);
      return null;
    }
  }

  /**
   * Find events by date
   */
  private async getEventsByDate(dateType: string): Promise<string | null> {
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      let dateLabel: string;

      if (dateType === 'today') {
        dateLabel = 'Today';
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else {
        dateLabel = 'Tomorrow';
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      }

      const events = await Event.find({
        date: { $gte: startDate, $lt: endDate },
        archived: { $ne: true }
      }).sort({ time: 1 });

      if (events.length === 0) {
        return `No events scheduled for ${dateLabel.toLowerCase()}. Check upcoming days!`;
      }

      let response = `📅 **Events ${dateLabel}:**\n\n`;

      for (const event of events) {
        response += `🎯 **${event.title}**\n` +
          `   ⏰ ${event.time}\n` +
          `   📍 ${event.location || 'TBA'}\n` +
          `   🏷️ ${event.category || 'General'}\n\n`;
      }

      return response + `Register now before spots fill up!`;
    } catch (error) {
      console.error('Error fetching events by date:', error);
      return null;
    }
  }
}

// Export singleton instance
export const eventLookupService = new EventLookupService();
