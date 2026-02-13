"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const mongoose_1 = require("mongoose");
const chatFileSchema = new mongoose_1.Schema({
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });
const chatMessageSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    userRole: { type: String, enum: ['student_admin', 'super_admin'], required: true },
    content: { type: String, required: true },
    files: [chatFileSchema],
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: String },
    deletedAt: { type: Date }
}, { timestamps: true });
exports.ChatMessage = (0, mongoose_1.model)('ChatMessage', chatMessageSchema);
//# sourceMappingURL=ChatMessage.js.map