import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CommentFormProps {
  eventId: string;
  userCommentsCount: number;
}

export function CommentForm({ eventId, userCommentsCount }: CommentFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post a comment.",
        variant: "destructive",
      });
      return;
    }

    // Super admins bypass comment limits
    const isSuperAdmin = user?.role === 'super_admin';
    if (!isSuperAdmin && userCommentsCount >= 3) {
      toast({
        title: "Comment Limit Reached",
        description: "You can only post 3 comments per event.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before posting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/events/${eventId}/comments`, {
        content: content.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "user-comments"] });
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been posted successfully.",
      });
      
      setContent("");
    } catch (error: any) {
      toast({
        title: "Post Failed",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

    // Super admins bypass comment limits
    const isSuperAdmin = user?.role === 'super_admin';
    const remainingComments = isSuperAdmin ? 'Unlimited' : 3 - userCommentsCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Leave a Comment
          {!isSuperAdmin && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({remainingComments} comment{remainingComments !== 1 ? 's' : ''} remaining)
            </span>
          )}
          {isSuperAdmin && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Admin - Unlimited comments)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this event..."
            className="min-h-[100px]"
            maxLength={1000}
            disabled={!isAuthenticated || (!isSuperAdmin && userCommentsCount >= 3)}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {content.length}/1000 characters
            </span>
            <div className="flex gap-2">
              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground mr-2">
                  Please log in to comment
                </p>
              )}
              {isAuthenticated && !isSuperAdmin && userCommentsCount >= 3 && (
                <p className="text-sm text-muted-foreground mr-2">
                  Comment limit reached
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  !isAuthenticated || 
                  (!isSuperAdmin && userCommentsCount >= 3) || 
                  !content.trim() || 
                  isSubmitting
                }
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
