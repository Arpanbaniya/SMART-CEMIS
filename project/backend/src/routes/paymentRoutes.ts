<<<<<<< HEAD
// backend/src/routes/paymentRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Payment } from '../models/payment';
import { User } from '../models/User';
import { Event } from '../models/Event';
import sgMail from '@sendgrid/mail'; // ← Use SendGrid instead of nodemailer
import { initiateESewaPayment, verifyESewaPayment, isESewaPaymentSuccessful } from '../utils/esewa';
import { createAdminLog, extractRequestMetadata } from '../utils/logger';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Declare broadcast function (set by server.ts)
=======
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       PAYMENT PROCESSING API ROUTES                         ║
 * ║                       Used in Frontend & Backend                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ This file handles payment and eSewa integration:                            ║
 * ║  1. POST /api/payment/initiate - Initiate eSewa payment                   ║
 * ║  2. GET /api/payment/verify - Verify payment completion                  ║
 * ║  3. GET /api/admin/payments - List all payments (admin)                  ║
 * ║  4. POST /api/admin/payments/preview - Preview payment details            ║
 * ║  5. POST /api/admin/payments/resend - Resend payment confirmation        ║
 * ║                                                                            ║
 * ║ FRONTEND USAGE: Event registration with payment flow                      ║
 * ║   - Uses client/src/lib/queryClient.ts for API requests                   ║
 * ║   - Integrates with eSewa payment gateway                                  ║
 * ║                                                                            ║
 * ║ EXTERNAL SERVICE: eSewa
 * ║   - Sandbox: https://rc-epay.esewa.com.np/api/epay/main/v2/form          ║
 * ║   - Production: https://epay.esewa.com.np/api/epay/main/v2/form          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
// backend/src/routes/paymentRoutes.ts
import sgMail from '@sendgrid/mail'; // ← Use SendGrid instead of nodemailer
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Event } from '../models/Event';
import { Payment } from '../models/payment';
import { User } from '../models/User';
import { initiateESewaPayment, isESewaPaymentSuccessful, verifyESewaPayment } from '../utils/esewa';

// Configure SendGrid for sending payment confirmation emails
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

/**
 * Broadcast function - declared as a global variable set by server.ts
 * Used to notify all connected WebSocket clients about payment/registration updates
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
declare var broadcastToAllUsers: (data: any) => void;

const router = Router();

<<<<<<< HEAD
// Middleware to check if user is super_admin or student_admin
=======
/**
 * Admin Authorization Middleware
 * 
 * Checks if user has admin or student_admin role.
 * Allows access to admin payment endpoints for viewing and managing payments.
 * 
 * @param req - Express request (expects req.session.userId)
 * @param res - Express response
 * @param next - Express next middleware function
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
// Middleware to check if user is super_admin only
=======
/**
 * Super Admin Authorization Middleware
 * 
 * Stricter than requireAdmin - only allows super_admin role.
 * Used for sensitive operations like resending emails and payment verification.
 * 
 * @param req - Express request (expects req.session.userId)
 * @param res - Express response
 * @param next - Express next middleware function
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
// USER-FACING ROUTES (mounted under /api/payment)

// ADMIN ROUTES (mounted under /api/admin/payments)

// GET / - List all payments (Super Admin only)
=======
//======================================
// USER-FACING ROUTES (mounted under /api/payment)
//======================================

// ADMIN ROUTES (mounted under /api/admin/payments)

/**
 * GET / - List all payments with user and event details
 * 
 * Super Admin Only
 * Returns all payments in the system sorted by newest first.
 * Enriches payment data with user email and event title for better visibility.
 * 
 * Response: Array of payments with:
 *   - userId: {email}  (user email)
 *   - eventId: {title} (event title)
 *   - Other payment fields (amount, status, transactionId, etc.)
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
// GET /:id/preview - Get HTML preview (Super Admin only)
router.get('/:id/preview', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
=======
/**
 * GET /:id/preview - Generate HTML preview of payment receipt
 * 
 * Super Admin Only
 * Generates a formatted HTML receipt page showing payment details.
 * Can be viewed in browser or printed/saved as PDF.
 * 
 * Response: HTML page with receipt including:
 *   - Receipt ID
 *   - Payment date
 *   - Payer name and email
 *   - Event title
 *   - Amount paid
 *   - Payment status
 *   - Transaction ID (if completed)
 */
