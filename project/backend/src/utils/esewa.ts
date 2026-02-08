<<<<<<< HEAD
=======
/**
 * eSewa Payment Utility Module
 * 
 * This module handles all eSewa payment gateway integrations including:
 *   - Generating payment signatures (HMAC SHA256)
 *   - Initiating payments and generating payment forms
 *   - Verifying payment status via eSewa API
 *   - Checking if payments were successful
 * 
 * eSewa Documentation: https://developer.esewa.com.np/pages/Epay
 * 
 * Environment Variables Required:
 *   - ESEWA_SECRET_KEY: Secret key for generating signatures
 *   - ESEWA_PRODUCT_CODE: Merchant product code (TEST: 'EPAYTEST', LIVE: varies)
 *   - ESEWA_MODE: 'test' or 'live' (defaults to 'test')
 * 
 * Key Concepts:
 *   - All amounts are in rupees (can include decimals like 100.50)
 *   - Signature is HMAC-SHA256 hash of specific fields
 *   - Payment gateway URLs differ for test vs production
 *   - Verification requires transaction_uuid and amount
 */

>>>>>>> 6fc2a7b (google maps, google calender added)
import axios from 'axios';
import crypto from 'crypto';

/**
<<<<<<< HEAD
 * eSewa Payment Integration
 * Documentation: https://developer.esewa.com.np/pages/Epay
 */

export interface ESewaInitiateResponse {
  formUrl: string;
=======
 * Response structure returned when initiating an eSewa payment.
 * Contains the form URL to redirect user and the data needed to submit to eSewa.
 */
export interface ESewaInitiateResponse {
  /** URL to eSewa payment form (test or production based on ESEWA_MODE) */
  formUrl: string;
  
  /** Hidden form fields to submit to eSewa */
>>>>>>> 6fc2a7b (google maps, google calender added)
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

<<<<<<< HEAD
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

=======
/**
 * Response structure from eSewa payment verification API.
 * Returned when checking the status of a payment transaction.
 */
export interface ESewaVerificationResponse {
  /** Merchant product code used for the payment */
  product_code: string;
  
  /** Unique identifier for this payment transaction */
  transaction_uuid: string;
  
  /** Total amount paid in rupees */
  total_amount: number;
  
  /** Payment status from eSewa:
   *  - COMPLETE: Payment successful
   *  - PENDING: Payment awaiting confirmation
   *  - FULL_REFUND / PARTIAL_REFUND: Payment refunded
   *  - NOT_FOUND: Transaction doesn't exist
   *  - CANCELED: User cancelled payment
   *  - AMBIGUOUS: Unclear transaction status
   */
  status: 'COMPLETE' | 'PENDING' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'AMBIGUOUS' | 'NOT_FOUND' | 'CANCELED';
  
  /** eSewa's reference ID for this transaction (null if payment failed) */
  ref_id: string | null;
}

/**
 * eSewa configuration object
 */
interface ESewaConfig {
  /** Secret key used to generate HMAC signatures for eSewa API calls */
  secretKey: string;
  
  /** Merchant product code - identifies your application to eSewa */
  productCode: string;
  
