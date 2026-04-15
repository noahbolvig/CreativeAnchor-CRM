import api from './api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  projects?: any[];
  _count?: {
    projects: number;
  };
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  notes?: string;
  tags?: string[];
}

export const clientService = {
  async getAll(): Promise<Client[]> {
    const response = await api.get('/clients');
    return response.data.clients;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data.client;
  },

  async create(data: CreateClientData): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data.client;
  },

  async update(id: string, data: Partial<CreateClientData>): Promise<Client> {
    const response = await api.put(`/clients/${id}`, data);
    return response.data.client;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
