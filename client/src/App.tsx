import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LandingPage from "@/pages/landing";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import ProfilePage from "@/pages/profile";
import AdminDashboard from "@/pages/admin/index";
import CreateEventPage from "@/pages/admin/create-event";
// Add these lines below your existing imports
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";


function AuthenticatedRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Home : LandingPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/events/:id" component={EventDetailPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/my-events" component={ProfilePage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/events/new" component={CreateEventPage} />
      <Route path="/admin/events" component={AdminDashboard} />
      <Route path="/admin/requests" component={AdminDashboard} />
      <Route path="/admin/analytics" component={AdminDashboard} />
      <Route path="/admin/payments" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminDashboard} />
     // In AuthenticatedRouter or main Switch
<Route path="/login" component={LoginPage} />
<Route path="/register" component={RegisterPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="eventhub-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedRouter />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
