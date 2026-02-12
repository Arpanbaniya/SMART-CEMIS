import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ChatMessage } from '../models/ChatMessage';
import { User } from '../models/User';
import { requireAdmin } from '../middleware/requireAuth';
import { Server } from 'socket.io';

export function createChatroomRoutes(io: Server) {
  const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/chatroom');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images, PDF, Word documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// GET all messages
router.get('/messages', requireAdmin, async (req: any, res: Response) => {
  try {
    const messages = await ChatMessage.find()
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST new message
router.post('/messages', requireAdmin, async (req: any, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Fetch user from database
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const username = user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || 'Anonymous';

    const newMessage = await ChatMessage.create({
      userId: user._id.toString(),
      username: username,
      userRole: user.role,
      content: content.trim(),
      files: [],
      isDeleted: false
    });

    // Broadcast to all connected clients in real-time
    io.to('chatroom').emit('newMessage', newMessage);

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error: any) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// POST file upload with message
router.post(
  '/upload',
  requireAdmin,
  upload.array('files', 5),
  async (req: any, res: Response) => {
    try {
      const { content } = req.body;
      const files = req.files || [];

      if (!content || content.trim().length === 0) {
        // Clean up uploaded files if no content
        files.forEach(file => {
          const filePath = path.join(uploadDir, file.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      // Fetch user from database
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Convert uploaded files to ChatFile format
      const chatFiles = files.map(file => ({
        fileName: file.filename,
        originalFileName: file.originalname,
        filePath: `/api/chatroom/files/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      }));

      const username = user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.firstName || 'Anonymous';

      const newMessage = await ChatMessage.create({
        userId: user._id.toString(),
        username: username,
        userRole: user.role,
        content: content.trim(),
        files: chatFiles,
        isDeleted: false
      });

      // Broadcast to all connected clients in real-time
      io.to('chatroom').emit('newMessage', newMessage);

      res.status(201).json({
        success: true,
        message: newMessage
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: 'Failed to upload message with files' });
    }
  }
);

// DELETE message (SUPERADMIN can delete any, STUDENTADMIN only own)
router.delete('/messages/:messageId', requireAdmin, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check permissions
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isSuperAdmin = user.role === 'super_admin';
    const isOwner = message.userId.toString() === user._id.toString();

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Mark as deleted instead of removing
    message.isDeleted = true;
    message.deletedBy = user._id.toString();
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// GET file download
router.get('/files/:filename', requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // Security: prevent directory traversal
    if (!filePath.startsWith(uploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

  return router;
}

export default createChatroomRoutes;