router.get('/:id/preview', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Fetch payment by ID
>>>>>>> 6fc2a7b (google maps, google calender added)
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

<<<<<<< HEAD
=======
    // Fetch associated user and event details
>>>>>>> 6fc2a7b (google maps, google calender added)
    const user = await User.findById(payment.userId);
    const event = await Event.findById(payment.eventId);

    if (!user || !event) {
      return res.status(404).json({ error: 'User or event not found' });
    }

<<<<<<< HEAD
    // Generate HTML preview
=======
    /**
     * Generate HTML receipt page with styled layout
     * Displays all relevant payment information in a professional format
     * Can be printed directly from browser using Ctrl+P
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
// POST /:id/resend - Resend payment email (Super Admin only)
=======
/**
 * POST /:id/resend - Resend payment confirmation email
 * 
 * Super Admin Only
 * Sends (or resends) the payment confirmation email to the user.
 * Marks emailSent flag as true to track that email has been delivered.
 * 
 * Useful for:
 *   - Resending lost/deleted confirmation emails
 *   - Sending to different email addresses
 *   - Manual notification after payment recovery
 * 
 * Response: {success: true, message: "Email sent successfully"}
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
    // Send email using SendGrid
=======
    /**
     * Compose and send payment confirmation email using SendGrid
     * Includes receipt details and payment status
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
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
    
<<<<<<< HEAD
    // Mark as email sent
=======
    /**
     * Mark email as sent to prevent duplicate sends and track delivery status
     * Persists the emailSent flag in the database
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    payment.emailSent = true;
    await payment.save();

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email resend error:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

<<<<<<< HEAD
// ============== eSEWA PAYMENT ROUTES ==============

// POST /esewa/initiate - Initialize eSewa payment
=======
//======================================
// eSEWA PAYMENT ROUTES
// These routes handle the complete payment flow with eSewa gateway
//======================================

/**
 * POST /esewa/initiate - Initialize eSewa payment
 * 
 * User-facing endpoint. Called when user chooses to pay for event registration.
 * 
 * Request body:
 *   - eventId (required): The event to register for
 *   - registrationData (optional): User registration details (name, email, etc.)
 *     Stored with payment and used to create registration after payment
 * 
 * Process:
 *   1. Validate event exists and is marked as paid
 *   2. Create a Payment record with 'initiated' status
 *   3. Generate eSewa payment form data with signature
 *   4. Return form URL and data for client to submit
 * 
 * Response:
 *   {
 *     transactionUuid: "evt-1234567890-userid",
 *     amountInPaisa: 50000,
 *     eventName: "Tech Conference",
 *     formUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
 *     formData: { amount, total_amount, transaction_uuid, signature, ... }
 *   }
 * 
 * Note: Client should submit formData as hidden form to formUrl
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
router.post('/esewa/initiate', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.body;

<<<<<<< HEAD
=======
    // Validate that eventId was provided in request
>>>>>>> 6fc2a7b (google maps, google calender added)
    if (!eventId) {
      return res.status(400).json({
        error: 'EVENT_ID_REQUIRED',
        message: 'Event ID is required to initiate a payment.'
      });
    }

    const userId = req.session.userId;
    const { registrationData } = req.body;
    
<<<<<<< HEAD
=======
    // Fetch event details to verify it exists and get price
>>>>>>> 6fc2a7b (google maps, google calender added)
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

<<<<<<< HEAD
=======
    /**
     * Check if event requires payment
     * Only paid events (isPaid=true, price>0) can be registered via payment
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    if (!event.isPaid || !event.price || event.price <= 0) {
      return res.status(400).json({
        error: 'EVENT_NOT_PAID',
        message: 'This event does not require an online payment.'
      });
    }

<<<<<<< HEAD
    const amountInPaisa = Math.round(event.price * 100);
    const transactionUuid = `evt-${Date.now()}-${String(userId).substring(0, 8)}`;

    // Create a payment record in initiated state
=======
    /**
     * Convert price from rupees to paisa (1 rupee = 100 paisa)
     * Always store amounts in paisa to avoid floating-point precision errors
     */
    const amountInPaisa = Math.round(event.price * 100);
    
    /**
     * Generate unique transaction UUID for this payment
     * Format: evt-{timestamp}-{first8 chars of userId}
     * Used to track payment through eSewa and identify callback requests
     */
    const transactionUuid = `evt-${Date.now()}-${String(userId).substring(0, 8)}`;

    /**
     * Create payment record in database
     * Status starts as 'initiated' - will change to 'completed' after eSewa verification
     * Stores registrationData temporarily so we can create registration after payment
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    const payment = new Payment({
      userId,
      eventId: event._id.toString(),
      amount: amountInPaisa,
      status: 'initiated',
      method: 'esewa',
      registrationData // Store registration data for use after payment verification
    });

<<<<<<< HEAD
    await payment.save();

    // Generate eSewa form data
=======
    // Persist payment record to database
    await payment.save();

    /**
     * Generate eSewa payment form data
     * This includes the cryptographic signature needed by eSewa
     * Client will submit this form data to the returned formUrl
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const esewaData = initiateESewaPayment(
      event.price, // amount in rupees (will be converted internally if needed)
      transactionUuid,
<<<<<<< HEAD
      `${baseUrl}/api/payment/esewa/success`,
      `${baseUrl}/api/payment/esewa/failure`,
=======
      `${baseUrl}/api/payment/esewa/success`,  // Callback URL if payment succeeds
      `${baseUrl}/api/payment/esewa/failure`,  // Callback URL if payment fails
>>>>>>> 6fc2a7b (google maps, google calender added)
      0, // tax
      0, // service charge
      0  // delivery charge
    );

<<<<<<< HEAD
=======
    // Return form data to client for submission to eSewa
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
// GET /esewa/success - eSewa success callback
=======
/**
 * GET /esewa/success - eSewa success callback handler
 * 
 * Called by eSewa after user completes payment on eSewa gateway.
 * 
 * Query parameters (from eSewa):
 *   - data: Base64-encoded JSON with transaction details
 *     Contains: status, transaction_uuid, total_amount, ref_id
 * 
 * Process:
 *   1. Decode base64-encoded response from eSewa
 *   2. Call eSewa verification API to confirm payment is actually complete
 *   3. Update payment status to 'completed' with eSewa reference ID
 *   4. Create event registration using stored registrationData
 *   5. Increment event participant count
 *   6. Broadcast event update to all connected users
 *   7. Redirect user to event page with success message
 * 
 * Security Note: Always verify payment with eSewa API before marking as complete
 * This prevents payment fraud and ensures transaction integrity
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
router.get('/esewa/success', async (req, res) => {
  try {
    const { data, ...otherParams } = req.query;
    
<<<<<<< HEAD
=======
    // Log callback received from eSewa
>>>>>>> 6fc2a7b (google maps, google calender added)
    console.log('✅ eSewa success callback received');
    console.log('Encoded data:', data);

    if (!data) {
      return res.status(400).json({ error: 'No payment data received' });
    }

<<<<<<< HEAD
    // Decode base64 response
=======
    /**
     * Decode eSewa's base64-encoded JSON response
     * eSewa encodes JSON data in base64 format, we need to decode it
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
    // Verify with eSewa API
=======
    /**
     * CRITICAL SECURITY STEP: Verify payment with eSewa API
     * Don't trust client-sent data - always verify with eSewa backend
     * This prevents fraud where user claims payment succeeded without actually paying
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    console.log('🔍 Verifying with eSewa API...');
    const verification = await verifyESewaPayment(
      transaction_uuid,
      total_amount
    );

    console.log('✅ eSewa verification result:', verification);

<<<<<<< HEAD
=======
    /**
     * Check if verification indicates successful payment
     * Only COMPLETE status + non-null ref_id = valid payment
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    if (!isESewaPaymentSuccessful(verification)) {
      return res.status(400).json({
        error: 'PAYMENT_VERIFICATION_FAILED',
        message: `Payment verification failed. Status: ${verification.status}`
      });
    }

<<<<<<< HEAD
    // Find and update payment record
=======
    /**
     * Find the payment record we created during initiation
     * Sorts by creation date to get the most recent payment if multiple exist
     * Query: method='esewa' AND status='initiated' (not yet verified)
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
    // Update payment status
=======
    /**
     * Mark payment as completed now that verification succeeded
     * Store the eSewa reference ID and full verification details
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    payment.status = 'completed';
    payment.transactionId = ref_id;
    payment.verificationData = verification;
    await payment.save();

    console.log('✅ Payment marked as completed');

<<<<<<< HEAD
    // Complete event registration with stored data
=======
    /**
     * AUTO-COMPLETE REGISTRATION
     * Now that payment is verified, create the event registration
     * using the data that was stored with the payment
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    if (payment.registrationData && payment.registrationData.studentName) {
      try {
        const { Registration } = require('../models/Registration');
        const { Event } = await import('../models/Event');
        
<<<<<<< HEAD
=======
        // Create event registration with stored data
>>>>>>> 6fc2a7b (google maps, google calender added)
        const registration = new Registration({
          eventId: payment.eventId,
          userId: payment.userId,
          registeredAt: new Date(), // Explicitly set date
<<<<<<< HEAD
          ...payment.registrationData
=======
          ...payment.registrationData // Spread stored registration fields (studentName, email, etc.)
>>>>>>> 6fc2a7b (google maps, google calender added)
        });
        await registration.save();
        console.log('✅ Event registration completed after payment');

<<<<<<< HEAD
        // Increment event participant count
=======
        /**
         * Increment the event's participant count
         * Important for showing updated registration numbers
         */
>>>>>>> 6fc2a7b (google maps, google calender added)
        const updatedEvent = await Event.findByIdAndUpdate(payment.eventId, {
          $inc: { participantCount: 1 }
        }, { new: true });
        console.log('✅ Event participant count incremented. New count:', updatedEvent?.participantCount, 'Event ID:', payment.eventId);

<<<<<<< HEAD
        // Broadcast event update to all users
=======
        /**
         * Real-time notification to all connected users
         * Broadcasts the event update so everyone sees the new participant count
         */
>>>>>>> 6fc2a7b (google maps, google calender added)
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
<<<<<<< HEAD
        // Continue anyway - payment was successful
      }
    }

    // Redirect to frontend success page
