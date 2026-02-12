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
/**
 * Generate HMAC SHA256 signature for eSewa
 * Format: total_amount,transaction_uuid,product_code
 */
export declare function generateESewaSignature(totalAmount: string, transactionUuid: string, productCode: string, secretKey: string): string;
/**
 * Initiate eSewa payment
 */
export declare function initiateESewaPayment(amount: number, transactionUuid: string, successUrl: string, failureUrl: string, taxAmount?: number, serviceCharge?: number, deliveryCharge?: number): ESewaInitiateResponse;
/**
 * Verify eSewa payment status
 */
export declare function verifyESewaPayment(transactionUuid: string, totalAmount: number, productCode?: string): Promise<ESewaVerificationResponse>;
/**
 * Check if payment is successful
 */
export declare function isESewaPaymentSuccessful(response: ESewaVerificationResponse): boolean;
