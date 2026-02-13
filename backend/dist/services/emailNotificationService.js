"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEventUpdateNotification = sendEventUpdateNotification;
exports.sendEventCancellationNotification = sendEventCancellationNotification;
exports.sendRegistrationConfirmationEmail = sendRegistrationConfirmationEmail;
exports.sendWinnerCertificateEmail = sendWinnerCertificateEmail;
exports.sendFinalRoundNotificationEmail = sendFinalRoundNotificationEmail;
exports.sendEventCompletionReminderEmail = sendEventCompletionReminderEmail;
exports.sendEventReminderEmail = sendEventReminderEmail;
exports.sendNoticeEmailToAllUsers = sendNoticeEmailToAllUsers;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const User_1 = require("../models/User");
const Event_1 = require("../models/Event");
const Registration_1 = require("../models/Registration");
const Team_1 = require("../models/Team");
const dateFormatter_1 = require("../utils/dateFormatter");
if (process.env.SENDGRID_API_KEY) {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@eventmanagement.edu';
/**
 * Helper to get user emails from registration or team list
 */
async function getUserEmailsFromRegistrations(registrationIds) {
    const registrations = await Registration_1.Registration.find({ _id: { $in: registrationIds } });
    const emails = [];
    for (const reg of registrations) {
        const user = await User_1.User.findById(reg.userId);
        if (user && user.email) {
            emails.push({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            });
        }
    }
    return emails;
}
// ============ EVENT UPDATE NOTIFICATION ============
async function sendEventUpdateNotification(eventId, changes) {
    try {
        const event = await Event_1.Event.findById(eventId);
        if (!event)
            return;
        // Get all registered users
        const registrations = await Registration_1.Registration.find({ eventId, status: 'registered' });
        if (registrations.length === 0)
            return;
        const emails = await getUserEmailsFromRegistrations(registrations.map(r => r._id.toString()));
        if (emails.length === 0)
            return;
        // Build change summary
        const changeList = Object.entries(changes)
            .map(([field, change]) => {
            const fieldLabels = {
                'title': 'Event Name',
                'date': 'Date',
                'time': 'Time',
                'endDate': 'End Date',
                'endTime': 'End Time',
                'location': 'Location',
                'capacity': 'Capacity',
                'price': 'Price',
                'description': 'Description'
            };
            return `<li><strong>${fieldLabels[field] || field}:</strong> ${change.old} → ${change.new}</li>`;
        })
            .join('');
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .event-name { color: #667eea; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .changes-box { background: #fff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .changes-box ul { margin: 0; padding-left: 20px; }
            .changes-box li { margin: 10px 0; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .cta-button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Event Updated</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>The event you're registered for has been modified. Please review the changes below to plan accordingly.</p>
              
              <div class="event-name">${event.title}</div>
              
              <div class="changes-box">
                <strong>What Changed:</strong>
                <ul>
                  ${changeList}
                </ul>
              </div>

              <div style="background: #f0f7ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <strong>New Event Details:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Date:</strong> ${(0, dateFormatter_1.formatDate)(new Date(event.date))}</li>
                  <li><strong>Time:</strong> ${event.time}</li>
                  <li><strong>Location:</strong> ${event.location || 'TBA'}</li>
                  ${event.isPaid ? `<li><strong>Fee:</strong> ₹${event.price}</li>` : ''}
                </ul>
              </div>

              <p style="color: #666; font-size: 14px;">
                Please visit the EventHub website to view complete event details. If you have any questions, contact the college administration.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `EVENT UPDATED: ${event.title}\n\nWhat Changed:\n${Object.entries(changes).map(([field, change]) => `- ${field}: ${change.old} → ${change.new}`).join('\n')}\n\nVisit EventHub to view complete details.`;
        // Send emails to all registered users
        for (const recipient of emails) {
            const msg = {
                to: recipient.email,
                from: FROM_EMAIL,
                subject: `Event Updated: ${event.title}`,
                text: plainTextContent,
                html: htmlContent.replace('Hi there,', `Hi ${recipient.firstName || 'there'},`),
            };
            try {
                await mail_1.default.send(msg);
                console.log(`✅ Event update email sent to: ${recipient.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to send update email to ${recipient.email}:`, error);
            }
        }
    }
    catch (error) {
        console.error('❌ Error sending event update notification:', error);
    }
}
// ============ EVENT CANCELLATION NOTIFICATION ============
async function sendEventCancellationNotification(eventId) {
    try {
        const event = await Event_1.Event.findById(eventId);
        if (!event)
            return;
        const registrations = await Registration_1.Registration.find({ eventId, status: 'registered' });
        if (registrations.length === 0)
            return;
        const emails = await getUserEmailsFromRegistrations(registrations.map(r => r._id.toString()));
        if (emails.length === 0)
            return;
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .event-name { color: #e74c3c; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Event Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>We regret to inform you that the following event has been cancelled:</p>
              
              <div class="event-name">${event.title}</div>

              ${event.isPaid ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <strong>⚠️ Payment Notice:</strong>
                <p style="margin: 10px 0 0 0; font-size: 14px;">If you made a payment for this event, please contact the college reception for refund information and procedures.</p>
              </div>
              ` : ''}

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you have any questions or concerns, please reach out to the college administration.
              </p>

              <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                We apologize for any inconvenience this may cause.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `EVENT CANCELLED: ${event.title}\n\nWe regret to inform you that this event has been cancelled.\n${event.isPaid ? '\nIf you made a payment, please contact the college reception for refund information.' : ''}\n\nFor questions, contact college administration.`;
        for (const recipient of emails) {
            const msg = {
                to: recipient.email,
                from: FROM_EMAIL,
                subject: `Event Cancelled: ${event.title}`,
                text: plainTextContent,
                html: htmlContent.replace('Hi there,', `Hi ${recipient.firstName || 'there'},`),
            };
            try {
                await mail_1.default.send(msg);
                console.log(`✅ Cancellation email sent to: ${recipient.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to send cancellation email to ${recipient.email}:`, error);
            }
        }
    }
    catch (error) {
        console.error('❌ Error sending event cancellation notification:', error);
    }
}
// ============ REGISTRATION CONFIRMATION WITH RECEIPT ============
async function sendRegistrationConfirmationEmail(userId, eventId, isPaid = false) {
    let userEmail = '';
    try {
        const user = await User_1.User.findById(userId);
        const event = await Event_1.Event.findById(eventId);
        const registration = await Registration_1.Registration.findOne({ userId, eventId });
        if (!user || !event || !registration)
            return;
        userEmail = user.email; // Store for error logging
        const confirmationNumber = registration._id.toString().slice(-8).toUpperCase();
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .receipt { background: #fff; padding: 20px; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0; }
            .receipt-header { background: #f0f0f0; padding: 15px; text-align: center; border-bottom: 2px solid #667eea; }
            .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .receipt-row strong { color: #333; }
            .receipt-value { color: #667eea; font-weight: bold; }
            .confirmation-number { background: #e8f4fd; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0; }
            .confirmation-number .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .confirmation-number .number { font-size: 24px; font-family: 'Courier New', monospace; font-weight: bold; color: #667eea; letter-spacing: 2px; }
            .event-details { background: #f0f7ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .payment-box { background: #d4edda; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #28a745; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Registration Confirmed</h1>
              ${isPaid ? '<p style="font-size: 14px; margin: 10px 0 0 0;">💳 Payment Successful</p>' : ''}
            </div>
            <div class="content">
              <p>Hi ${user.firstName || 'there'},</p>
              <p>Great news! You have successfully registered for <strong>${event.title}</strong>.</p>

              ${isPaid ? `
              <div class="payment-box">
                <strong>✅ Payment Successful</strong>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Your payment of <strong>₹${event.price}</strong> has been processed.</p>
              </div>
              ` : ''}

              <div class="confirmation-number">
                <div class="label">Confirmation Number</div>
                <div class="number">${confirmationNumber}</div>
              </div>

              <div class="receipt">
                <div class="receipt-header">
                  <strong>Registration Receipt</strong>
                </div>
                <div class="receipt-row">
                  <span><strong>Event</strong></span>
                  <span class="receipt-value">${event.title}</span>
                </div>
                <div class="receipt-row">
                  <span><strong>Date</strong></span>
                  <span class="receipt-value">${formattedDate}</span>
                </div>
                <div class="receipt-row">
                  <span><strong>Time</strong></span>
                  <span class="receipt-value">${event.time}</span>
                </div>
                <div class="receipt-row">
                  <span><strong>Location</strong></span>
                  <span class="receipt-value">${event.location || 'TBA'}</span>
                </div>
                ${event.isPaid ? `
                <div class="receipt-row">
                  <span><strong>Registration Fee</strong></span>
                  <span class="receipt-value">₹${event.price}</span>
                </div>
                ` : ''}
                <div class="receipt-row" style="border-bottom: none;">
                  <span><strong>Confirmation Number</strong></span>
                  <span class="receipt-value">${confirmationNumber}</span>
                </div>
              </div>

              <p style="color: #666; font-size: 14px;">
                Please keep this confirmation for your records. Make sure to arrive at least 15 minutes before the event start time.
              </p>

              ${event.isPaid ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <strong>⚠️ Important:</strong>
                <p style="margin: 10px 0 0 0; font-size: 13px;">Please note that all payments are <strong>non-refundable</strong>. For questions about your payment, please visit the college reception.</p>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `REGISTRATION CONFIRMED${isPaid ? ' - PAYMENT SUCCESSFUL' : ''}\n\n${user.firstName || 'Hello'},\n\nYou have successfully registered for: ${event.title}\n\nConfirmation Number: ${confirmationNumber}\n\nEvent Details:\nDate: ${formattedDate}\nTime: ${event.time}\nLocation: ${event.location || 'TBA'}\n${event.isPaid ? `\nRegistration Fee: ₹${event.price}\n\nYour payment has been processed. Please note that payments are non-refundable.` : ''}\n\nKeep this confirmation for your records.\n© 2025 EventHub.`;
        const msg = {
            to: user.email,
            from: FROM_EMAIL,
            subject: `Registration Confirmed: ${event.title}${isPaid ? ' - Payment Successful' : ''}`,
            text: plainTextContent,
            html: htmlContent,
        };
        await mail_1.default.send(msg);
        console.log(`✅ Registration confirmation email sent to: ${userEmail}`);
    }
    catch (error) {
        console.error('⚠️  Failed to send registration confirmation email');
        if (userEmail)
            console.error('   To:', userEmail);
        console.error('   From:', FROM_EMAIL);
        if (error?.response?.body?.errors) {
            console.error('   SendGrid Error:', error.response.body.errors[0]?.message);
        }
        else {
            console.error('   Error:', error?.message || String(error));
        }
        console.error('   (Registration still completed - user will see details on dashboard)');
    }
}
// ============ TOURNAMENT WINNER CERTIFICATE ============
async function sendWinnerCertificateEmail(winnerId, eventId, teamId) {
    console.log(`\n🎯 sendWinnerCertificateEmail called:`);
    console.log(`   Winner ID: ${winnerId}`);
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Team ID: ${teamId || 'N/A (individual)'}`);
    // Validate winner ID is a proper MongoDB ObjectId
    if (!winnerId || typeof winnerId !== 'string') {
        console.error(`❌ Invalid winner ID: ${winnerId} (type: ${typeof winnerId})`);
        return;
    }
    if (winnerId.length < 20) {
        console.error(`❌ Winner ID appears to be a display name, not a user ID: ${winnerId}`);
        console.error(`   This usually means the tournament stored display names instead of user IDs`);
        return;
    }
    try {
        const winner = await User_1.User.findById(winnerId);
        const event = await Event_1.Event.findById(eventId);
        // Handle teamId - can be either a Team ObjectId or a team name string
        let teamName = 'Individual';
        if (teamId) {
            // Check if teamId looks like a valid MongoDB ObjectId (24 hex chars)
            if (typeof teamId === 'string' && /^[0-9a-f]{24}$/i.test(teamId)) {
                // It's an ObjectId - look up the Team
                const team = await Team_1.Team.findById(teamId);
                teamName = team?.name || 'Individual';
                console.log(`   ✓ Found team: ${team?.name}`);
            }
            else {
                // It's a team name string - use it directly
                teamName = teamId;
                console.log(`   ✓ Using team name: ${teamName}`);
            }
        }
        console.log(`   ✓ Found winner: ${winner?.firstName} ${winner?.lastName} (${winner?.email})`);
        console.log(`   ✓ Found event: ${event?.title}`);
        if (!winner || !event) {
            console.error(`❌ Missing winner or event. Winner: ${winner ? 'found' : 'NOT FOUND'}, Event: ${event ? 'found' : 'NOT FOUND'}`);
            return;
        }
        const winnerName = `${winner.firstName || ''} ${winner.lastName || ''}`.trim();
        const certificateDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; padding: 0; }
            .certificate { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); padding: 60px 40px; text-align: center; border: 8px solid #8b7500; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
            .certificate-inner { border: 2px solid #8b7500; padding: 40px; background: rgba(255, 255, 255, 0.1); }
            .seal { font-size: 48px; margin: 20px 0; }
            .title { font-size: 32px; font-weight: bold; color: #8b7500; margin: 20px 0; text-transform: uppercase; letter-spacing: 2px; }
            .subtitle { font-size: 14px; color: #555; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            .name { font-size: 28px; font-weight: bold; color: #000; margin: 30px 0; text-decoration: underline; }
            .achievement { font-size: 16px; color: #333; margin: 20px 0; line-height: 1.8; }
            .event-name { font-size: 20px; font-weight: bold; color: #8b7500; margin: 15px 0; }
            .team-name { font-size: 14px; color: #555; margin: 10px 0; }
            .date-line { font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #8b7500; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .congratulations { font-size: 18px; font-style: italic; color: #8b7500; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="certificate">
              <div class="certificate-inner">
                <div class="seal">🏆</div>
                <div class="title">Certificate of Achievement</div>
                <div class="subtitle">This certificate is proudly presented to</div>
                
                <div class="name">${winnerName}</div>
                
                <div class="congratulations">Congratulations!</div>
                
                <div class="achievement">
                  For successfully winning the event
                </div>
                
                <div class="event-name">${event.title}</div>
                ${teamName !== 'Individual' ? `<div class="team-name">Team: ${teamName}</div>` : ''}
                
                <div class="date-line">
                  <strong>Date:</strong> ${certificateDate}
                </div>
              </div>
            </div>
            <div class="footer">
              <p>EventHub - Celebrating Excellence in College Events</p>
              <p>&copy; 2025. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `CERTIFICATE OF ACHIEVEMENT\n\nThis certificate is proudly presented to\n\n${winnerName}\n\nFor successfully winning:\n${event.title}\n${teamName !== 'Individual' ? `\nTeam: ${teamName}` : ''}\n\nDate: ${certificateDate}\n\nCongratulations on your achievement!`;
        const msg = {
            to: winner.email,
            from: FROM_EMAIL,
            subject: `🏆 Certificate of Achievement - ${event.title}`,
            text: plainTextContent,
            html: htmlContent,
        };
        console.log(`📧 Preparing to send certificate email:`);
        console.log(`   To: ${winner.email}`);
        console.log(`   From: ${FROM_EMAIL}`);
        console.log(`   Subject: ${msg.subject}`);
        await mail_1.default.send(msg);
        console.log(`✅ Winner certificate email sent successfully to: ${winner.email}`);
    }
    catch (error) {
        console.error('❌ Error sending winner certificate:');
        console.error('   Error message:', error?.message);
        if (error?.response?.body?.errors) {
            console.error('   SendGrid errors:', error.response.body.errors);
        }
        console.error('   Full error:', error);
    }
}
// ============ FINAL ROUND ADVANCEMENT NOTIFICATION ============
async function sendFinalRoundNotificationEmail(teamId, eventId) {
    try {
        const team = await Team_1.Team.findById(teamId);
        const event = await Event_1.Event.findById(eventId);
        if (!team || !event || !team.members)
            return;
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #333; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .team-name { color: #667eea; font-size: 20px; font-weight: bold; margin: 20px 0; }
            .event-name { color: #333; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .highlight-box { background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0; }
            .important { color: #e74c3c; font-weight: bold; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>You've Made It to the Finals!</p>
            </div>
            <div class="content">
              <p>Dear ${team.name} Members,</p>
              
              <p>We are thrilled to announce that your team has advanced to the <strong>final round</strong>!</p>

              <div class="team-name">🏅 ${team.name}</div>
              <div class="event-name">📌 ${event.title}</div>

              <div class="highlight-box">
                <p><strong>You are one of only TWO teams competing in the finals!</strong></p>
                <p>Check the EventHub website for the latest details, updated schedule, and finals venue information.</p>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                <strong class="important">⚠️ Important:</strong> Finals details may be updated by the event administrator. Please monitor your email and the website for any announcements.
              </p>

              <p style="color: #666; font-size: 14px;">
                Thank you for your participation, and best of luck in the finals!
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `CONGRATULATIONS - FINAL ROUND ADVANCEMENT\n\nDear ${team.name} Members,\n\nYour team has advanced to the FINALS of ${event.title}!\n\nYou are one of only 2 teams competing. Check the EventHub website for updated details and venue information.\n\nBest of luck!\n\n© 2025 EventHub.`;
        // Send to all team members
        for (const memberId of team.members) {
            const member = await User_1.User.findById(memberId);
            if (member && member.email) {
                const msg = {
                    to: member.email,
                    from: FROM_EMAIL,
                    subject: `🎉 Finals Advancement - ${event.title}`,
                    text: plainTextContent,
                    html: htmlContent,
                };
                try {
                    await mail_1.default.send(msg);
                    console.log(`✅ Finals notification sent to: ${member.email}`);
                }
                catch (error) {
                    console.error(`❌ Failed to send finals notification to ${member.email}:`, error);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Error sending final round notification:', error);
    }
}
// ============ EVENT COMPLETION FEEDBACK REMINDER ============
async function sendEventCompletionReminderEmail(eventId) {
    try {
        const event = await Event_1.Event.findById(eventId);
        if (!event)
            return;
        const registrations = await Registration_1.Registration.find({
            eventId,
            status: { $in: ['registered', 'completed'] }
        });
        if (registrations.length === 0)
            return;
        const emails = await getUserEmailsFromRegistrations(registrations.map(r => r._id.toString()));
        if (emails.length === 0)
            return;
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .event-name { color: #667eea; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .review-box { background: #f0f7ff; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .cta-button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Share Your Feedback</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Thank you for attending our event!</p>
              
              <div class="event-name">${event.title}</div>

              <div class="review-box">
                <p><strong>We'd love to hear from you!</strong></p>
                <p>Your feedback helps us organize better events in the future. Please take a moment to share your experience on the EventHub website.</p>
                
                <ul style="margin: 15px 0; padding-left: 20px;">
                  <li>Rate your overall experience</li>
                  <li>Share what you enjoyed most</li>
                  <li>Suggest areas for improvement</li>
                </ul>
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://localhost:3000'}/events/${eventId}" class="cta-button">
                  Leave a Review
                </a>
              </p>

              <p style="color: #666; font-size: 14px;">
                Your feedback is valuable and will greatly help us improve future events.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `SHARE YOUR FEEDBACK - ${event.title}\n\nThank you for attending ${event.title}!\n\nWe'd love to hear your feedback. Please visit EventHub to leave a review and help us improve future events.\n\nYour input matters! © 2025 EventHub.`;
        for (const recipient of emails) {
            const msg = {
                to: recipient.email,
                from: FROM_EMAIL,
                subject: `Share Your Feedback - ${event.title}`,
                text: plainTextContent,
                html: htmlContent.replace('Hi there,', `Hi ${recipient.firstName || 'there'},`),
            };
            try {
                await mail_1.default.send(msg);
                console.log(`✅ Feedback reminder sent to: ${recipient.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to send feedback reminder to ${recipient.email}:`, error);
            }
        }
    }
    catch (error) {
        console.error('❌ Error sending event completion reminder:', error);
    }
}
// ============ EVENT REMINDER EMAIL (24hrs before) ============
async function sendEventReminderEmail(eventId) {
    try {
        const event = await Event_1.Event.findById(eventId);
        if (!event)
            return;
        const registrations = await Registration_1.Registration.find({ eventId, status: 'registered' });
        if (registrations.length === 0)
            return;
        const emails = await getUserEmailsFromRegistrations(registrations.map(r => r._id.toString()));
        if (emails.length === 0)
            return;
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .event-details { background: #fff; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0; }
            .event-details strong { color: #667eea; }
            .reminder-box { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Event Reminder</h1>
              <p>Your event begins tomorrow!</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Just a friendly reminder that your registered event is happening tomorrow!</p>

              <div class="event-details">
                <p><strong>📌 ${event.title}</strong></p>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>⏰ Time:</strong> ${event.time}</p>
                <p><strong>📍 Location:</strong> ${event.location || 'TBA'}</p>
              </div>

              <div class="reminder-box">
                <strong>⏰ Don't be late!</strong>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Please arrive at least 15 minutes before the event starts for a smooth registration process.</p>
              </div>

              <p style="color: #666; font-size: 14px;">
                If you need any assistance or have questions, please contact the college administration or visit the EventHub website for more details.
              </p>

              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                See you tomorrow! 🎉
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `EVENT REMINDER - ${event.title}\n\nHi,\n\nYour event is happening tomorrow!\n\nEvent Details:\nDate: ${formattedDate}\nTime: ${event.time}\nLocation: ${event.location || 'TBA'}\n\nPlease arrive at least 15 minutes early.\n\nSee you tomorrow! © 2025 EventHub.`;
        for (const recipient of emails) {
            const msg = {
                to: recipient.email,
                from: FROM_EMAIL,
                subject: `🔔 Reminder: ${event.title} is Tomorrow!`,
                text: plainTextContent,
                html: htmlContent.replace('Hi there,', `Hi ${recipient.firstName || 'there'},`),
            };
            try {
                await mail_1.default.send(msg);
                console.log(`✅ Event reminder sent to: ${recipient.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to send event reminder to ${recipient.email}:`, error);
            }
        }
    }
    catch (error) {
        console.error('❌ Error sending event reminder:', error);
    }
}
// ============ NOTICE EMAIL TO ALL USERS ============
async function sendNoticeEmailToAllUsers(noticeTitle, noticeContent, users) {
    let sentCount = 0;
    let failedCount = 0;
    try {
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .notice-box { background: white; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0; }
            .notice-box h2 { margin: 0 0 10px 0; color: #667eea; font-size: 20px; }
            .notice-box p { margin: 10px 0; line-height: 1.8; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
            .timestamp { color: #999; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Important Notice</h1>
              <p>College Event Management System</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>An important notice has been posted on the EventHub platform. Please read it carefully:</p>

              <div class="notice-box">
                <h2>${noticeTitle}</h2>
                <p>${noticeContent.replace(/\n/g, '<br>')}</p>
                <div class="timestamp">Posted on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
              </div>

              <p>Please log in to the EventHub website to view all notices and stay updated with the latest announcements.</p>

              <p style="color: #666; font-size: 14px;">
                This is an automated notification from EventHub. Please do not reply to this email.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const plainTextContent = `IMPORTANT NOTICE\n\nTitle: ${noticeTitle}\n\n${noticeContent}\n\nPlease log in to EventHub to view all notices.\n\n© 2025 EventHub.`;
        for (const user of users) {
            if (!user.email) {
                failedCount++;
                continue;
            }
            try {
                const msg = {
                    to: user.email,
                    from: FROM_EMAIL,
                    subject: `📢 Important Notice: ${noticeTitle}`,
                    text: plainTextContent,
                    html: htmlContent,
                };
                await mail_1.default.send(msg);
                sentCount++;
                console.log(`✅ Notice sent to: ${user.email}`);
            }
            catch (error) {
                failedCount++;
                console.error(`❌ Failed to send notice to ${user.email}:`, error);
            }
        }
        console.log(`📧 Notice email campaign complete - Sent: ${sentCount}, Failed: ${failedCount}`);
        return { sentCount, failedCount };
    }
    catch (error) {
        console.error('❌ Error in sendNoticeEmailToAllUsers:', error);
        return { sentCount, failedCount };
    }
}
//# sourceMappingURL=emailNotificationService.js.map