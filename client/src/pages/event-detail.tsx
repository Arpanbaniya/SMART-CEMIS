import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRegistrationStatus } from "@/hooks/use-registration-status";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { convertToEmbedUrl } from "@/lib/mapUtils";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { StarRating } from "@/components/star-rating";
import { InteractiveRating } from "@/components/interactive-rating";
import { CommentForm } from "@/components/comment-form";
import { CommentItem } from "@/components/CommentItem";
import { EventRegistrationModal } from "@/components/event-registration-modal";
import { FeedbackItem } from "@/components/FeedbackItem";
import { PageLoader } from "@/components/loading-spinner";
import { Chatbot } from "@/components/chatbot";
import TournamentBracket from "@/components/TournamentBracket";
import { TeamManagement } from "@/components/team-management";
import { UserTeamView } from "@/components/user-team-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Share2,
  Heart,
  ArrowLeft,
  CheckCircle,
  Trophy,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Facebook,
  Instagram,
  X,
} from "lucide-react";
import { formatDate, formatCurrency, getCategoryColor, getStatusColor, getInitials, cn } from "@/lib/utils";
import { CalendarService } from "@/services/calendarService";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, Feedback, Registration, Comment } from "@shared/schema";

// Helper function to extract clean location name from Google Maps URL
function extractLocationName(location: string): string {
  try {
    // Handle various Google Maps URL formats
    if (location.includes('google.com/maps') || location.includes('maps.app.goo.gl')) {
      // For shortened URLs, we can't extract the name, so return a generic label
      if (location.includes('maps.app.goo.gl')) {
        return 'View Location on Maps';
      }
      
      // Extract location name from Google Maps URL
      const searchMatch = location.match(/\/search\/([^\/]+)/);
      if (searchMatch) {
        return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      }
      
      // Try to extract from place parameter
      const placeMatch = location.match(/[?&]place=([^&]+)/);
      if (placeMatch) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
      
      // Try to extract from query parameters
      const queryMatch = location.match(/[?&]q=([^&]+)/);
      if (queryMatch) {
        return decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
      }
      
      // If no search match, try to extract from the URL path
      const pathMatch = location.match(/\/@([^\/]+)/);
      if (pathMatch) {
        return 'View on Google Maps';
      }
      
      return 'View Location on Maps';
    }
    
    // Handle other map services
    if (location.includes('maps') || location.includes('map')) {
      try {
        const url = new URL(location);
        const domain = url.hostname.replace('www.', '');
        return `View on ${domain}`;
      } catch {
        return 'View Location';
      }
    }
    
    // For other URLs, try to get the domain
    try {
      const url = new URL(location);
      return url.hostname.replace('www.', '');
    } catch {
      return 'View Location';
    }
  } catch {
    return 'View Location';
  }
}

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  useWebSocket(eventId);
  const { data: registrationStatus } = useRegistrationStatus(eventId!);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Handle iframe loading timeout
  useEffect(() => {
    const checkIframeLoad = () => {
      const iframes = document.querySelectorAll('iframe[title="Event Location Map"]') as NodeListOf<HTMLIFrameElement>;
      iframes.forEach((iframe) => {
        const fallbackId = `map-fallback-${eventId}`;
        const fallbackElement = document.getElementById(fallbackId);
        
        if (fallbackElement && !iframe.dataset.loaded) {
          // Show fallback after 5 seconds if iframe hasn't loaded
          setTimeout(() => {
            if (!iframe.dataset.loaded) {
              fallbackElement.classList.remove('hidden');
            }
          }, 5000);
        }
      });
    };

    // Check immediately and then after a short delay
    checkIframeLoad();
    const timeout = setTimeout(checkIframeLoad, 1000);

    return () => clearTimeout(timeout);
  }, [eventId]);

  // Check if event is favorited
  const { data: favoriteStatus } = useQuery<{ isFavorited: boolean }>({
    queryKey: ["/api/favorites/check", eventId],
    queryFn: async () => {
      if (!eventId || !isAuthenticated) return { isFavorited: false };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/check/${eventId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to check favorite status");
      }
      return response.json();
    },
    enabled: !!eventId && isAuthenticated,
  });

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}`, {
        credentials: "include",
      });
      if (response.status === 404) {
        throw new Error("Event not found");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }
      return response.json();
    },
    enabled: !!eventId,
    retry: (failureCount, error: any) => {
      // Don't retry for 404 errors
      if (error?.message === "Event not found") return false;
      return failureCount < 3;
    },
  });

  // Check if current user can edit this event (moved here to be used in queries below)
  const finalCanEditEvent = user && event && (
    user.role === 'super_admin' || 
    (user.role === 'student_admin' && event?.createdById === user.id)
  ) && 
  // Cannot edit if event is completed, archived, or cancelled
  !['completed', 'archived', 'cancelled'].includes(event?.status);

  // Check if current user can delete this event (more permissive - allows deletion of completed/archived)
  const canDeleteEvent = user && event && (
    user.role === 'super_admin' || 
    (user.role === 'student_admin' && event?.createdById === user.id)
  );

  const { data: feedbacks = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/events", eventId, "feedback"],
    queryFn: async () => {
      if (!eventId) return [];
      const response = await fetch(`/api/events/feedback/${eventId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/events", eventId, "comments"],
    queryFn: async () => {
      if (!eventId) return [];
      console.log('Fetching comments for event:', eventId);
      const response = await fetch(`/api/events/${eventId}/comments`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      console.log('Fetched comments:', data);
      return data;
    },
    enabled: !!eventId,
  });

  const { data: userComments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/events", eventId, "user-comments"],
    queryFn: async () => {
      if (!eventId || !user?.id) return [];
      const response = await fetch(`/api/events/${eventId}/user-comments`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user comments");
      }
      return response.json();
    },
    enabled: !!eventId && !!user?.id,
  });

  // Fetch teams for team events
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/events", eventId, "teams"],
    queryFn: async () => {
      if (!eventId) return [] as any[];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/teams`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) return [] as any[];
        throw new Error("Failed to fetch teams");
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  const { data: registrations = [] } = useQuery<any[]>({
    queryKey: ["/api/events", eventId, "registrations"],
    queryFn: async () => {
      if (!eventId) return [] as any[];
      if (!eventId || !finalCanEditEvent) return [] as any[]; // Only fetch if user can edit event
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/registrations`, {
        credentials: "include",
      });
      if (!response.ok) {
        // If not authorized, return empty array
        if (response.status === 403) return [] as any[];
        throw new Error("Failed to fetch registrations");
      }
      return response.json();
    },
    enabled: !!eventId && !!user?.id && !!finalCanEditEvent, // Only enable query if user can edit event
  });

  // Public participants query - works for all users
  const { data: publicParticipants = [] } = useQuery<any[]>({
    queryKey: ["/api/events", eventId, "participants"],
    queryFn: async () => {
      if (!eventId) return [] as any[];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/participants`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch participants");
      }
      return response.json();
    },
    enabled: !!eventId,
  });

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const hasRating = feedbackRating > 0;
      const hasComment = feedbackComment.trim().length > 0;

      if (!hasRating && !hasComment) {
        throw new Error("Please provide a rating or a review comment.");
      }

      return apiRequest("POST", `/api/events/feedback/${eventId}`, {
        rating: hasRating ? feedbackRating : undefined,
        comment: hasComment ? feedbackComment.trim() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "feedback"] });
      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });
      setFeedbackRating(0);
      setFeedbackComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      console.log('Adding to favorites...', { eventId, isAuthenticated });
      try {
        const result = await apiRequest("POST", "/api/favorites", { eventId });
        console.log('Add to favorites result:', result);
        return result;
      } catch (error) {
        console.error('Add to favorites error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/check", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Added to Favorites",
        description: "Event has been added to your favorites!",
      });
    },
    onError: (error) => {
      console.error('Add to favorites mutation error:', error);
      toast({
        title: "Failed to Add",
        description: error?.message || "Could not add event to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unregister mutation
  const unregisterMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${eventId}/unregister`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "check-registration"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      toast({
        title: "Unregistered Successfully",
        description: "You have been unregistered from this event.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to unregister from event.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/favorites/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/check", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Removed from Favorites",
        description: "Event has been removed from your favorites.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove",
        description: "Could not remove event from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Force remove participant mutation for admins
  const forceRemoveParticipantMutation = useMutation({
    mutationFn: async (participantUserId: string) => {
      const endpoint = user?.role === 'super_admin' 
        ? `/api/events/admin/events/${eventId}/participants/${participantUserId}`
        : `/api/events/student-admin/events/${eventId}/participants/${participantUserId}`;
      return apiRequest("DELETE", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "check-registration"] });
      toast({
        title: "Participant Removed",
        description: "Participant has been forcefully removed from the event.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error?.error || "Failed to remove participant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite function
  const toggleFavorite = () => {
    console.log('Toggle favorite called:', { isAuthenticated, favoriteStatus, eventId });
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save events to favorites.",
        variant: "destructive",
      });
      return;
    }

    if (favoriteStatus?.isFavorited) {
      console.log('Removing from favorites...');
      removeFromFavoritesMutation.mutate();
    } else {
      console.log('Adding to favorites...');
      addToFavoritesMutation.mutate();
    }
  };

  // Share functions
  const copyEventLink = () => {
    const eventUrl = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(eventUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Event link has been copied to clipboard!",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    });
  };

  const shareOnSocial = (platform: string) => {
    const eventUrl = `${window.location.origin}/events/${eventId}`;
    const eventTitle = event?.title || "Check out this event";
    
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
        break;
      case "instagram":
        // Instagram doesn't support direct URL sharing via API
        // Copy link to clipboard and open Instagram
        copyEventLink();
        window.open("https://www.instagram.com/", "_blank");
        return;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}`;
        break;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error?.message === "Event not found" 
                ? "This event may have been deleted or the link is incorrect."
                : "Unable to load this event. Please try again later."
              }
            </p>
            <Button asChild>
              <Link href="/events">Back to Events</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isRegistered = registrationStatus?.isRegistered || false;
  
  // Check if 10 minutes have passed since registration
  const canUnregister = () => {
    if (!registrationStatus?.registeredAt) return false;
    const registrationTime = new Date(registrationStatus.registeredAt).getTime();
    const currentTime = new Date().getTime();
    const minutesPassed = (currentTime - registrationTime) / (1000 * 60);
    return minutesPassed < 10;
  };
  
  // For team events, check if user is in a team
  const isUserInTeam = event.isTeamEvent && teams.some(team => 
    team.members?.some((member: any) => member.userId === user?.id)
  );
  
  // Consider user registered if they're in a team (for team events)
  const finalIsRegistered = event.isTeamEvent ? (isRegistered || isUserInTeam) : isRegistered;
  
  const isFull = (event.participantCount || 0) >= (event.capacity || 100);
  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((sum: number, f: Feedback) => sum + (f.rating || 0), 0) / feedbacks.length
    : 0;


  // Calendar integration function
  const addToGoogleCalendar = () => {
    if (!event) return;
    
    const calendarUrl = CalendarService.generateGoogleCalendarUrl(event);
    if (CalendarService.validateCalendarUrl(calendarUrl)) {
      window.open(calendarUrl, '_blank');
      toast({
        title: "Calendar Opened",
        description: "Event added to your Google Calendar",
      });
    } else {
      toast({
        title: "Calendar Error",
        description: "Unable to generate calendar link",
        variant: "destructive",
      });
    }
  };

  // Check if current user can register for this event
  const canRegisterEvent = user && (
    user.role === 'user' || 
    (user.role === 'student_admin' && event?.createdById !== user.id)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80"}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto">
              <Link href="/events" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
              </Link>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getCategoryColor(event.category)} variant="secondary">
                  {event.category}
                </Badge>
                <Badge className={getStatusColor(event.status || "upcoming")} variant="secondary">
                  {event.status}
                </Badge>
                {event.isSportsEvent && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                    <Trophy className="h-3 w-3 mr-1" />
                    Tournament
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white" data-testid="text-event-title">
                {event.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                  <TabsTrigger value="participants" data-testid="tab-participants">Participants</TabsTrigger>
                  <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="comments" data-testid="tab-comments">Comments</TabsTrigger>
                  {event.isTeamEvent && (
                    <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
                  )}
                  {event.isSportsEvent && (
                    <TabsTrigger value="bracket" data-testid="tab-bracket">Bracket</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="participants" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {finalCanEditEvent ? (
                        <Tabs defaultValue={event.isTeamEvent ? "teams" : "registrations"} className="w-full">
                          <TabsList className="w-full justify-start">
                            {event.isTeamEvent && (
                              <TabsTrigger value="teams">Teams</TabsTrigger>
                            )}
                            <TabsTrigger value="registrations">All Registrations</TabsTrigger>
                          </TabsList>
                          
                          {event.isTeamEvent && (
                            <TabsContent value="teams" className="mt-4">
                              {teams.length > 0 ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                      {teams.length} teams registered
                                    </div>
                                    <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                      Team Tournament Mode
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    {teams.map((team: any) => (
                                      <div key={team.id || team._id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                        <div className="flex items-center justify-between mb-3">
                                          <div>
                                            <h4 className="font-semibold text-lg">{team.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              {team.memberCount || 0} members
                                              {event.maxTeamMembers && ` / ${event.maxTeamMembers} max`}
                                            </p>
                                          </div>
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Active
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="text-sm font-medium text-muted-foreground">Team Members:</div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {team.members && team.members.length > 0 ? (
                                              team.members.map((member: any, index: number) => (
                                                <div key={member.id || member._id || index} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded p-2">
                                                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium">
                                                    {member.studentName?.charAt(0) || 'U'}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                      {member.studentName || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {member.rollNo || 'N/A'}
                                                    </div>
                                                  </div>
                                                  <Badge variant="outline" className="text-xs">
                                                    {member.semester}th Sem
                                                  </Badge>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="text-sm text-muted-foreground col-span-2">No members yet</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                  <p>No teams registered yet</p>
                                  <p className="text-sm">Teams will appear here once participants register</p>
                                </div>
                              )}
                            </TabsContent>
                          )}
                          
                          <TabsContent value="registrations" className="mt-4">
                            {(registrations.length > 0 || publicParticipants.length > 0) ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">
                                    {registrations.length > 0 ? `${registrations.length} participants registered` : `${publicParticipants.length} participants registered`}
                                  </div>
                                  {(user?.role === 'super_admin' || user?.role === 'student_admin') && (
                                    <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                                      {user?.role === 'super_admin' ? 'Super Admin: Can remove any participant' : 'Student Admin: Can remove from your events'}
                                    </div>
                                  )}
                                </div>
                                <div className="rounded-lg border">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                    {(registrations.length > 0 ? registrations : publicParticipants).map((reg: any) => {
                                      console.log('Registration data:', reg);
                                      const participantName = reg.name || reg.studentName || 'Unknown';
                                      const participantId = reg.participantId?.id || reg.participantId?._id || reg.id || reg.userId;
                                      console.log('Extracted participant info:', { participantName, participantId });
                                      return (
                                      <div key={reg.id || reg._id} className="bg-muted/50 rounded-lg p-4 space-y-2 relative group">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{participantName}</span>
                                          <Badge variant="outline">{reg.programme || 'N/A'}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                          <div>Email: {reg.email || 'N/A'}</div>
                                          <div>Roll No: {reg.rollNo || 'N/A'}</div>
                                          <div>Semester: {reg.semester || 'N/A'}</div>
                                          <div>Gender: {reg.gender || 'N/A'}</div>
                                          <div>Registered: {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'N/A'}</div>
                                          {reg.type && <div>Type: {reg.type}</div>}
                                        </div>
                                        {(user?.role === 'super_admin' || 
                                          (user?.role === 'student_admin' && event?.createdById === user.id)) && (
                                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              className="btn-3d hover-elevate shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 h-8 w-8 p-0"
                                              onClick={() => {
                                                if (window.confirm(`Are you sure you want to remove ${participantName} from this event? This action cannot be undone.`)) {
                                                  console.log('Removing participant with ID:', participantId);
                                                  forceRemoveParticipantMutation.mutate(participantId);
                                                }
                                              }}
                                              disabled={forceRemoveParticipantMutation.isPending}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p>No participants registered yet</p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>
                            {finalCanEditEvent 
                              ? `${(registrations.length > 0 ? registrations.length : publicParticipants.length)} participants registered` 
                              : `${event.participantCount || 0} participants registered`
                            }
                          </p>
                          <p className="text-sm">
                            {finalCanEditEvent 
                              ? "Detailed participant information is shown above" 
                              : `${(event.capacity || 100) - (event.participantCount || 0)} spots remaining`
                            }
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6 mt-6">
                  {isAuthenticated && finalIsRegistered && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Rate This Event</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Rating</label>
                          <InteractiveRating
                            rating={feedbackRating}
                            onRatingChange={setFeedbackRating}
                            size="lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Review (Optional)</label>
                          <Textarea
                            placeholder="Share your experience with this event..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            data-testid="textarea-feedback"
                            maxLength={1000}
                          />
                        </div>
                        <Button
                          onClick={() => feedbackMutation.mutate()}
                          disabled={(feedbackRating === 0 && !feedbackComment.trim()) || feedbackMutation.isPending}
                          data-testid="button-submit-feedback"
                        >
                          {feedbackMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Event Reviews</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={Math.round(averageRating)} size="sm" />
                          <span className="text-sm text-muted-foreground">
                            ({feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {feedbacks.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                          No reviews yet. Be the first to share your experience!
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {feedbacks.map((fb: Feedback) => (
                            <FeedbackItem
                              key={fb.id}
                              feedback={fb}
                              eventId={eventId!}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comments" className="space-y-6 mt-6">
                  <CommentForm eventId={eventId!} userCommentsCount={userComments.length} />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comments.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                          No comments yet. Be the first to start a conversation!
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            console.log('Rendering comments:', comments);
                            return null;
                          })()}
                          {comments.map((comment) => (
                            <CommentItem 
                              key={comment.id} 
                              comment={comment} 
                              eventId={eventId!} 
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Teams Tab - Different views for Admin vs User */}
                {event.isTeamEvent && (
                  <TabsContent value="teams" className="mt-6">
                    {finalCanEditEvent ? (
                      <TeamManagement 
                        event={event} 
                        isAdmin={true}
                      />
                    ) : (
                      <UserTeamView 
                        event={event}
                        isRegistered={finalIsRegistered}
                      />
                    )}
                  </TabsContent>
                )}

                {event.isSportsEvent && (
                  <TabsContent value="bracket" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          Tournament Bracket
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TournamentBracket 
                          event={event} 
                          isAdmin={!!finalCanEditEvent}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>

              {/* Google Maps View - Moved below tabs */}
              {event.mapUrl && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Event Location
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={event.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Maps
                      </a>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                      <iframe
                        src={convertToEmbedUrl(event.mapUrl).embedUrl || event.mapUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Event Location Map"
                        className="w-full h-full"
                        onError={(e) => {
                          console.error('Map iframe error:', e);
                          // Fallback to direct URL if embed fails
                          const target = e.target as HTMLIFrameElement;
                          if (event.mapUrl && target.src !== event.mapUrl) {
                            target.src = event.mapUrl;
                          }
                        }}
                        onLoad={(e) => {
                          console.log('Map iframe loaded successfully');
                          const target = e.target as HTMLIFrameElement;
                          target.dataset.loaded = 'true';
                        }}
                      />
                      {/* Fallback overlay for when iframe fails to load */}
                      <div 
                        className="absolute inset-0 bg-muted/80 flex items-center justify-center hidden"
                        id={`map-fallback-${event.id}`}
                      >
                        <div className="text-center space-y-4">
                          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Map unavailable in preview</p>
                            <p className="text-xs text-muted-foreground">Click "Open in Maps" to view location</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatDate(event.date)}</p>
                        <p className="text-sm text-muted-foreground">Date</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{event.time}</p>
                        <p className="text-sm text-muted-foreground">Time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {event.location ? (
                            event.location
                          ) : event.mapUrl ? (
                            <span className="text-blue-600">View on Map</span>
                          ) : (
                            <span className="text-muted-foreground">Location not specified</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.location ? "Location Details" : "Location"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{event.endTime}</p>
                        <p className="text-sm text-muted-foreground">End Time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatDate(event.endDate)}</p>
                        <p className="text-sm text-muted-foreground">End Date</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{event.participantCount} / {event.capacity}</p>
                        <p className="text-sm text-muted-foreground">Participants</p>
                      </div>
                    </div>
                    {event.isPaid && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatCurrency(event.price || 0)}</p>
                          <p className="text-sm text-muted-foreground">Registration Fee</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {finalIsRegistered ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">You're registered!</span>
                      </div>
                      {canUnregister() ? (
                        <Button
                          variant="destructive"
                          className="w-full btn-3d hover-elevate shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold border-0"
                          size="lg"
                          onClick={() => unregisterMutation.mutate()}
                          disabled={unregisterMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {unregisterMutation.isPending ? "Unregistering..." : "Unregister from Event"}
                        </Button>
                      ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            Unregister option available only within 10 minutes of registration.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : canRegisterEvent ? (
                    <div className="space-y-3">
                      <EventRegistrationModal 
                        eventId={eventId!} 
                        event={event!}
                        isOpen={showRegistrationModal}
                        onClose={() => setShowRegistrationModal(false)}
                        onRegistrationSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "check-registration"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
                          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "teams"] });
                          toast({
                            title: "Registration Successful!",
                            description: event.isTeamEvent 
                              ? "You have joined a team for this event."
                              : "You have been registered for this event.",
                          });
                        }}
                      >
                        <Button
                          className="w-full"
                          size="lg"
                          disabled={isFull || event.status === "completed" || finalIsRegistered}
                          onClick={() => setShowRegistrationModal(true)}
                          data-testid="button-register"
                        >
                          {isFull
                            ? "Event Full"
                            : event.status === "completed"
                            ? "Event Ended"
                            : finalIsRegistered
                            ? (event.isTeamEvent && isUserInTeam ? "Already in Team" : "Already Registered")
                            : event.isPaid
                            ? `Register - ${formatCurrency(event.price || 0)}`
                            : "Register Now"}
                        </Button>
                      </EventRegistrationModal>
                      {event.isPaid && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                            ⚠️ Payment is non-refundable. Please verify event details before confirming payment.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>
                        {user?.role === 'student_admin' 
                          ? 'Student admins cannot register for events they created' 
                          : user?.role === 'super_admin'
                          ? 'Super admins cannot register for events'
                          : 'Please log in to register for events'
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm" 
                      data-testid="button-save-event"
                      onClick={toggleFavorite}
                      disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${favoriteStatus?.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      {favoriteStatus?.isFavorited ? 'Saved' : 'Save'}
                    </Button>
                    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1" size="sm" data-testid="button-share-event">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Share Event</DialogTitle>
                          <DialogDescription>
                            Share this event with your friends and followers
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => shareOnSocial('facebook')}
                              className="flex items-center gap-2"
                            >
                              <Facebook className="h-4 w-4" />
                              Facebook
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => shareOnSocial('instagram')}
                              className="flex items-center gap-2"
                            >
                              <Instagram className="h-4 w-4" />
                              Instagram
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => shareOnSocial('twitter')}
                              className="flex items-center gap-2"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                              Twitter
                            </Button>
                            <Button
                              variant="outline"
                              onClick={copyEventLink}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copy Link
                            </Button>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Event Link:</p>
                            <p className="text-xs font-mono break-all">{`${window.location.origin}/events/${eventId}`}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Separator />

                  {/* Google Calendar Integration */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Calendar Integration</h4>
                    <Button
                      onClick={addToGoogleCalendar}
                      className="w-full"
                      variant="default"
                      size="sm"
                      disabled={!event}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Add to Google Calendar
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Add this event to your Google Calendar
                    </p>
                  </div>

                  {canDeleteEvent && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        {finalCanEditEvent && (
                          <Link href={`/admin/edit-event/${event.id}`} className="flex-1">
                            <Button variant="secondary" className="w-full" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </Button>
                          </Link>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className={finalCanEditEvent ? "" : "w-full"}
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                              apiRequest("DELETE", `/api/events/${event.id}`).then(() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                                toast({ title: "Event Deleted", description: "The event has been deleted successfully." });
                                window.location.href = "/admin";
                              }).catch(() => {
                                toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
