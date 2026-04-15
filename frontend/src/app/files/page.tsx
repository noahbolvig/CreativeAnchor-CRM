'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService, Project } from '@/services/projectService';
import { fileService, File as ProjectFile } from '@/services/fileService';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Image,
  FileCode,
  Film,
  Archive,
  File as FileIcon,
  Calendar,
  User,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface FileWithProject extends ProjectFile {
  project?: Project;
}

export default function FilesPage() {
  const router = useRouter();
  const [allFiles, setAllFiles] = useState<FileWithProject[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos' | 'other'>('all');

  useEffect(() => {
    loadAllFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, filterType, allFiles]);

  const loadAllFiles = async () => {
    try {
      // Get all projects with their files
      const projects = await projectService.getAll();
      
      // Fetch files for each project
      const filesPromises = projects.map(async (project) => {
        try {
          const files = await fileService.getProjectFiles(project.id);
          return files.map(file => ({ ...file, project }));
        } catch (error) {
          console.error(`Failed to load files for project ${project.id}:`, error);
          return [];
        }
      });

      const filesArrays = await Promise.all(filesPromises);
      const files = filesArrays.flat().sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      setAllFiles(files);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = allFiles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.project?.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(file => {
        const type = file.fileType.toLowerCase();
        switch (filterType) {
          case 'images':
            return type.startsWith('image/');
          case 'documents':
            return type.includes('pdf') || type.includes('document') || type.includes('word');
          case 'videos':
            return type.startsWith('video/');
          case 'other':
            return !type.startsWith('image/') && !type.startsWith('video/') && 
                   !type.includes('pdf') && !type.includes('document');
          default:
            return true;
        }
      });
    }

    setFilteredFiles(filtered);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(fileId);
      setAllFiles(allFiles.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Film;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
    return FileIcon;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType.startsWith('video/')) return 'Video';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('document')) return 'Document';
    return 'File';
  };

  const totalSize = allFiles.reduce((sum, file) => sum + file.fileSize, 0);
  const filesByType = {
    images: allFiles.filter(f => f.fileType.startsWith('image/')).length,
    documents: allFiles.filter(f => f.fileType.includes('pdf') || f.fileType.includes('document')).length,
    videos: allFiles.filter(f => f.fileType.startsWith('video/')).length,
    other: allFiles.filter(f => 
      !f.fileType.startsWith('image/') && 
      !f.fileType.startsWith('video/') && 
      !f.fileType.includes('pdf') && 
      !f.fileType.includes('document')
    ).length,
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">All Files</h1>
            <p className="mt-2 text-lg text-gray-600">
              {allFiles.length} files across all projects
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{allFiles.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Images</p>
              <p className="text-2xl font-bold text-blue-600">{filesByType.images}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Documents</p>
              <p className="text-2xl font-bold text-emerald-600">{filesByType.documents}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Videos</p>
              <p className="text-2xl font-bold text-purple-600">{filesByType.videos}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {(totalSize / 1024 / 1024).toFixed(0)} MB
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
<div className="relative flex-1">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input
    type="text"
    placeholder="Search files, projects, or clients..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full pl-10 pr-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
  />
</div>

              {/* Type Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('images')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    filterType === 'images'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Images
                </button>
                <button
                  onClick={() => setFilterType('documents')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    filterType === 'documents'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setFilterType('videos')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    filterType === 'videos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Videos
                </button>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.fileType);
                const latestRevision = file.revisions?.[0];
                
                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-lg transition-all"
                  >
                    {/* File Icon & Name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-3 bg-blue-50 rounded-lg flex-shrink-0">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {file.originalName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getFileTypeLabel(file.fileType)} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    {/* Project & Client Info */}
                    <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                      {file.project && (
                        <Link
                          href={`/projects/${file.project.id}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
                        >
                          <FolderOpen className="h-4 w-4" />
                          <span className="truncate">{file.project.title}</span>
                        </Link>
                      )}
                      {file.project?.client && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="truncate">{file.project.client.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Version & Status */}
                    {latestRevision && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500">
                          v{latestRevision.versionNumber}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {file.project && (
                        <Link
                          href={`/projects/${file.project.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          View Project
                        </Link>
                      )}
                  <button
  onClick={async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/files/file/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  }}
  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
  title="Download"
>
  <Download className="h-4 w-4" />
</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' ? 'No files found' : 'No files yet'}
              </h2>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Upload files to your projects to see them here'}
              </p>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Go to Projects
              </Link>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
