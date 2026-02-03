// client/src/components/header.tsx
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { Bell, Calendar, LogOut, Settings, User, FileText, Heart, Users } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface HeaderProps {}

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getUserName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "User";
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
       window.location.href = "/";
    }
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data: { message: string; eventDescription?: string }) => {
      return apiRequest("POST", "/api/admin/requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      toast({
        title: "Request Submitted",
        description: "Your request to become a student admin has been submitted successfully.",
      });
      setIsRequestDialogOpen(false);
      setRequestMessage("");
      setEventDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!requestMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }
    createRequestMutation.mutate({
      message: requestMessage.trim(),
      eventDescription: eventDescription?.trim() || undefined,
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-header animate-slideDown">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Calendar className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-md group-hover:bg-primary/30 transition-colors duration-300"></div>
          </div>
          <span className="font-display text-xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300" data-testid="text-logo">
            EventHub
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted shimmer" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" className="btn-3d hover-elevate" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
                <div className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full pulse-glow"></div>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative h-9 w-9 rounded-full cursor-pointer group">
                    <div className="absolute -inset-1 bg-gradient-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserName()} />
                      <AvatarFallback className="bg-foreground text-background font-semibold">{getInitials(getUserName())}</AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-card border-0 shadow-2xl" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{getUserName()}</p>
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-2 transition-all duration-200" data-testid="link-profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-2 transition-all duration-200" data-testid="link-favorites">
                      <Heart className="h-4 w-4" />
                      Favorite Events
                    </Link>
                  </DropdownMenuItem>
                  {user?.role !== 'super_admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/registrations" className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-2 transition-all duration-200" data-testid="link-registrations">
                        <Users className="h-4 w-4" />
                        Registered Events
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user?.role === 'super_admin' || user?.role === 'student_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-2 transition-all duration-200" data-testid="link-admin">
                        <Settings className="h-4 w-4" />
                        {user?.role === 'super_admin' ? 'Admin' : 'My Admin'}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'user' && (
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault();
                            setIsRequestDialogOpen(true);
                          }}
                          className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-2 transition-all duration-200"
                          data-testid="link-request-admin"
                        >
                          <FileText className="h-4 w-4" />
                          Request Student Admin
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-0 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="gradient-text">Request Student Admin Access</DialogTitle>
                          <DialogDescription>
                            Submit a request to become a student admin. You'll be able to create and manage your own events.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Message *</label>
                            <Textarea
                              placeholder="Why do you want to become a student admin?"
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              className="min-h-[100px] input-3d"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Event Description (Optional)</label>
                            <Textarea
                              placeholder="Describe event you want to create..."
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                              className="min-h-[100px] input-3d"
                            />
                            <p className="text-xs text-muted-foreground">
                              Provide details about event you plan to create if you're approved.
                            </p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsRequestDialogOpen(false)}
                              disabled={createRequestMutation.isPending}
                              className="btn-3d"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSubmitRequest}
                              disabled={createRequestMutation.isPending || !requestMessage.trim()}
                              className="btn-3d gradient-primary text-white border-0"
                            >
                              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-destructive hover-elevate rounded-md p-2 transition-all duration-200" 
                    data-testid="link-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild data-testid="button-login" className="btn-3d gradient-primary text-white border-0">
              <Link href="/login">
                <span>Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}