import api from './api';

export interface File {
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: string;
  uploadedAt: string;
  revisions?: Revision[];
}

export interface Revision {
  id: string;
  projectId: string;
  fileId: string;
  versionNumber: number;
  comment?: string;
  status: RevisionStatus;
  clientFeedback?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export type RevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export const fileService = {
  async getProjectFiles(projectId: string): Promise<File[]> {
    const response = await api.get('/files/project/' + projectId);
    return response.data.files;
  },

  async uploadFile(projectId: string, file: globalThis.File, comment?: string, category?: string): Promise<File> {
    const formData = new FormData();
    formData.append('file', file);
    if (comment) formData.append('comment', comment);
    if (category) formData.append('category', category);

    const response = await api.post('/files/project/' + projectId + '/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.file;
  },

  async uploadRevision(fileId: string, file: globalThis.File, comment?: string): Promise<Revision> {
    const formData = new FormData();
    formData.append('file', file);
    if (comment) formData.append('comment', comment);

    const response = await api.post('/files/file/' + fileId + '/revision', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.revision;
  },

  async updateRevisionStatus(
    revisionId: string, 
    status: RevisionStatus, 
    clientFeedback?: string
  ): Promise<Revision> {
    const response = await api.patch('/files/revision/' + revisionId + '/status', {
      status,
      clientFeedback,
    });
    return response.data.revision;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete('/files/file/' + fileId);
  },

  getDownloadUrl(fileId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return baseUrl + '/api/files/file/' + fileId + '/download';
  },

  getFileUrl(fileUrl: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return baseUrl + fileUrl;
  },
};
