import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FeedbackProps {
  feedback: {
    id: string;
    rating?: number;
    comment?: string;
    createdAt: string;
    updatedAt?: string;
    isEdited: boolean;
    editedAt?: string;
    userId: string | {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
  eventId: string;
}

export function FeedbackItem({ feedback, eventId }: FeedbackProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(feedback.rating || 0);
  const [editComment, setEditComment] = useState(feedback.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle both string and object userId formats
  const userId = typeof feedback.userId === 'string' ? feedback.userId : feedback.userId.id;
  const userFirstName = typeof feedback.userId === 'string' ? 'User' : feedback.userId.firstName;
  const userLastName = typeof feedback.userId === 'string' ? '' : feedback.userId.lastName;
  const userEmail = typeof feedback.userId === 'string' ? feedback.userId : feedback.userId.email;

  const isOwner = user?.id === userId;
  const isSuperAdmin = user?.role === 'super_admin';
  const canEdit = isOwner || isSuperAdmin;
  const canDelete = isOwner || isSuperAdmin;

  const handleEdit = async () => {
    if (editRating === feedback.rating && editComment.trim() === (feedback.comment || "")) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/events/feedback/${feedback.id}`, {
        rating: editRating,
        comment: editComment.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "feedback"] });
      
      toast({
        title: "Feedback Updated",
        description: "Your feedback has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/events/feedback/${feedback.id}`);

      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "feedback"] });
      
      toast({
        title: "Feedback Deleted",
        description: "The feedback has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditRating(feedback.rating || 0);
    setEditComment(feedback.comment || "");
    setIsEditing(false);
  };

  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={""} />
        <AvatarFallback className="text-sm">
          {getInitials(`${userFirstName || ""} ${userLastName || ""}`.trim())}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {userFirstName} {userLastName}
            </span>
            {isSuperAdmin && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            )}
            {feedback.isEdited && (
              <Badge variant="outline" className="text-xs">
                Edited
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(feedback.createdAt)}
            </span>
            
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                    className={`p-1 rounded ${editRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment</label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Edit your feedback..."
                className="min-h-[80px]"
                maxLength={1000}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={isSubmitting}
              >
                <Check className="h-4 w-4 mr-1" />
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {feedback.rating && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${(feedback.rating || 0) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
            {feedback.comment && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {feedback.comment}
              </div>
            )}
          </div>
        )}

        {feedback.isEdited && feedback.editedAt && !isEditing && (
          <p className="text-xs text-muted-foreground">
            Edited {formatDate(feedback.editedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
