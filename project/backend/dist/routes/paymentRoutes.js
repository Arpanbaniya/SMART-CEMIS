"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/paymentRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const payment_1 = require("../models/payment");
const User_1 = require("../models/User");
const Event_1 = require("../models/Event");
const mail_1 = __importDefault(require("@sendgrid/mail")); // ← Use SendGrid instead of nodemailer
// Configure SendGrid
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY || '');
const router = (0, express_1.Router)();
// Middleware to check if user is super_admin or student_admin
const requireAdmin = (req, res, next) => {
    if (req.session.userId) {
        User_1.User.findById(req.session.userId)
            .then(user => {
            if (user && (user.role === 'super_admin' || user.role === 'student_admin')) {
                next();
            }
            else {
                res.status(403).json({ error: 'Forbidden: Admin access required' });
            }
        })
            .catch(() => {
            res.status(401).json({ error: 'Unauthorized' });
        });
    }
    else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// Middleware to check if user is super_admin only
const requireSuperAdmin = (req, res, next) => {
    if (req.session.userId) {
        User_1.User.findById(req.session.userId)
            .then(user => {
            if (user && user.role === 'super_admin') {
                next();
            }
            else {
                res.status(403).json({ error: 'Forbidden: Super admin access required' });
            }
        })
            .catch(() => {
            res.status(401).json({ error: 'Unauthorized' });
        });
    }
    else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// GET / - List all payments (Super Admin only)
router.get('/', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const payments = await payment_1.Payment.find().sort({ createdAt: -1 });
        res.json(payments);
    }
    catch (error) {
        console.error('Fetch payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});
// GET /:id/preview - Get HTML preview (Super Admin only)
router.get('/:id/preview', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const payment = await payment_1.Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        const user = await User_1.User.findById(payment.userId);
        const event = await Event_1.Event.findById(payment.eventId);
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
    }
    catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: 'Failed to generate preview' });
    }
});
// POST /:id/resend - Resend payment email (Super Admin only)
router.post('/:id/resend', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const payment = await payment_1.Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        const user = await User_1.User.findById(payment.userId);
        const event = await Event_1.Event.findById(payment.eventId);
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
        await mail_1.default.send(msg);
        // Mark as email sent
        payment.emailSent = true;
        await payment.save();
        res.json({ success: true, message: 'Email sent successfully' });
    }
    catch (error) {
        console.error('Email resend error:', error);
        res.status(500).json({ error: 'Failed to resend email' });
    }
});
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map