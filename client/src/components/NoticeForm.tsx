// client/src/components/NoticeForm.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { noticeService, Notice } from '@/services/noticeService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NoticeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice?: Notice;
  onSuccess?: () => void;
}

export default function NoticeForm({ open, onOpenChange, notice, onSuccess }: NoticeFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [notice, open]);

  const isEditing = !!notice;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) {
        throw new Error('Title and content are required');
      }
      if (title.length > 200) {
        throw new Error('Title must be 200 characters or less');
      }
      if (content.length > 2000) {
        throw new Error('Content must be 2000 characters or less');
      }
      return noticeService.createNotice({ title, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      toast({
        title: 'Success',
        description: 'Notice created successfully',
      });
      setTitle('');
      setContent('');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notice',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!notice) throw new Error('No notice to update');
      if (!title.trim() || !content.trim()) {
        throw new Error('Title and content are required');
      }
      if (title.length > 200) {
        throw new Error('Title must be 200 characters or less');
      }
      if (content.length > 2000) {
        throw new Error('Content must be 2000 characters or less');
      }
      return noticeService.updateNotice(notice._id, { title, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      toast({
        title: 'Success',
        description: 'Notice updated successfully',
      });
      setTitle('');
      setContent('');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notice',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-0">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Notice' : 'Create New Notice'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the notice details' : 'Create a new notice for all users'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              placeholder="Notice title (max 200 characters)"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              disabled={isLoading}
              className="glass-input"
            />
            <span className="text-xs text-muted-foreground mt-1 block">
              {title.length}/200
            </span>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              placeholder="Notice content (max 2000 characters)"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 2000))}
              rows={6}
              disabled={isLoading}
              className="glass-input resize-none"
            />
            <span className="text-xs text-muted-foreground mt-1 block">
              {content.length}/2000
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="glass-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !content.trim()}
            className="gradient-button"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Notice' : 'Create Notice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
