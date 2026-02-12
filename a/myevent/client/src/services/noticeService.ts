// client/src/services/noticeService.ts
import { apiRequest } from '@/lib/queryClient';

export interface Notice {
  _id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  emailNotificationSent: boolean;
  emailSentAt?: string;
}

export const noticeService = {
  // Get all notices
  async getNotices(): Promise<Notice[]> {
    return apiRequest('GET', '/api/notices');
  },

  // Create a new notice (superadmin only)
  async createNotice(data: { title: string; content: string }): Promise<{ notice: Notice; success: boolean }> {
    return apiRequest('POST', '/api/notices', data);
  },

  // Update a notice (superadmin only)
  async updateNotice(
    id: string,
    data: Partial<{ title: string; content: string; isPinned: boolean }>
  ): Promise<{ notice: Notice; success: boolean }> {
    return apiRequest('PATCH', `/api/notices/${id}`, data);
  },

  // Delete a notice (superadmin only)
  async deleteNotice(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest('DELETE', `/api/notices/${id}`);
  },

  // Send notice to all users (superadmin only)
  async sendNoticeEmail(id: string): Promise<{ success: boolean; message: string; sentCount: number; failedCount: number }> {
    return apiRequest('POST', `/api/notices/${id}/send-email`);
  }
};
