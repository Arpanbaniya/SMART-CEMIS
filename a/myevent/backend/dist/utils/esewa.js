"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateESewaSignature = generateESewaSignature;
exports.initiateESewaPayment = initiateESewaPayment;
exports.verifyESewaPayment = verifyESewaPayment;
exports.isESewaPaymentSuccessful = isESewaPaymentSuccessful;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const getESewaConfig = () => {
    const isTest = process.env.ESEWA_MODE === 'test' || !process.env.ESEWA_MODE;
    return {
        secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
        productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
        testMode: isTest,
    };
};
/**
 * Generate HMAC SHA256 signature for eSewa
 * Format: total_amount,transaction_uuid,product_code
 */
function generateESewaSignature(totalAmount, transactionUuid, productCode, secretKey) {
    // Format: total_amount=value,transaction_uuid=value,product_code=value
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const hash = crypto_1.default
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('base64');
    return hash;
}
/**
 * Initiate eSewa payment
 */
function initiateESewaPayment(amount, transactionUuid, successUrl, failureUrl, taxAmount = 0, serviceCharge = 0, deliveryCharge = 0) {
    const config = getESewaConfig();
    // Calculate total
    const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;
    // Format amounts with decimals as eSewa expects
    const totalAmountStr = totalAmount.toFixed(2);
    const amountStr = amount.toFixed(2);
    const taxAmountStr = taxAmount.toFixed(2);
    const serviceChargeStr = serviceCharge.toFixed(2);
    const deliveryChargeStr = deliveryCharge.toFixed(2);
    // Generate signature using decimal-formatted total amount
    const signature = generateESewaSignature(totalAmountStr, transactionUuid, config.productCode, config.secretKey);
    const formUrl = config.testMode
        ? 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
        : 'https://epay.esewa.com.np/api/epay/main/v2/form';
    console.log('🧾 eSewa Payment Initiated:');
    console.log('  Mode:', config.testMode ? '🧪 TEST' : '🟢 LIVE');
    console.log('  Amount:', amountStr);
    console.log('  Total:', totalAmountStr);
    console.log('  UUID:', transactionUuid);
    console.log('  Signature:', signature);
    return {
        formUrl,
        data: {
            amount: amountStr,
            tax_amount: taxAmountStr,
            total_amount: totalAmountStr,
            transaction_uuid: transactionUuid,
            product_code: config.productCode,
            product_service_charge: serviceChargeStr,
            product_delivery_charge: deliveryChargeStr,
            success_url: successUrl,
            failure_url: failureUrl,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature,
        },
    };
}
/**
 * Verify eSewa payment status
 */
async function verifyESewaPayment(transactionUuid, totalAmount, productCode = 'EPAYTEST') {
    const config = getESewaConfig();
    const statusUrl = config.testMode
        ? 'https://rc.esewa.com.np/api/epay/transaction/status/'
        : 'https://esewa.com.np/api/epay/transaction/status/';
    const url = `${statusUrl}?product_code=${productCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
    console.log('🔍 Verifying eSewa payment:', url);
    try {
        const response = await axios_1.default.get(url);
        console.log('✅ eSewa verification response:', response.data);
        return response.data;
    }
    catch (error) {
        console.error('❌ eSewa verification error:', error);
        throw error;
    }
}
/**
 * Check if payment is successful
 */
function isESewaPaymentSuccessful(response) {
    return response.status === 'COMPLETE' && response.ref_id !== null;
}
//# sourceMappingURL=esewa.js.map