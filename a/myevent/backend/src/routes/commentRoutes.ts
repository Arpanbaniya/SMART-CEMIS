import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Comment } from '../models/Comment';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Registration } from '../models/Registration';

const router = Router();

// GET /:eventId/comments - Get all comments for an event
router.get('/:eventId/comments', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const comments = await Comment.find({ eventId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`Fetching ${comments.length} comments for event ${eventId}:`, comments.map(c => ({ id: c._id, content: c.content.substring(0, 50) + '...', userId: c.userId })));

    res.json(comments.map(c => c.toJSON()));
  } catch (error) {
    console.error('Fetch event comments error:', error);
    res.status(500).json({ error: 'Failed to fetch event comments' });
  }
});

// GET /:eventId/user-comments - Get current user's comments for an event
router.get('/:eventId/user-comments', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;

    const comments = await Comment.find({ userId, eventId })
      .sort({ createdAt: -1 });

    res.json(comments.map(c => c.toJSON()));
  } catch (error) {
    console.error('Fetch user comments error:', error);
    res.status(500).json({ error: 'Failed to fetch user comments' });
  }
});

// POST /:eventId/comments - Add a comment to an event
router.post('/:eventId/comments', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has registered for this event (super admins and student admins can bypass)
    const user = await User.findById(userId);
    const isSuperAdmin = user?.role === 'super_admin';
    const isStudentAdmin = user?.role === 'student_admin';

    const registration = await Registration.findOne({ userId, eventId });
    if (!registration && !isSuperAdmin && !isStudentAdmin) {
      return res.status(403).json({ error: 'You must be registered for this event to comment' });
    }

    // Check comment limit (10 comments per user per event, super admins and student admins unlimited)
    const commentCount = await Comment.countDocuments({ userId, eventId });
    if (commentCount >= 10 && !isSuperAdmin && !isStudentAdmin) {
      return res.status(400).json({ error: 'You can only post 10 comments per event' });
    }

    const comment = new Comment({
      eventId,
      userId,
      content: content.trim(),
    });

    await comment.save();
    await comment.populate('userId', 'firstName lastName email');
    
    console.log('Comment created successfully:', comment.toJSON());
    console.log('Total comments for event:', await Comment.countDocuments({ eventId }));

    res.status(201).json(comment.toJSON());
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// PUT /comments/:commentId - Edit a comment
router.put('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.session.userId!;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get user to check role permissions
    const user = await User.findById(userId);
    const isSuperAdmin = user?.role === 'super_admin';
    const isStudentAdmin = user?.role === 'student_admin';
    const isNormalUser = user?.role === 'user';

    // Check permissions:
    // Super admin: can edit any comment
    // Student admin: can edit own comments only
    // Normal user: can edit own comments only
    if (comment.userId?.toString() !== userId && !isSuperAdmin) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('userId', 'firstName lastName email');

    res.json(comment.toJSON());
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// DELETE /comments/:commentId - Delete a comment
router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.session.userId!;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get user to check role permissions
    const user = await User.findById(userId);
    const isSuperAdmin = user?.role === 'super_admin';
    const isStudentAdmin = user?.role === 'student_admin';
    const isNormalUser = user?.role === 'user';

    // Check permissions:
    // Super admin: can delete any comment
    // Student admin: can delete own comments OR comments from their created events
    // Normal user: can delete own comments only
    const isCommentOwner = comment.userId?.toString() === userId;
    
    let canDelete = false;
    if (isSuperAdmin) {
      canDelete = true;
    } else if (isStudentAdmin) {
      // Student admin can delete own comments or comments from events they created
      if (isCommentOwner) {
        canDelete = true;
      } else {
        // Check if this student admin created the event
        const event = await Event.findById(comment.eventId);
        if (event && event.createdById === userId) {
          canDelete = true;
        }
      }
    } else if (isNormalUser && isCommentOwner) {
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