=======
        // Continue anyway - payment was successful, registration can be created later
      }
    }

    /**
     * Redirect to frontend success page
     * Frontend will show success message and event details
     */
>>>>>>> 6fc2a7b (google maps, google calender added)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/events/${payment.eventId}?payment_success=true&transaction_id=${ref_id}`);
  } catch (error) {
    console.error('❌ eSewa success callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/events?payment_failed=true&error=${encodeURIComponent((error as any).message)}`);
  }
});

<<<<<<< HEAD
// GET /esewa/failure - eSewa failure callback
router.get('/esewa/failure', (req, res) => {
  console.log('❌ eSewa payment failed');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/events?payment_failed=true&reason=user_cancelled`);
});

=======
/**
 * GET /esewa/failure - eSewa failure callback handler
 * 
 * Called by eSewa if user cancels payment or transaction fails.
 * 
 * What happens:
 *   - Payment record remains in 'initiated' status (not verified)
 *   - User is redirected back to events page with failure message
 *   - User can retry payment by choosing to pay again
 * 
 * Note: Payment record is NOT deleted, allowing retry/debugging
 */
router.get('/esewa/failure', (req, res) => {
  console.log('❌ eSewa payment failed');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Redirect to events page with failure flag - user can retry
  res.redirect(`${frontendUrl}/events?payment_failed=true&reason=user_cancelled`);
});

/**
 * Export payment router
 * Mounted as:
 *   app.use('/api/payment', paymentRouter);        // User payment endpoints
 *   app.use('/api/admin/payments', paymentRouter); // Admin payment management
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
export default router;