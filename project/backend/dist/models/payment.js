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
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    transactionId: { type: String },
    method: { type: String, required: true },
    emailSent: { type: Boolean, default: false }
}, { timestamps: true });
exports.Payment = (0, mongoose_1.model)('Payment', paymentSchema);
//# sourceMappingURL=payment.js.map