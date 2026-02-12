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

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    isEdited: boolean;
    editedAt?: string;
    userId: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  eventId: string;
}

export function CommentItem({ comment, eventId }: CommentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.id === comment.userId.id;
  const isSuperAdmin = user?.role === 'super_admin';
  const canEdit = isOwner || isSuperAdmin;
  const canDelete = isOwner || isSuperAdmin;

  const handleEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/comments/${comment.id}`, {
        content: editContent.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "comments"] });
      
      toast({
        title: "Comment Updated",
        description: "Your comment has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/comments/${comment.id}`);

      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "comments"] });
      
      toast({
        title: "Comment Deleted",
        description: "The comment has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={""} />
        <AvatarFallback className="text-sm">
          {getInitials(`${comment.userId.firstName || ""} ${comment.userId.lastName || ""}`.trim())}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.userId.firstName} {comment.userId.lastName}
            </span>
            {isSuperAdmin && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            )}
            {comment.isEdited && (
              <Badge variant="outline" className="text-xs">
                Edited
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
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
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              className="min-h-[80px]"
              maxLength={1000}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={isSubmitting || !editContent.trim()}
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
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>
        )}

        {comment.isEdited && comment.editedAt && !isEditing && (
          <p className="text-xs text-muted-foreground">
            Edited {formatDate(comment.editedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
