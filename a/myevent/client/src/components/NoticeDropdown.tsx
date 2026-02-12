// client/src/components/NoticeDropdown.tsx
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Pencil, Trash2, Send, Pin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noticeService, Notice } from '@/services/noticeService';
import NoticeForm from './NoticeForm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function NoticeDropdown() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isSuperAdmin = user?.role === 'super_admin';

  // Fetch notices
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['/api/notices'],
    queryFn: () => noticeService.getNotices(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => noticeService.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      toast({
        title: 'Success',
        description: 'Notice deleted successfully',
      });
      setDeleteConfirm(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to delete notice',
        variant: 'destructive',
      });
    },
  });

  // Pin mutation
  const pinMutation = useMutation({
    mutationFn: (notice: Notice) =>
      noticeService.updateNotice(notice._id, { isPinned: !notice.isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      toast({
        title: 'Success',
        description: 'Notice updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update notice',
        variant: 'destructive',
      });
    },
  });

  // Send email mutation
  const emailMutation = useMutation({
    mutationFn: (id: string) => noticeService.sendNoticeEmail(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      toast({
        title: 'Success',
        description: `Successfully notified ${data.sentCount} users`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send emails',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm);
    }
  };

  const handlePin = (notice: Notice) => {
    pinMutation.mutate(notice);
  };

  const handleSendEmail = (id: string) => {
    emailMutation.mutate(id);
  };

  const handleFormSuccess = () => {
    setEditingNotice(undefined);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="btn-3d hover-elevate relative"
            title="Notices"
          >
            <Bell className="h-4 w-4" />
            {notices.length > 0 && (
              <div className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[420px] glass-card border-0 shadow-2xl p-0"
        >
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notices {notices.length > 0 && <span className="text-xs text-muted-foreground">({notices.length}/5)</span>}
              </h3>
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs glass-button"
                  onClick={() => {
                    setEditingNotice(undefined);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notices...
              </div>
            ) : notices.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notices.map((notice) => (
                  <div key={notice._id} className="p-4 hover:bg-foreground/5 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {notice.isPinned && (
                          <Pin className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm break-words">
                            {notice.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(notice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isSuperAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePin(notice);
                            }}
                            disabled={pinMutation.isPending}
                            title={notice.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendEmail(notice._id);
                            }}
                            disabled={emailMutation.isPending || notice.emailNotificationSent}
                            title={notice.emailNotificationSent ? 'Email sent' : 'Send to all users'}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(notice);
                            }}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notice._id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-foreground/70 line-clamp-2">
                      {notice.content}
                    </p>

                    {isSuperAdmin && notice.emailNotificationSent && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        ✓ Email sent to all users
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isSuperAdmin && notices.length < 5 && notices.length > 0 && (
            <div className="p-3 text-xs text-muted-foreground text-center border-t border-border/50">
              {5 - notices.length} slot{5 - notices.length !== 1 ? 's' : ''} remaining
            </div>
          )}

          {isSuperAdmin && notices.length >= 5 && (
            <div className="p-3 text-xs text-amber-600 dark:text-amber-400 text-center border-t border-border/50 bg-amber-50 dark:bg-amber-950/20">
              Maximum notices reached. Delete one to add a new notice.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notice Form Modal */}
      <NoticeForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingNotice(undefined);
        }}
        notice={editingNotice}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notice will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
