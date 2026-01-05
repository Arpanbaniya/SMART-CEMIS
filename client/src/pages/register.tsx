// client/src/pages/register.tsx
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
<<<<<<< HEAD
import { UserPlus, Mail, Lock, User, AlertCircle, Sparkles, Activity } from "lucide-react";
=======
import { UserPlus, Mail, Lock, User, AlertCircle, Sparkles, Activity, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function RegisterPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
<<<<<<< HEAD
=======
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  const [interest, setInterest] = useState<"physical" | "innovative">("innovative");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
<<<<<<< HEAD
    if (!name || !email || !password || !confirmPassword) {
=======
    if (!name || !email || !password || !confirmPassword || !gender) {
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
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
<<<<<<< HEAD
=======
        gender,
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
        preference: interest,
      });

      if (response?.user) {
        toast({
          title: "Account created!",
          description: "You can now log in with your credentials.",
        });
        // Redirect to login page after successful registration
        window.location.href = "/login";
      } else {
        throw new Error("Registration failed");
      }
    } catch (err: any) {
      // Handle specific backend errors
      if (err.message.includes("duplicate key")) {
        setError("Email already registered. Try signing in.");
      } else {
        setError(err?.error || "Registration failed. Please try again later.");
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
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join the EventHub community</CardDescription>
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
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              <div className="space-y-2">
<<<<<<< HEAD
=======
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Gender
                </label>
                <Select value={gender} onValueChange={(value) => setGender(value as "male" | "female" | "other")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
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