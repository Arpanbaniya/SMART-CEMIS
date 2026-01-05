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
<<<<<<< HEAD
import { Bell, Calendar, LogOut, Search, Settings, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient"; // ← ADD THIS IMPORT
=======
import { Bell, Calendar, LogOut, Search, Settings, User, FileText } from "lucide-react";
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
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)

interface HeaderProps {
  onSearch?: (query: string) => void;
}

<<<<<<< HEAD
export function Header({ onSearch }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
=======
export default function Header({ onSearch }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)

  const getUserName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "User";
  };

<<<<<<< HEAD
  // ✅ ADD THIS LOGOUT HANDLER
=======
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
       window.location.href = "/";
    }
  };

<<<<<<< HEAD
=======
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

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold" data-testid="text-logo">
            EventHub
          </span>
        </Link>

        <div className="hidden flex-1 max-w-xl md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="w-full pl-10"
              onChange={(e) => onSearch?.(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
<<<<<<< HEAD
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-profile-menu">
=======
                  <div className="relative h-9 w-9 rounded-full cursor-pointer">
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserName()} />
                      <AvatarFallback>{getInitials(getUserName())}</AvatarFallback>
                    </Avatar>
<<<<<<< HEAD
                  </Button>
=======
                  </div>
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="link-profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-events" className="flex items-center gap-2 cursor-pointer" data-testid="link-my-events">
                      <Calendar className="h-4 w-4" />
                      My Events
                    </Link>
                  </DropdownMenuItem>
<<<<<<< HEAD
      {user?.role === 'super_admin' && (
  <DropdownMenuItem asChild>
    <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="link-admin">
      <Settings className="h-4 w-4" />
      Admin
    </Link>
  </DropdownMenuItem>
)}
=======
                  {user?.role === 'user' && (
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault();
                            setIsRequestDialogOpen(true);
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                          data-testid="link-request-admin"
                        >
                          <FileText className="h-4 w-4" />
                          Request Student Admin
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Student Admin Access</DialogTitle>
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
                              className="min-h-[100px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Event Description (Optional)</label>
                            <Textarea
                              placeholder="Describe the event you want to create..."
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground">
                              Provide details about the event you plan to create if you're approved.
                            </p>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsRequestDialogOpen(false)}
                              disabled={createRequestMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSubmitRequest}
                              disabled={createRequestMutation.isPending || !requestMessage.trim()}
                            >
                              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {(user?.role === 'super_admin' || user?.role === 'student_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="link-admin">
                        <Settings className="h-4 w-4" />
                        {user?.role === 'super_admin' ? 'Admin' : 'My Admin'}
                      </Link>
                    </DropdownMenuItem>
                  )}
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                  <DropdownMenuSeparator />
                  {/* ✅ FIXED LOGOUT */}
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-destructive" 
                    data-testid="link-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild data-testid="button-login">
              <Link href="/login">Sign In</Link> {/* ✅ Frontend route */}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}