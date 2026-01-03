// backend/src/routes/paymentRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Payment } from '../models/payment';
import { User } from '../models/User';
import { Event } from '../models/Event';
import sgMail from '@sendgrid/mail'; // ← Use SendGrid instead of nodemailer

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const router = Router();

// Middleware to check if user is super_admin
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    User.findById(req.session.userId)
      .then(user => {
        if (user && user.role === 'super_admin') {
          next();
        } else {
          res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
      })
      .catch(() => {
        res.status(401).json({ error: 'Unauthorized' });
      });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /api/admin/payments - List all payments (Super Admin only)
router.get('/api/admin/payments', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/admin/payments/:id/preview - Get HTML preview (Super Admin only)
router.get('/api/admin/payments/:id/preview', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const user = await User.findById(payment.userId);
    const event = await Event.findById(payment.eventId);

    if (!user || !event) {
      return res.status(404).json({ error: 'User or event not found' });
    }

    // Generate HTML preview
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #3b82f6; margin: 0; }
          .receipt-details { margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .total { font-weight: bold; font-size: 18px; border-top: 2px solid #3b82f6; padding-top: 10px; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventHub Payment Receipt</h1>
            <p>Thank you for your payment!</p>
          </div>
          <div class="receipt-details">
            <div class="receipt-row">
              <span>Receipt ID:</span>
              <span>${payment._id}</span>
            </div>
            <div class="receipt-row">
              <span>Date:</span>
              <span>${new Date(payment.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="receipt-row">
              <span>Paid by:</span>
              <span>${user.firstName} ${user.lastName || ''}</span>
            </div>
            <div class="receipt-row">
              <span>Event:</span>
              <span>${event.title}</span>
            </div>
            <div class="receipt-row">
              <span>Amount:</span>
              <span>$${(payment.amount / 100).toFixed(2)}</span>
            </div>
            <div class="receipt-row">
              <span>Status:</span>
              <span style="color: ${payment.status === 'completed' ? 'green' : 'orange'}; text-transform: capitalize;">
                ${payment.status}
              </span>
            </div>
            ${payment.transactionId ? `
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <span>${payment.transactionId}</span>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automatically generated receipt. Please keep it for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// POST /api/admin/payments/:id/resend - Resend payment email (Super Admin only)
router.post('/api/admin/payments/:id/resend', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const user = await User.findById(payment.userId);
    const event = await Event.findById(payment.eventId);

    if (!user || !event) {
      return res.status(404).json({ error: 'User or event not found' });
    }

    // Send email using SendGrid
    const msg = {
      to: user.email,
      from: process.env.FROM_EMAIL || 'colzsendd@gmail.com',
      subject: `Payment Receipt - ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Payment Receipt</title></head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>EventHub Payment Receipt</h2>
            <p>Thank you for your payment for <strong>${event.title}</strong>!</p>
            <p><strong>Amount:</strong> $${(payment.amount / 100).toFixed(2)}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
            <p>This is your official payment receipt. Please keep it for your records.</p>
            <p>Best regards,<br>EventHub Team</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    
    // Mark as email sent
    payment.emailSent = true;
    await payment.save();

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email resend error:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

export default router;