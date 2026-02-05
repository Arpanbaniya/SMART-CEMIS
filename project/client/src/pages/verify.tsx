// client/src/pages/verify.tsx
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Prevent back-button bypass
  useEffect(() => {
    // Push state so back-button doesn't work
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Get email from sessionStorage (from register redirect)
  useEffect(() => {
    const email = sessionStorage.getItem("verifyEmail");
    if (email) {
      setVerifyEmail(email);
      sessionStorage.removeItem("verifyEmail");
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError("Please enter your verification token");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/verify-email", {
        token: token.trim(),
      });

      if (response) {
        setVerified(true);
        toast({
          title: "✅ Email Verified!",
          description: "Your email has been successfully verified. Redirecting to login...",
        });
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid or expired token. Please try again.");
      toast({
        title: "Verification Failed",
        description: err.message || "Invalid or expired token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verifyEmail) {
      setError("Email address not found");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {
        email: verifyEmail,
      });

      if (response) {
        toast({
          title: "✅ Email Sent!",
          description: "Check your inbox for a new verification token.",
        });
        setResendCooldown(30);
      }
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend email");
      toast({
        title: "Error",
        description: err.message || "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto flex-1 flex items-center justify-center px-4">
        {verified ? (
          // Success Screen
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
              <CardDescription>Your account is ready to use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Your email has been successfully verified. Redirecting to login...
              </p>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Verification Form
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verify Email</CardTitle>
              <CardDescription>
                Paste your verification token from the email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {verifyEmail && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    Verification email: <strong>{verifyEmail}</strong>
                  </p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Verification Token
                  </label>
                  <Input
                    type="text"
                    placeholder="Paste your token here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="font-mono text-sm"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    You can find this token in the email we sent you.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !token.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>

              {/* Resend Section */}
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Didn't receive the email?
                </p>
                <Button
                  onClick={handleResend}
                  variant="outline"
                  className="w-full"
                  disabled={isResending || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? (
                    <>
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      {isResending ? "Sending..." : "Resend Verification Email"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  (Wait 30 seconds between resends)
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
