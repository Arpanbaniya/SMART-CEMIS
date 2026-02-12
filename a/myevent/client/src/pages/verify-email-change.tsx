import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function VerifyEmailChangePage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (!urlToken) {
      setStatus('error');
      setMessage('Invalid or missing verification token');
      setIsLoading(false);
      return;
    }

    setToken(urlToken);

    // Verify the token
    const verifyEmail = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('POST', '/api/email-change/verify', {
          token: urlToken
        });

        setStatus('success');
        setMessage(response.message);

        // Redirect to profile after 3 seconds
        setTimeout(() => {
          setLocation('/profile');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to verify email change. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Verify Email Change</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  Verifying your email change...
                </p>
              </div>
            ) : status === 'success' ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <h3 className="text-lg font-semibold text-center">{message}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Redirecting you to your profile...
                </p>
                <Button 
                  onClick={() => setLocation('/profile')}
                  className="w-full"
                >
                  Go to Profile
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h3 className="text-lg font-semibold text-center text-destructive">
                  Verification Failed
                </h3>
                <p className="text-sm text-muted-foreground text-center">{message}</p>
                <div className="space-y-2 w-full">
                  <Button 
                    onClick={() => setLocation('/profile')}
                    className="w-full"
                  >
                    Back to Profile
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/login')}
                    className="w-full"
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
