import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";

interface KhaltiTestPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  productName: string;
  onSuccess: (payload: { token: string; amount: number; idx?: string }) => void;
  onError: (error: string) => void;
}

export function KhaltiTestPayment({ 
  isOpen, 
  onClose, 
  amount, 
  productName,
  onSuccess,
  onError 
}: KhaltiTestPaymentProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || !password) {
      onError('Please fill in all fields');
      return;
    }

    if (mobileNumber.length < 10) {
      onError('Please enter a valid mobile number');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    // Simulate payment processing
    setTimeout(() => {
      // Simulate successful payment (90% success rate for testing)
      if (Math.random() > 0.1) {
        const testPayload = {
          token: `test_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: amount * 100, // Convert to paisa
          idx: `test_idx_${Date.now()}`,
          mobile: mobileNumber
        };
        
        setStep('success');
        setTimeout(() => {
          onSuccess(testPayload);
          handleClose();
        }, 2000);
      } else {
        setStep('error');
        setTimeout(() => {
          onError('Payment failed. Please try again.');
          setStep('form');
        }, 2000);
      }
      setIsProcessing(false);
    }, 2000);
  };

  const handleClose = () => {
    setStep('form');
    setMobileNumber('');
    setPassword('');
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Test Khalti Payment
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Test Mode:</strong> This is a simulated payment for testing purposes. 
                Use any 10-digit mobile number and password to simulate payment.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                value={`NPR ${amount}`}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                value={productName}
                disabled
                className="bg-muted"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Khalti Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="98XXXXXXXX (10 digits)"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Khalti Password/PIN *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your Khalti password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay NPR ${amount}`
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Processing Payment...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your Khalti payment
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium text-green-600">Payment Successful!</p>
            <p className="text-sm text-muted-foreground">
              Your payment of NPR {amount} has been processed successfully.
            </p>
            <p className="text-xs text-muted-foreground">
              Transaction ID: test_{Date.now()}
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-lg font-medium text-red-600">Payment Failed</p>
            <p className="text-sm text-muted-foreground">
              Unable to process payment. Please try again.
            </p>
            <Button onClick={() => setStep('form')} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
