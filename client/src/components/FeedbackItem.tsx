import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Edit, Trash2, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getInitials, formatDate } from "@/lib/utils";
import type { Feedback } from "@shared/schema";

interface FeedbackItemProps {
  feedback: Feedback;
  eventId: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function FeedbackItem({ feedback, eventId, canEdit = false, canDelete = false }: FeedbackItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRating, setEditedRating] = useState(feedback.rating || 0);
  const [editedComment, setEditedComment] = useState(feedback.comment || "");

  // Check if current user owns this feedback or is super admin
  const userId = typeof feedback.userId === 'string' ? feedback.userId : feedback.userId.id;
  const isOwner = user?.id === userId;
  const isSuperAdmin = user?.role === 'super_admin';
  const canEditFeedback = isOwner || isSuperAdmin;
  const canDeleteFeedback = isOwner || isSuperAdmin;

  const updateMutation = useMutation({
    mutationFn: async (data: { rating?: number; comment?: string }) => {
      return apiRequest("PUT", `/api/events/feedback/${feedback.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "feedback"] });
      toast({ title: "Review Updated", description: "Your review has been updated successfully." });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Update Failed", 
        description: error?.message || "Failed to update review.", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/feedback/${feedback.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "feedback"] });
      toast({ title: "Review Deleted", description: "Your review has been deleted successfully." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Delete Failed", 
        description: error?.message || "Failed to delete review.", 
        variant: "destructive" 
      });
    },
  });

  const handleUpdate = () => {
    const hasRating = editedRating > 0;
    const hasComment = editedComment.trim().length > 0;

    if (!hasRating && !hasComment) {
      toast({
        title: "Validation Error",
        description: "Please provide a rating or a review comment.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      rating: hasRating ? editedRating : undefined,
      comment: hasComment ? editedComment.trim() : undefined,
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(
                  typeof feedback.userId === 'object' && feedback.userId !== null
                    ? `${feedback.userId.firstName || ''} ${feedback.userId.lastName || ''}`.trim()
                    : "User"
                )}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">
                  {typeof feedback.userId === 'object' && feedback.userId !== null
                    ? `${feedback.userId.firstName || ''} ${feedback.userId.lastName || ''}`.trim() || "Anonymous"
                    : feedback.userId || "Anonymous"
                  }
                </span>
                {feedback.isEdited && (
                  <Badge variant="secondary" className="text-xs">
                    <Edit className="h-3 w-3 mr-1" />
                    Edited
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatDate(new Date(feedback.createdAt))}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    {renderStars(editedRating, true, setEditedRating)}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Comment</label>
                    <Textarea
                      value={editedComment}
                      onChange={(e) => setEditedComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedRating(feedback.rating || 0);
                        setEditedComment(feedback.comment || "");
                      }}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {feedback.rating && (
                    <div className="flex items-center gap-2">
                      {renderStars(feedback.rating)}
                      <span className="text-sm text-muted-foreground">({feedback.rating}/5)</span>
                    </div>
                  )}
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {feedback.comment}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isEditing && (canEditFeedback || canDeleteFeedback) && (
            <div className="flex gap-1">
              {canEditFeedback && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDeleteFeedback && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
