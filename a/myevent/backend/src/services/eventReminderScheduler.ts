// backend/src/services/eventReminderScheduler.ts
// Scheduler for automated event reminders and feedback requests

import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { sendEventReminderEmail, sendEventCompletionReminderEmail } from './emailNotificationService';

interface ReminderState {
  sentPreReminderEmails: Set<string>; // eventIds
  sentFeedbackReminderEmails: Set<string>; // eventIds
}

const reminderState: ReminderState = {
  sentPreReminderEmails: new Set(),
  sentFeedbackReminderEmails: new Set()
};

/**
 * Start the event reminder scheduler
 * Runs every 5 minutes to check for events needing reminders
 */
export function startEventReminderScheduler() {
  // Run every 5 minutes
  const intervalId = setInterval(async () => {
    try {
      await processPreEventReminders();
      await processEventFeedbackReminders();
    } catch (error) {
      console.error('Error in event reminder scheduler:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log('Event reminder scheduler started (runs every 5 minutes)');

  return intervalId;
}

/**
 * Process pre-event reminders (24 hours before event starts)
 */
async function processPreEventReminders() {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in26Hours = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    // Find events starting in the next 24-26 hours that haven't been reminded yet
    const upcomingEvents = await Event.find({
      date: {
        $gte: in24Hours,
        $lte: in26Hours
      },
      archived: { $ne: true }
    });

    for (const event of upcomingEvents) {
      const eventId = event._id.toString();

      // Skip if we've already sent reminder for this event
      if (reminderState.sentPreReminderEmails.has(eventId)) {
        continue;
      }

      try {
        // Send reminder to all registered participants
        const registrations = await Registration.find({
          eventId,
          status: 'registered'
        }).populate('userId', 'email firstName');

        if (registrations.length > 0) {
          for (const registration of registrations) {
            try {
              await sendEventReminderEmail(eventId);
            } catch (error) {
              console.error(`Failed to send pre-event reminder for event ${eventId}, registration ${registration._id}:`, error);
            }
          }

          // Mark as sent
          reminderState.sentPreReminderEmails.add(eventId);
          console.log(`Pre-event reminders sent for event: ${event.title}`);
        }
      } catch (error) {
        console.error(`Error processing pre-event reminders for event ${eventId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in processPreEventReminders:', error);
  }
}

/**
 * Process event completion feedback reminders (24 hours after event ends)
 */
async function processEventFeedbackReminders() {
  try {
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past26Hours = new Date(now.getTime() - 26 * 60 * 60 * 1000);

    // Find events that ended in the past 24-26 hours
    const recentlyEndedEvents = await Event.find({
      endDate: {
        $gte: past26Hours,
        $lte: past24Hours
      },
      archived: { $ne: true }
    });

    for (const event of recentlyEndedEvents) {
      const eventId = event._id.toString();

      // Skip if we've already sent feedback reminder for this event
      if (reminderState.sentFeedbackReminderEmails.has(eventId)) {
        continue;
      }

      try {
        // Send feedback reminder to all participants
        const registrations = await Registration.find({
          eventId,
          status: 'registered'
        }).populate('userId', 'email firstName');

        if (registrations.length > 0) {
          for (const registration of registrations) {
            try {
              await sendEventCompletionReminderEmail(eventId);
            } catch (error) {
              console.error(`Failed to send feedback reminder for event ${eventId}, registration ${registration._id}:`, error);
            }
          }

          // Mark as sent
          reminderState.sentFeedbackReminderEmails.add(eventId);
          console.log(`Feedback reminders sent for event: ${event.title}`);
        }
      } catch (error) {
        console.error(`Error processing feedback reminders for event ${eventId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in processEventFeedbackReminders:', error);
  }
}

/**
 * Reset reminder state (useful for testing or manual resets)
 */
export function resetReminderState() {
  reminderState.sentPreReminderEmails.clear();
  reminderState.sentFeedbackReminderEmails.clear();
  console.log('Reminder state reset');
}

/**
 * Get current reminder state
 */
export function getReminderState() {
  return {
    sentPreReminders: Array.from(reminderState.sentPreReminderEmails),
    sentFeedbackReminders: Array.from(reminderState.sentFeedbackReminderEmails)
  };
}

/**
 * Stop the scheduler (for testing/shutdown)
 */
export function stopEventReminderScheduler(intervalId: NodeJS.Timeout) {
  clearInterval(intervalId);
  console.log('Event reminder scheduler stopped');
}
