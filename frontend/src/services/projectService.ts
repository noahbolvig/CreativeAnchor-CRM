import api from './api';

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  budget?: number;
  quotedAmount?: number;
  finalAmount?: number;
  startDate?: string;
  deadline?: string;
  completedDate?: string;
  creativeBrief?: string;
  position: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    company?: string;
  };
  _count?: {
    files: number;
    revisions: number;
  };
}

export type ProjectStatus = 
  | 'IDEA'
  | 'QUOTE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateProjectData {
  clientId: string;
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  budget?: number;
  quotedAmount?: number;
  deadline?: string;
  startDate?: string;
  creativeBrief?: string;
}

export const projectService = {
  async getAll(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data.projects;
  },

  async getById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data.project;
  },

  async create(data: CreateProjectData): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data.project;
  },

  async update(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project;
  },

  async updateStatus(id: string, status: ProjectStatus, position: number): Promise<Project> {
    const response = await api.patch(`/projects/${id}/status`, { status, position });
    return response.data.project;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
