// client/src/pages/register.tsx
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle, Sparkles, Activity, Users, CheckCircle, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function RegisterPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [interest, setInterest] = useState<"physical" | "innovative">("innovative");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (pass: string) => {
    return (
      pass.length >= 7 &&
      /[A-Z]/.test(pass) &&
      /[0-9]/.test(pass) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation first
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be 7+ chars with uppercase, number, and special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ REAL API CALL TO BACKEND
      const response = await apiRequest("POST", "/api/auth/register", {
        name,
        email,
        password,
        preference: interest,
      });

      // ✅ UPDATED: Auto-redirect to verify page instead of showing screen
      if (response?.requiresEmailVerification) {
        // Store email in sessionStorage for verify page to use for resend
        sessionStorage.setItem('verifyEmail', email);
        toast({
          title: "Account created!",
          description: "Redirecting to verification page...",
        });
        // Auto-redirect to verify page (no back-button allowed)
        window.location.href = "/verify";
      } else {
        throw new Error("Registration failed");
      }
    } catch (err: any) {
      // Handle specific backend errors
      if (err.message) {
        // Handle specific error codes from backend
        switch (err.error) {
          case 'REGISTRATION_VALIDATION_FAILED':
            setError(err.message || "Please fill in all required fields.");
            break;
          case 'EMAIL_ALREADY_EXISTS':
            setError(err.message || "Email already registered. Try signing in.");
            break;
          default:
            setError(err.message || err?.error || "Registration failed. Please try again later.");
        }
      } else {
        setError("Registration failed. Please try again later.");
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join EventHub to discover amazing events</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
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

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Preference</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInterest("physical")}
                    className={`p-3 rounded-lg border text-sm text-center transition-all ${
                      interest === "physical"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-input"
                    }`}
                  >
                    <Activity className="mx-auto h-5 w-5 mb-1" />
                    Physical<br />
                    <span className="text-xs opacity-60">Sports & Outdoors</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterest("innovative")}
                    className={`p-3 rounded-lg border text-sm text-center transition-all ${
                      interest === "innovative"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-input"
                    }`}
                  >
                    <Sparkles className="mx-auto h-5 w-5 mb-1" />
                    Innovative<br />
                    <span className="text-xs opacity-60">Tech & Arts</span>
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Register"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}