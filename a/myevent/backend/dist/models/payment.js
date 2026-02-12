"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
// backend/src/models/Payment.ts
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'completed', 'failed'],
        default: 'initiated'
    },
    transactionId: { type: String },
    method: {
        type: String,
        enum: ['esewa', 'other'],
        default: 'esewa',
        required: true
    },
    verificationData: { type: mongoose_1.Schema.Types.Mixed },
    registrationData: { type: mongoose_1.Schema.Types.Mixed },
    emailSent: { type: Boolean, default: false }
}, { timestamps: true });
exports.Payment = (0, mongoose_1.model)('Payment', paymentSchema);
//# sourceMappingURL=payment.js.map