import { apiRequest } from '@/lib/queryClient';

const API_BASE_URL = '/api/chatroom';

export interface ChatMessage {
  _id?: string;
  userId: string;
  username: string;
  userRole: 'student_admin' | 'super_admin';
  content: string;
  files?: ChatFile[];
  isDeleted: boolean;
  deletedBy?: string;
  deletedAt?: Date;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatFile {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

class ChatroomService {
  /**
   * Get all chatroom messages
   */
  async getMessages(): Promise<ChatMessage[]> {
    try {
      const response = await apiRequest('GET', `${API_BASE_URL}/messages`);
      return response.messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a text message
   */
  async sendMessage(content: string): Promise<ChatMessage> {
    try {
      const response = await apiRequest('POST', `${API_BASE_URL}/messages`, { content });
      return response.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Send message with file attachments
   */
  async sendMessageWithFiles(content: string, files: File[]): Promise<ChatMessage> {
    try {
      const formData = new FormData();
      formData.append('content', content);
      files.forEach(file => {
        formData.append('files', file);
      });

      // Use fetch for file upload since apiRequest might not handle FormData well
      const response = await fetch(`${window.location.origin}${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error uploading message with files:', error);
      throw error;
    }
  }

  /**
   * Delete message (SUPERADMIN can delete any, STUDENTADMIN only own)
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiRequest('DELETE', `${API_BASE_URL}/messages/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Download a file
   */
  downloadFile(filePath: string, originalFileName: string): void {
    const link = document.createElement('a');
    link.href = `${window.location.origin}${filePath}`;
    link.download = originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get file preview URL
   */
  getFileUrl(filePath: string): string {
    return `${window.location.origin}${filePath}`;
  }
}

export const chatroomService = new ChatroomService();
