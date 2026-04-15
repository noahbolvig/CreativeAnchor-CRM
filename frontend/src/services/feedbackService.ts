import api from './api';

export interface Feedback {
  id: string;
  userId: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  priority: Priority;
  status: FeedbackStatus;
  votes: number;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type FeedbackCategory = 
  | 'FEATURE_REQUEST'
  | 'BUG_REPORT'
  | 'IMPROVEMENT'
  | 'UI_UX'
  | 'PERFORMANCE'
  | 'OTHER';

export type FeedbackStatus = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateFeedbackData {
  category: FeedbackCategory;
  title: string;
  description: string;
  priority?: Priority;
}

export const feedbackService = {
  async getAll(): Promise<Feedback[]> {
    const response = await api.get('/feedback');
    return response.data.feedbacks;
  },

  async getById(id: string): Promise<Feedback> {
    const response = await api.get('/feedback/' + id);
    return response.data;
  },

  async create(data: CreateFeedbackData): Promise<Feedback> {
    const response = await api.post('/feedback', data);
    return response.data.feedback;
  },

  async vote(id: string): Promise<Feedback> {
    const response = await api.post('/feedback/' + id + '/vote');
    return response.data.feedback;
  },

  async delete(id: string): Promise<void> {
    await api.delete('/feedback/' + id);
  },
};