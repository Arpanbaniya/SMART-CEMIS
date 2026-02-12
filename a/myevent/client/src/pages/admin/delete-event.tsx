import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function DeleteEventPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get event ID from URL
  const location = window.location.pathname;
  const eventId = location.split('/').pop();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
      setLocation("/admin");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
      setLocation("/admin");
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    if (!eventId) {
      toast({
        title: "Error",
        description: "Invalid event ID.",
        variant: "destructive",
      });
      setLocation("/admin");
      return;
    }

    // Auto-delete and redirect
    deleteMutation.mutate();
  }, [eventId, isAuthenticated, deleteMutation, setLocation, toast]);

  if (deleteMutation.isPending) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Deleting event...</p>
        </div>
      </div>
    );
  }

  return null;
}
