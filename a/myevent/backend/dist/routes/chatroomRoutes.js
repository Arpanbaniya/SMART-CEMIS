"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatroomRoutes = createChatroomRoutes;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ChatMessage_1 = require("../models/ChatMessage");
const User_1 = require("../models/User");
const requireAuth_1 = require("../middleware/requireAuth");
function createChatroomRoutes(io) {
    const router = express_1.default.Router();
    // Configure multer for file uploads
    const uploadDir = path_1.default.join(__dirname, '../../uploads/chatroom');
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    });
    const upload = (0, multer_1.default)({
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
            }
            else {
                cb(new Error('Invalid file type'));
            }
        }
    });
    // GET all messages
    router.get('/messages', requireAuth_1.requireAdmin, async (req, res) => {
        try {
            const messages = await ChatMessage_1.ChatMessage.find()
                .sort({ createdAt: 1 })
                .lean();
            res.json({
                success: true,
                messages,
                count: messages.length
            });
        }
        catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    });
    // POST new message
    router.post('/messages', requireAuth_1.requireAdmin, async (req, res) => {
        try {
            const { content } = req.body;
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: 'Message cannot be empty' });
            }
            // Fetch user from database
            const user = await User_1.User.findById(req.session.userId);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            const username = user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || 'Anonymous';
            const newMessage = await ChatMessage_1.ChatMessage.create({
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
        }
        catch (error) {
            console.error('Error creating message:', error);
            res.status(500).json({ error: 'Failed to create message' });
        }
    });
    // POST file upload with message
    router.post('/upload', requireAuth_1.requireAdmin, upload.array('files', 5), async (req, res) => {
        try {
            const { content } = req.body;
            const files = req.files || [];
            if (!content || content.trim().length === 0) {
                // Clean up uploaded files if no content
                files.forEach(file => {
                    const filePath = path_1.default.join(uploadDir, file.filename);
                    if (fs_1.default.existsSync(filePath))
                        fs_1.default.unlinkSync(filePath);
                });
                return res.status(400).json({ error: 'Message cannot be empty' });
            }
            // Fetch user from database
            const user = await User_1.User.findById(req.session.userId);
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
            const newMessage = await ChatMessage_1.ChatMessage.create({
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
        }
        catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).json({ error: 'Failed to upload message with files' });
        }
    });
    // DELETE message (SUPERADMIN can delete any, STUDENTADMIN only own)
    router.delete('/messages/:messageId', requireAuth_1.requireAdmin, async (req, res) => {
        try {
            const { messageId } = req.params;
            const message = await ChatMessage_1.ChatMessage.findById(messageId);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }
            // Check permissions
            const user = await User_1.User.findById(req.session.userId);
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
        }
        catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ error: 'Failed to delete message' });
        }
    });
    // GET file download
    router.get('/files/:filename', requireAuth_1.requireAdmin, (req, res) => {
        try {
            const { filename } = req.params;
            const filePath = path_1.default.join(uploadDir, filename);
            // Security: prevent directory traversal
            if (!filePath.startsWith(uploadDir)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }
            res.download(filePath);
        }
        catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).json({ error: 'Failed to download file' });
        }
    });
    return router;
}
exports.default = createChatroomRoutes;
//# sourceMappingURL=chatroomRoutes.js.map