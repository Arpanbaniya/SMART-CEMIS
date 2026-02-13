import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { RealTimeNotifications } from "@/components/RealTimeNotifications";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LandingPage from "@/pages/landing";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import ProfilePage from "@/pages/profile";
import VerifyEmailChangePage from "@/pages/verify-email-change";
import FavoritesPage from "@/pages/favorites";
import RegistrationsPage from "@/pages/registrations";
import AdminDashboard from "@/pages/admin/index";
import CreateEventPage from "@/pages/admin/create-event";
import EditEventPage from "@/pages/admin/edit-event";
import DeleteEventPage from "@/pages/admin/delete-event";
import { ChatroomPage } from "@/pages/chatroom";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import VerifyPage from "@/pages/verify";


function AuthenticatedRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <>
      <RealTimeNotifications userId={user?.id || null} />
      <Switch>
        <Route path="/" component={isAuthenticated ? Home : LandingPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/events/:id" component={EventDetailPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/my-events" component={ProfilePage} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/registrations" component={RegistrationsPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/events/new" component={CreateEventPage} />
        <Route path="/admin/edit-event/:id" component={EditEventPage} />
        <Route path="/admin/delete-event/:id" component={DeleteEventPage} />
        <Route path="/admin/events" component={AdminDashboard} />
        <Route path="/admin/requests" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AdminDashboard} />
        <Route path="/admin/payments" component={AdminDashboard} />
        <Route path="/admin/settings" component={AdminDashboard} />
        <Route path="/admin/chatroom" component={ChatroomPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/verify" component={VerifyPage} />
        <Route path="/verify-email-change" component={VerifyEmailChangePage} />
        <Route component={NotFound} />
      </Switch>
    </>
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
