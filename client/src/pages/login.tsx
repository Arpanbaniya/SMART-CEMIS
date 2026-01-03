// client/src/pages/login.tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
    // ✅ CORRECTED: apiRequest returns parsed data directly
    const data = await apiRequest<{ user?: any }>("POST", "/api/auth/login", {
    email,
    password
  });

    if (data?.user) {
      toast({ 
        title: "Login successful!",
        description: "Welcome back to EventHub!"
      });
      window.location.href = "/";
    } else {
      setError("Invalid email or password");
    }
  } catch (err: any) {
    console.error("Login error:", err);
    setError(err?.message || "Login failed. Please try again.");
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
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
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
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-login-password"
                  required
                />
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
                Don’t have an account?{" "}
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