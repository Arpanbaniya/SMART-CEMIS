import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
<<<<<<< HEAD
import { Header } from "@/components/header";
=======
import Header from "@/components/header";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { Footer } from "@/components/footer";
import { StarRating } from "@/components/star-rating";
import { PageLoader } from "@/components/loading-spinner";
import { Chatbot } from "@/components/chatbot";
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
} from "lucide-react";
import { formatDate, formatCurrency, getCategoryColor, getStatusColor, getInitials, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, Feedback, Registration } from "@shared/schema";

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = params?.id;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  useWebSocket(eventId);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
<<<<<<< HEAD
=======
    queryFn: async () => {
      if (!eventId) return null;
      const response = await fetch(`/api/events/${eventId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }
      return response.json();
    },
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
    enabled: !!eventId,
  });

  const { data: feedbacks = [] } = useQuery<Feedback[]>({
    queryKey: ["/api/events", eventId, "feedback"],
<<<<<<< HEAD
=======
    queryFn: async () => {
      if (!eventId) return [];
      const response = await fetch(`/api/events/${eventId}/feedback`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
    enabled: !!eventId,
  });

  const { data: registration } = useQuery<Registration | null>({
    queryKey: ["/api/registrations", eventId, user?.id],
<<<<<<< HEAD
=======
    queryFn: async () => {
      if (!eventId || !user?.id) return null;
      const response = await fetch(`/api/registrations/${eventId}/${user?.id}`, {
        credentials: "include",
      });
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error("Failed to fetch registration");
      }
      return response.json();
    },
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
    enabled: !!eventId && !!user?.id,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/registrations", {
        eventId,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      toast({
        title: "Registration Successful!",
        description: "You have been registered for this event.",
      });
      setShowPaymentDialog(false);
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/feedback", {
        eventId,
        userId: user?.id,
        rating: feedbackRating,
        comment: feedbackComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "feedback"] });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      setFeedbackRating(0);
      setFeedbackComment("");
    },
  });

  const handleRegister = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (event?.isPaid) {
      setShowPaymentDialog(true);
    } else {
      registerMutation.mutate();
    }
  };

  const handlePayment = () => {
    registerMutation.mutate();
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

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <Button asChild>
              <Link href="/events">Back to Events</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isRegistered = !!registration;
  const isFull = (event.participantCount || 0) >= (event.capacity || 100);
  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

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
                  <TabsTrigger value="feedback" data-testid="tab-feedback">Feedback</TabsTrigger>
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

                  {event.mapUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Location</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            src={event.mapUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="participants" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Registered Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>{event.participantCount || 0} participants registered</p>
                        <p className="text-sm">{(event.capacity || 100) - (event.participantCount || 0)} spots remaining</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-6 mt-6">
                  {isAuthenticated && event.status === "completed" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Leave Feedback</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rating</label>
                          <StarRating
                            rating={feedbackRating}
                            size="lg"
                            interactive
                            onRatingChange={setFeedbackRating}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Comment</label>
                          <Textarea
                            placeholder="Share your experience..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            data-testid="textarea-feedback"
                          />
                        </div>
                        <Button
                          onClick={() => feedbackMutation.mutate()}
                          disabled={feedbackRating === 0 || feedbackMutation.isPending}
                          data-testid="button-submit-feedback"
                        >
                          Submit Feedback
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Reviews</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={Math.round(averageRating)} size="sm" />
                          <span className="text-sm text-muted-foreground">
                            ({feedbacks.length} reviews)
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
                          {feedbacks.map((fb) => (
                            <div key={fb.id} className="flex gap-4">
                              <Avatar>
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Anonymous</span>
                                  <StarRating rating={fb.rating} size="sm" />
                                </div>
                                {fb.comment && (
                                  <p className="text-sm text-muted-foreground">{fb.comment}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {event.isSportsEvent && (
                  <TabsContent value="bracket" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tournament Bracket</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>Tournament bracket will be available once registrations close.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
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
                        <p className="font-medium">{event.location}</p>
                        <p className="text-sm text-muted-foreground">Location</p>
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

                  {isRegistered ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">You're registered!</span>
                    </div>
<<<<<<< HEAD
                  ) : (
=======
                  ) : user?.role !== 'super_admin' ? (
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={isFull || event.status === "completed"}
                        onClick={handleRegister}
                        data-testid="button-register"
                      >
                        {isFull
                          ? "Event Full"
                          : event.status === "completed"
                          ? "Event Ended"
                          : event.isPaid
                          ? `Register - ${formatCurrency(event.price || 0)}`
                          : "Register Now"}
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Payment</DialogTitle>
                          <DialogDescription>
                            You're about to register for {event.title}. 
                            The registration fee is {formatCurrency(event.price || 0)}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Card className="bg-muted">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <span>Registration Fee</span>
                                <span className="font-bold">{formatCurrency(event.price || 0)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowPaymentDialog(false)} data-testid="button-cancel-payment">
                            Cancel
                          </Button>
                          <Button onClick={handlePayment} disabled={registerMutation.isPending} data-testid="button-confirm-payment">
                            {registerMutation.isPending ? "Processing..." : "Pay Now"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
<<<<<<< HEAD
=======
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Super admins cannot register for events</p>
                    </div>
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm" data-testid="button-save-event">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm" data-testid="button-share-event">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
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
