// backend/src/routes/paymentRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Payment } from '../models/payment';
import { User } from '../models/User';
import { Event } from '../models/Event';
import sgMail from '@sendgrid/mail'; // ← Use SendGrid instead of nodemailer
import { initiateESewaPayment, verifyESewaPayment, isESewaPaymentSuccessful } from '../utils/esewa';
import { createAdminLog, extractRequestMetadata } from '../utils/logger';
import { sendRegistrationConfirmationEmail } from '../services/emailNotificationService';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Declare broadcast function (set by server.ts)
declare var broadcastToAllUsers: (data: any) => void;

const router = Router();

// Middleware to check if user is super_admin or student_admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    User.findById(req.session.userId)
      .then(user => {
        if (user && (user.role === 'super_admin' || user.role === 'student_admin')) {
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

// Middleware to check if user is super_admin only
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    User.findById(req.session.userId)
      .then(user => {
        if (user && user.role === 'super_admin') {
          next();
        } else {
          res.status(403).json({ error: 'Forbidden: Super admin access required' });
        }
      })
      .catch(() => {
        res.status(401).json({ error: 'Unauthorized' });
      });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// USER-FACING ROUTES (mounted under /api/payment)

// ADMIN ROUTES (mounted under /api/admin/payments)

// GET / - List all payments (Super Admin only)
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    
    // Fetch user and event details for each payment
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const user = await User.findById(payment.userId, 'email firstName lastName');
        const event = await Event.findById(payment.eventId, 'title');
        
        return {
          ...payment.toJSON(),
          userId: user ? { email: user.email } : null,
          eventId: event ? { title: event.title } : null
        };
      })
    );
    
    res.json(enrichedPayments);
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /:id/preview - Get HTML preview (Super Admin only)
router.get('/:id/preview', requireAuth, requireSuperAdmin, async (req, res) => {
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

// POST /:id/resend - Resend payment email (Super Admin only)
router.post('/:id/resend', requireAuth, requireSuperAdmin, async (req, res) => {
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
            <p><strong>Amount:</strong> NPR ${(payment.amount / 100).toFixed(2)}</p>
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

// ============== eSEWA PAYMENT ROUTES ==============

// POST /esewa/initiate - Initialize eSewa payment
router.post('/esewa/initiate', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: 'EVENT_ID_REQUIRED',
        message: 'Event ID is required to initiate a payment.'
      });
    }

    const userId = req.session.userId;
    const { registrationData } = req.body;
    
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.isPaid || !event.price || event.price <= 0) {
      return res.status(400).json({
        error: 'EVENT_NOT_PAID',
        message: 'This event does not require an online payment.'
      });
    }

    const amountInPaisa = Math.round(event.price * 100);
    const transactionUuid = `evt-${Date.now()}-${String(userId).substring(0, 8)}`;

    // Create a payment record in initiated state
    const payment = new Payment({
      userId,
      eventId: event._id.toString(),
      amount: amountInPaisa,
      status: 'initiated',
      method: 'esewa',
      registrationData // Store registration data for use after payment verification
    });

    await payment.save();

    // Generate eSewa form data
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const esewaData = initiateESewaPayment(
      event.price, // amount in rupees (will be converted internally if needed)
      transactionUuid,
      `${baseUrl}/api/payment/esewa/success`,
      `${baseUrl}/api/payment/esewa/failure`,
      0, // tax
      0, // service charge
      0  // delivery charge
    );

    return res.status(201).json({
      transactionUuid,
      amountInPaisa,
      eventName: event.title,
      formUrl: esewaData.formUrl,
      formData: esewaData.data
    });
  } catch (error) {
    console.error('eSewa initiate error:', error);
    return res.status(500).json({ error: 'Failed to initiate eSewa payment' });
  }
});

// GET /esewa/success - eSewa success callback
router.get('/esewa/success', async (req, res) => {
  try {
    const { data, ...otherParams } = req.query;
    
    console.log('✅ eSewa success callback received');
    console.log('Encoded data:', data);

    if (!data) {
      return res.status(400).json({ error: 'No payment data received' });
    }

    // Decode base64 response
    let decodedData: any;
    try {
      const decoded = Buffer.from(data as string, 'base64').toString('utf-8');
      decodedData = JSON.parse(decoded);
      console.log('✅ Decoded eSewa response:', decodedData);
    } catch (decodeError) {
      console.error('❌ Failed to decode eSewa response:', decodeError);
      return res.status(400).json({ error: 'Invalid response format' });
    }

    const { transaction_uuid, status, total_amount, ref_id } = decodedData;

    // Verify with eSewa API
    console.log('🔍 Verifying with eSewa API...');
    const verification = await verifyESewaPayment(
      transaction_uuid,
      total_amount
    );

    console.log('✅ eSewa verification result:', verification);

    if (!isESewaPaymentSuccessful(verification)) {
      return res.status(400).json({
        error: 'PAYMENT_VERIFICATION_FAILED',
        message: `Payment verification failed. Status: ${verification.status}`
      });
    }

    // Find and update payment record
    const payment = await Payment.findOne({
      method: 'esewa',
      status: 'initiated'
    }).sort({ createdAt: -1 });

    if (!payment) {
      console.error('❌ No pending eSewa payment found');
      return res.status(404).json({
        error: 'PAYMENT_NOT_FOUND',
        message: 'No pending payment found for verification'
      });
    }

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = ref_id;
    payment.verificationData = verification;
    await payment.save();

    console.log('✅ Payment marked as completed');

    // Complete event registration with stored data
    if (payment.registrationData && payment.registrationData.studentName) {
      try {
        const { Registration } = require('../models/Registration');
        const { Event } = await import('../models/Event');
        
        const registration = new Registration({
          eventId: payment.eventId,
          userId: payment.userId,
          registeredAt: new Date(), // Explicitly set date
          ...payment.registrationData
        });
        await registration.save();
        console.log('✅ Event registration completed after payment');

        // Increment event participant count
        const updatedEvent = await Event.findByIdAndUpdate(payment.eventId, {
          $inc: { participantCount: 1 }
        }, { new: true });
        console.log('✅ Event participant count incremented. New count:', updatedEvent?.participantCount, 'Event ID:', payment.eventId);

        // Send registration confirmation email for paid event
        setImmediate(async () => {
          try {
            console.log('📧 Sending PAID event registration confirmation email to:', payment.userId);
            await sendRegistrationConfirmationEmail(payment.userId, payment.eventId, true);
          } catch (emailError) {
            console.error('⚠️  Failed to send registration confirmation email:', emailError);
            // Don't fail payment if email fails
          }
        });

        // Broadcast event update to all users
        if (typeof broadcastToAllUsers !== 'undefined' && updatedEvent) {
          broadcastToAllUsers({
            type: 'event_updated',
            eventId: payment.eventId,
            participantCount: updatedEvent.participantCount,
            message: `${payment.registrationData.studentName} registered for the event`
          });
          console.log('✅ Event update broadcasted to all users');
        }
      } catch (regError) {
        console.error('❌ Failed to complete registration after payment:', regError);
        // Continue anyway - payment was successful
      }
    }

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/events/${payment.eventId}?payment_success=true&transaction_id=${ref_id}`);
  } catch (error) {
    console.error('❌ eSewa success callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/events?payment_failed=true&error=${encodeURIComponent((error as any).message)}`);
  }
});

// GET /esewa/failure - eSewa failure callback
router.get('/esewa/failure', (req, res) => {
  console.log('❌ eSewa payment failed');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/events?payment_failed=true&reason=user_cancelled`);
});

export default router;