  /** Whether to use test/sandbox environment (true) or production (false) */
  testMode: boolean;
}

/**
 * Load eSewa configuration from environment variables
 * Uses test mode by default if ESEWA_MODE is not 'live'
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
const getESewaConfig = (): ESewaConfig => {
  const isTest = process.env.ESEWA_MODE === 'test' || !process.env.ESEWA_MODE;
  
  return {
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
    testMode: isTest,
  };
};

/**
<<<<<<< HEAD
 * Generate HMAC SHA256 signature for eSewa
 * Format: total_amount,transaction_uuid,product_code
=======
 * Generate HMAC-SHA256 signature for eSewa payment authorization
 * 
 * eSewa requires a digital signature to verify request authenticity.
 * The signature is computed from three fields in a specific format.
 * 
 * @param totalAmount - Total payment amount in rupees (as string with decimals, e.g., "500.00")
 * @param transactionUuid - Unique transaction identifier from your system
 * @param productCode - Merchant product code (e.g., "EPAYTEST")
 * @param secretKey - Secret key from eSewa merchant account
 * 
 * @returns Base64-encoded HMAC-SHA256 hash of the message
 * 
 * Example:
 *   generateESewaSignature("500.00", "evt-1234567890-abcd1234", "EPAYTEST", "secretkey123")
 *   // Returns: "xyz123abc+/=="
>>>>>>> 6fc2a7b (google maps, google calender added)
 */
export function generateESewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string,
  secretKey: string
): string {
<<<<<<< HEAD
  // Format: total_amount=value,transaction_uuid=value,product_code=value
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  
=======
  // Format message exactly as eSewa expects: key=value pairs separated by commas
  // This specific format is crucial - any deviation will cause signature verification to fail
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  
  // Create HMAC signature using SHA256 algorithm and secret key
  // Result is encoded in base64 format as required by eSewa
>>>>>>> 6fc2a7b (google maps, google calender added)
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
  
  return hash;
}

/**
<<<<<<< HEAD
 * Initiate eSewa payment
=======
 * Initiate an eSewa payment by generating payment form data
 * 
 * This function prepares all the data needed to redirect user to eSewa payment gateway.
 * It calculates totals, generates signatures, and returns form data to be submitted.
 * 
 * @param amount - Item price in rupees (e.g., 500)
 * @param transactionUuid - Unique transaction ID for tracking (e.g., "evt-1234567890-userid123")
 * @param successUrl - URL to redirect to after successful payment
 * @param failureUrl - URL to redirect to if payment fails
 * @param taxAmount - Tax to be added (default: 0)
 * @param serviceCharge - Service charge to be added (default: 0)
 * @param deliveryCharge - Delivery charge to be added (default: 0)
 * 
 * @returns ESewaInitiateResponse containing form URL and hiddenform data
 * 
 * Example:
 *   const response = initiateESewaPayment(
 *     500,
 *     "evt-1234567890-abc123",
 *     "http://localhost:3000/api/payment/esewa/success",
 *     "http://localhost:3000/api/payment/esewa/failure"
 *   );
 *   // response.formUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
 *   // response.data contains: {amount, total_amount, transaction_uuid, signature, etc}
>>>>>>> 6fc2a7b (google maps, google calender added)
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
  
<<<<<<< HEAD
  // Calculate total
  const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;
  
  // Format amounts with decimals as eSewa expects
=======
  // Calculate total: base amount + all applicable charges
  const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;
  
  // Format all amounts to 2 decimal places as eSewa API requires
  // This is important for signature generation and payment verification
>>>>>>> 6fc2a7b (google maps, google calender added)
  const totalAmountStr = totalAmount.toFixed(2);
  const amountStr = amount.toFixed(2);
  const taxAmountStr = taxAmount.toFixed(2);
  const serviceChargeStr = serviceCharge.toFixed(2);
  const deliveryChargeStr = deliveryCharge.toFixed(2);
  
<<<<<<< HEAD
  // Generate signature using decimal-formatted total amount
=======
  // Generate HMAC signature - eSewa will verify this to confirm request authenticity
  // Signature must be generated with the decimal-formatted total amount
>>>>>>> 6fc2a7b (google maps, google calender added)
  const signature = generateESewaSignature(
    totalAmountStr,
    transactionUuid,
    config.productCode,
    config.secretKey
  );
  
<<<<<<< HEAD
  const formUrl = config.testMode
    ? 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
    : 'https://epay.esewa.com.np/api/epay/main/v2/form';
  
=======
  // Select appropriate eSewa API endpoint based on environment
  // Test/Sandbox: uses rc-epay subdomain
  // Production: uses main esewa domain
  const formUrl = config.testMode
    ? 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'     // Sandbox
    : 'https://epay.esewa.com.np/api/epay/main/v2/form';        // Production
  
  // Log payment initiation details for debugging and monitoring
>>>>>>> 6fc2a7b (google maps, google calender added)
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
<<<<<<< HEAD
 * Verify eSewa payment status
=======
 * Verify payment status with eSewa API
 * 
 * After user completes payment on eSewa gateway, we must verify the payment
 * with eSewa's verification API before marking it as 'completed'.
 * This prevents payment fraud and ensures transaction integrity.
 * 
 * @param transactionUuid - The unique transaction ID we generated
 * @param totalAmount - Total amount that was paid (in rupees)
 * @param productCode - Merchant product code (default: 'EPAYTEST')
 * 
 * @returns Promise resolving to ESewaVerificationResponse with payment status
 * 
 * @throws Error if API request fails or network error occurs
 * 
 * Example:
 *   const verification = await verifyESewaPayment(
 *     "evt-1234567890-userid123",
 *     500
 *   );
 *   if (verification.status === 'COMPLETE' && verification.ref_id) {
 *     // Payment is verified - safe to create registration
 *   }
>>>>>>> 6fc2a7b (google maps, google calender added)
 */
export async function verifyESewaPayment(
  transactionUuid: string,
  totalAmount: number,
  productCode: string = 'EPAYTEST'
): Promise<ESewaVerificationResponse> {
  const config = getESewaConfig();
  
<<<<<<< HEAD
  const statusUrl = config.testMode
    ? 'https://rc.esewa.com.np/api/epay/transaction/status/'
    : 'https://esewa.com.np/api/epay/transaction/status/';
  
  const url = `${statusUrl}?product_code=${productCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
  
  console.log('🔍 Verifying eSewa payment:', url);
  
  try {
=======
  // Select verification endpoint based on test/production mode
  const statusUrl = config.testMode
    ? 'https://rc.esewa.com.np/api/epay/transaction/status/'    // Sandbox
    : 'https://esewa.com.np/api/epay/transaction/status/';       // Production
  
  // Build URL with required query parameters for status check
  const url = `${statusUrl}?product_code=${productCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
  
  // Log the verification attempt with the URL (for debugging)
  console.log('🔍 Verifying eSewa payment:', url);
  
  try {
    // Call eSewa verification API
>>>>>>> 6fc2a7b (google maps, google calender added)
    const response = await axios.get<ESewaVerificationResponse>(url);
    console.log('✅ eSewa verification response:', response.data);
    return response.data;
  } catch (error) {
<<<<<<< HEAD
=======
    // Log and re-throw error - caller should handle verification failure
>>>>>>> 6fc2a7b (google maps, google calender added)
    console.error('❌ eSewa verification error:', error);
    throw error;
  }
}

/**
<<<<<<< HEAD
 * Check if payment is successful
 */
export function isESewaPaymentSuccessful(response: ESewaVerificationResponse): boolean {
=======
 * Check if eSewa payment verification indicates successful payment
 * 
 * A payment is considered successful only if:
 *   1. eSewa status is 'COMPLETE' (not PENDING, FAILED, CANCELED, etc.)
 *   2. ref_id is not null (eSewa has issued a reference ID)
 * 
 * @param response - eSewa verification API response
 * 
 * @returns True if payment is confirmed successful, false otherwise
 * 
 * Example:
 *   const verification = await verifyESewaPayment(uuid, amount);
 *   if (isESewaPaymentSuccessful(verification)) {
 *     // Safe to create registration and mark payment as completed
 *   } else {
 *     // Payment failed - reject registration
 *   }
 */
export function isESewaPaymentSuccessful(response: ESewaVerificationResponse): boolean {
  // Both conditions must be true: status is COMPLETE AND ref_id exists
>>>>>>> 6fc2a7b (google maps, google calender added)
  return response.status === 'COMPLETE' && response.ref_id !== null;
}
