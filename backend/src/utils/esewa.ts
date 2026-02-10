import axios from 'axios';
import crypto from 'crypto';

/**
 * eSewa Payment Integration
 * Documentation: https://developer.esewa.com.np/pages/Epay
 */

export interface ESewaInitiateResponse {
  formUrl: string;
  data: {
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
  };
}

export interface ESewaVerificationResponse {
  product_code: string;
  transaction_uuid: string;
  total_amount: number;
  status: 'COMPLETE' | 'PENDING' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'AMBIGUOUS' | 'NOT_FOUND' | 'CANCELED';
  ref_id: string | null;
}

interface ESewaConfig {
  secretKey: string;
  productCode: string;
  testMode: boolean;
}

const getESewaConfig = (): ESewaConfig => {
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
export function generateESewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string,
  secretKey: string
): string {
  // Format: total_amount=value,transaction_uuid=value,product_code=value
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
  
  return hash;
}

/**
 * Initiate eSewa payment
 */
export function initiateESewaPayment(
  amount: number,
  transactionUuid: string,
  successUrl: string,
  failureUrl: string,
  taxAmount: number = 0,
  serviceCharge: number = 0,
  deliveryCharge: number = 0
): ESewaInitiateResponse {
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
  const signature = generateESewaSignature(
    totalAmountStr,
    transactionUuid,
    config.productCode,
    config.secretKey
  );
  
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
export async function verifyESewaPayment(
  transactionUuid: string,
  totalAmount: number,
  productCode: string = 'EPAYTEST'
): Promise<ESewaVerificationResponse> {
  const config = getESewaConfig();
  
  const statusUrl = config.testMode
    ? 'https://rc.esewa.com.np/api/epay/transaction/status/'
    : 'https://esewa.com.np/api/epay/transaction/status/';
  
  const url = `${statusUrl}?product_code=${productCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
  
  console.log('🔍 Verifying eSewa payment:', url);
  
  try {
    const response = await axios.get<ESewaVerificationResponse>(url);
    console.log('✅ eSewa verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ eSewa verification error:', error);
    throw error;
  }
}

/**
 * Check if payment is successful
 */
export function isESewaPaymentSuccessful(response: ESewaVerificationResponse): boolean {
  return response.status === 'COMPLETE' && response.ref_id !== null;
}
