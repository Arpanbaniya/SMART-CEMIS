import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getInitials, formatDate } from "@/lib/utils";
import type { Comment } from "@shared/schema";

interface CommentItemProps {
  comment: Comment;
  eventId: string;
}

export function CommentItem({ comment, eventId }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  // Check if current user owns this comment or is super admin
  const isOwner = user?.id === comment.userId.id;
  const isSuperAdmin = user?.role === 'super_admin';
  const isStudentAdmin = user?.role === 'student_admin';
  
  // For student admins, we'll need to check if they own the event
  // This would require event data, so for now we'll let backend handle the permission check
  const canEditComment = isOwner || isSuperAdmin;
  const canDeleteComment = isOwner || isSuperAdmin;

  const updateMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("PUT", `/api/events/comments/${comment.id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "comments"] });
      toast({ title: "Comment Updated", description: "Your comment has been updated successfully." });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Update Failed", 
        description: error?.message || "Failed to update comment.", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/comments/${comment.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "comments"] });
      toast({ title: "Comment Deleted", description: "Your comment has been deleted successfully." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Delete Failed", 
        description: error?.message || "Failed to delete comment.", 
        variant: "destructive" 
      });
    },
  });

  const handleUpdate = () => {
    const trimmedContent = editedContent.trim();
    if (!trimmedContent) {
      toast({
        title: "Validation Error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(trimmedContent);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.userId.profileImageUrl || undefined} />
              <AvatarFallback>
                {getInitials(
                  comment.userId.firstName && comment.userId.lastName
                    ? `${comment.userId.firstName} ${comment.userId.lastName}`
                    : comment.userId.email || "User"
                )}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">
                  {comment.userId?.firstName && comment.userId?.lastName
                    ? `${comment.userId.firstName} ${comment.userId.lastName}`
                    : comment.userId?.email || "Anonymous"}
                </span>
                {comment.isEdited && (
                  <Badge variant="secondary" className="text-xs">
                    <Edit className="h-3 w-3 mr-1" />
                    Edited
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatDate(new Date(comment.createdAt))}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Write your comment..."
                    className="mt-1"
                    rows={3}
                  />
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
                        setEditedContent(comment.content);
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
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              )}
            </div>
          </div>

          {!isEditing && (canEditComment || canDeleteComment) && (
            <div className="flex gap-1">
              {canEditComment && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDeleteComment && (
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
