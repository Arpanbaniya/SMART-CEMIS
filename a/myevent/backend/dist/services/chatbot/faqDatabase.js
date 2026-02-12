"use strict";
// backend/src/services/chatbot/faqDatabase.ts
/**
 * FAQ Database Service
 * Contains all prewritten responses for common questions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.faqDatabase = exports.FAQDatabase = void 0;
class FAQDatabase {
    constructor() {
        this.faqs = [
            {
                keywords: ['register', 'how to register', 'sign up', 'join'],
                response: 'To register for an event, follow these steps:\n1. Browse events on the home page\n2. Click on the event you are interested in\n3. Click the Register button on the event detail page\n4. Fill in your details if required\n5. If it is a paid event, complete the payment process\nYou will receive a confirmation with your registration number!',
                category: 'registration'
            },
            {
                keywords: ['payment', 'pay', 'cost', 'price'],
                response: 'Currently, we accept payments only through eSewa. To pay for a paid event:\n1. During registration, click the Pay Now button\n2. Select eSewa as payment method\n3. Complete the transaction securely\n4. You will receive a confirmation email with your invoice\neSewa is a trusted and secure payment gateway used widely in Nepal.',
                category: 'payment'
            },
            {
                keywords: ['cancel', 'unregister', 'withdraw', 'registration'],
                response: 'To cancel your registration:\n1. Go to your Profile page\n2. Find the event under My Registrations\n3. Click on the event\n4. Select Cancel Registration\nNote: Cancellations must be made before the event starts. Refund policies vary by event - check the event details for specific information.',
                category: 'registration'
            },
            {
                keywords: ['refund', 'money back', 'reimbursement'],
                response: 'Refund policies depend on the event:\n- Most events: Full refund if cancelled 24 hours before event start\n- Some events: Non-refundable (mentioned in event details)\n- Special events: Custom cancellation policies\nRefunds are typically processed within 5-7 business days. Check your event details for specific refund information.',
                category: 'payment'
            },
            {
                keywords: ['certificate', 'certification', 'download', 'completion'],
                response: 'Certificates are automatically generated after event completion:\n1. Go to your Profile page\n2. Click on Past Events section\n3. Select the completed event\n4. Download your certificate as PDF\nCertificates typically appear within 24 hours after the event ends. You can download them anytime for your records.',
                category: 'certificates'
            },
            {
                keywords: ['event types', 'categories', 'sports', 'tech', 'cultural'],
                response: 'We host various event categories:\n- Sports: Tournaments, leagues, friendly matches\n- Technology: Hackathons, workshops, coding competitions\n- Cultural: Concerts, art exhibitions, talent shows\n- Academic: Seminars, lectures, study sessions\n- Social: Networking events, meetups, celebrations\n- Intramural: Indoor games, outdoor activities\nBrowse our event list to discover more!',
                category: 'events'
            },
            {
                keywords: ['how to find', 'search', 'discover', 'looking for'],
                response: 'Find events easily:\n1. Use the Search bar at the top\n2. Filter by Category (Sports, Tech, Cultural, etc.)\n3. Filter by Date to see upcoming events\n4. Check Favorites to see bookmarked events\n5. Visit specific Event pages for details\nYou can also sort by most popular or most recent events!',
                category: 'events'
            },
            {
                keywords: ['help', 'support', 'contact', 'assistant'],
                response: 'I can help you with:\n- Event registration and cancellations\n- Payment questions and refund policies\n- Finding specific events\n- Understanding certificates\n- Event details and schedules\n- General EventHub questions\nFor urgent issues, contact support@eventhub.edu or check the Help section!',
                category: 'support'
            },
            {
                keywords: ['contact', 'reach', 'email', 'phone', 'call'],
                response: 'Contact our support team:\nEmail: support@eventhub.edu\nResponse time: Within 24 hours\nLocation: College Main Campus\nYou can also submit feedback directly through the EventHub app. We value your suggestions!',
                category: 'support'
            },
            {
                keywords: ['team', 'group', 'members', 'teammates'],
                response: 'For team events:\n1. Click Register as Team on the event page\n2. Create a new team or join existing one\n3. Add team members (they must accept invitations)\n4. Once all members confirmed, team registration is complete\nTeam members can communicate through the team chat feature in the app.',
                category: 'events'
            },
            {
                keywords: ['tournament', 'bracket', 'rounds', 'finals'],
                response: 'Tournament structure:\n1. Registration closes on event date\n2. Participants/teams are placed in brackets\n3. Matches proceed through multiple rounds\n4. Winners advance to next round\n5. Final round determines the champion\nYou can track tournament progress in real-time through the event page!',
                category: 'events'
            },
            {
                keywords: ['feedback', 'survey', 'rating', 'review'],
                response: 'Share your event experience:\n1. After event completion, you will receive a feedback form\n2. Rate the event (1-5 stars)\n3. Leave comments and suggestions\n4. Your feedback helps organizers improve future events\nYour honest feedback is valuable and helps us maintain event quality!',
                category: 'events'
            },
            {
                keywords: ['admin', 'organizer', 'create event', 'host'],
                response: 'To become an event organizer:\n1. Go to Profile menu and select Become Organizer\n2. Fill in your details and qualifications\n3. Submit for admin approval\n4. Once approved, you can create and manage events\nContact support@eventhub.edu for more information!',
                category: 'admin'
            },
            {
                keywords: ['notice', 'announcement', 'message', 'important'],
                response: 'Check important notices:\n1. Click the bell icon in the header\n2. View all system announcements\n3. Important notices are pinned at the top\n4. Turn on notifications for urgent updates\nNotices contain important information about system updates, event changes, and announcements.',
                category: 'system'
            },
            {
                keywords: ['hi', 'hello', 'hey', 'greetings', 'good morning'],
                response: 'Hello! Welcome to EventHub! I am your virtual assistant. I can help you with:\n- Event registration and management\n- Payment and refund questions\n- Finding events that match your interests\n- Certificate downloads\n- General support\nWhat would you like to know?',
                category: 'greeting'
            },
            {
                keywords: ['thank', 'thanks', 'thank you', 'appreciate'],
                response: 'You are welcome! I am always happy to help. If you have any other questions or need further assistance, feel free to ask. Enjoy your EventHub experience!',
                category: 'greeting'
            }
        ];
    }
    findResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        for (const faq of this.faqs) {
            for (const keyword of faq.keywords) {
                if (lowerMessage.includes(keyword.toLowerCase())) {
                    return { response: faq.response, category: faq.category };
                }
            }
        }
        return null;
    }
    getAllKeywords() {
        return this.faqs.flatMap((faq) => faq.keywords);
    }
    getByCategory(category) {
        return this.faqs.filter((faq) => faq.category === category);
    }
}
exports.FAQDatabase = FAQDatabase;
exports.faqDatabase = new FAQDatabase();
//# sourceMappingURL=faqDatabase.js.map