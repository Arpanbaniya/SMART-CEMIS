// client/src/pages/login.tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<{ user?: any }>("POST", "/api/auth/login", {
        email,
        password
      });

      if (data?.user) {
        toast({ 
          title: "Login successful!",
          description: "Welcome back to EventHub!"
        });
        // Invalidate auth cache to refresh user data with new role
        await queryClient.invalidateQueries({ queryKey: ['auth/user'] });
        // Redirect superadmin to events page, regular users to home
        const redirectUrl = data.user.role === 'super_admin' ? '/events' : '/';
        window.location.href = redirectUrl;
      } else {
        setError("Invalid email or password");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle specific error codes from backend
      if (err.error) {
        switch (err.error) {
          case 'LOGIN_VALIDATION_FAILED':
            setError(err.message || "Please provide both email and password.");
            break;
          case 'USER_NOT_FOUND':
            setError(err.message || "No account found with this email.");
            break;
          case 'INVALID_PASSWORD':
            setError(err.message || "Incorrect password. Please try again.");
            break;
          case 'EMAIL_NOT_VERIFIED':
            // ✅ Credentials correct but email not verified → redirect to verify page
            sessionStorage.setItem('verifyEmail', email);
            toast({
              title: "Email Not Verified",
              description: "Redirecting to verification page...",
            });
            // Hard redirect to ensure user is taken to verify page
            window.location.href = "/verify";
            return;
            break;
          default:
            setError(err.message || "Login failed. Please try again.");
        }
      } else {
        setError(err?.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <LogIn className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Access your EventHub account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    data-testid="input-login-email"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    data-testid="input-login-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login-submit"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Register
                </Link>
              </p>
              <p className="mt-2 text-xs">
                Super Admin: <code className="bg-muted px-1 rounded">admin@college.edu / admin</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
