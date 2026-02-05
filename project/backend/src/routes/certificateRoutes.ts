// backend/src/routes/certificateRoutes.ts
import express from 'express';
import { jsPDF } from 'jspdf';
import sgMail from '@sendgrid/mail';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { User } from '../models/User';
import { requireAuth, requireAdmin } from '../middleware/requireAuth';

const router = express.Router();

// Set SendGrid API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// POST /api/send-certificate - Send certificates to winners
router.post('/send-certificate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId, winnerIds, isTeam } = req.body;

    if (!eventId || !winnerIds || !Array.isArray(winnerIds)) {
      return res.status(400).json({ message: 'Missing required fields: eventId, winnerIds' });
    }

    // Get event details
    const event = await Event.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const emailsSent = [];

    if (isTeam) {
      // Team event - send to all team members
      for (const teamName of winnerIds) {
        const teamRegistrations = await Registration.find({ 
          eventId, 
          teamName,
          status: 'registered' 
        });

        for (const registration of teamRegistrations) {
          const user = await User.findOne({ id: registration.userId });
          if (user && user.email && user.firstName && user.lastName) {
            const certificateBuffer = await generateCertificate(event.title, teamName, user.firstName, user.lastName, true);
            await sendCertificateEmail(user.email, event.title, teamName, certificateBuffer);
            emailsSent.push(user.email);
          }
        }
      }
    } else {
      // Individual event - send to each winner
      for (const winnerId of winnerIds) {
        const user = await User.findOne({ id: winnerId });
        if (user && user.email && user.firstName && user.lastName) {
          const certificateBuffer = await generateCertificate(event.title, `${user.firstName} ${user.lastName}`, user.firstName, user.lastName, false);
          await sendCertificateEmail(user.email, event.title, `${user.firstName} ${user.lastName}`, certificateBuffer);
          emailsSent.push(user.email);
        }
      }
    }

    res.json({ 
      message: `Certificates sent successfully to ${emailsSent.length} recipients`,
      emailsSent 
    });
  } catch (error) {
    console.error('Error sending certificates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to generate certificate PDF
async function generateCertificate(eventTitle: string, winnerName: string, firstName: string, lastName: string, isTeam: boolean): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Certificate dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background color
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner border
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(1);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Certificate of Achievement', pageWidth / 2, 50, { align: 'center' });

  // Subtitle
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.text('This is to certify that', pageWidth / 2, 70, { align: 'center' });

  // Winner name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text(winnerName, pageWidth / 2, 90, { align: 'center' });

  // Achievement text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  
  const achievementText = isTeam 
    ? `has demonstrated outstanding teamwork and skill in the ${eventTitle} tournament.`
    : `has demonstrated outstanding skill and sportsmanship in the ${eventTitle} tournament.`;
  
  const lines = doc.splitTextToSize(achievementText, pageWidth - 60);
  doc.text(lines, pageWidth / 2, 110, { align: 'center' });

  // Date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.setFontSize(12);
  doc.text(`Awarded on ${currentDate}`, pageWidth / 2, pageHeight - 40, { align: 'center' });

  // Signature line
  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 50, pageHeight - 25, pageWidth / 2 + 50, pageHeight - 25);
  
  doc.setFontSize(10);
  doc.text('Event Organizer Signature', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // Convert to buffer
  return Buffer.from(doc.output('arraybuffer'));
}

// Helper function to send certificate email
async function sendCertificateEmail(email: string, eventTitle: string, winnerName: string, certificateBuffer: Buffer): Promise<void> {
  if (!process.env.FROM_EMAIL || !process.env.SENDGRID_API_KEY) {
    throw new Error('Email configuration missing');
  }

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: `Certificate of Achievement - ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc; text-align: center;">🏆 Certificate of Achievement 🏆</h2>
        
        <p>Dear ${winnerName},</p>
        
        <p>Congratulations on your outstanding performance in the <strong>${eventTitle}</strong>!</p>
        
        <p>Your dedication, skill, and sportsmanship have earned you this Certificate of Achievement. We are proud to recognize your accomplishment and hope this serves as a testament to your hard work.</p>
        
        <p>Please find your official certificate attached to this email. You can use it for your records, portfolio, or any professional documentation.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc; margin-top: 0;">Event Details:</h3>
          <ul>
            <li><strong>Event:</strong> ${eventTitle}</li>
            <li><strong>Achievement:</strong> Tournament Winner</li>
            <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
        </div>
        
        <p>Once again, congratulations on this remarkable achievement!</p>
        
        <p>Best regards,<br>
        The Event Team</p>
        
        <hr style="border: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
    attachments: [
      {
        content: certificateBuffer.toString('base64'),
        filename: `certificate-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  };

  await sgMail.send(msg);
}

export default router;
