'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService, Project } from '@/services/projectService';
import { fileService, File as ProjectFile, Revision } from '@/services/fileService';
import { useToast } from '@/contexts/ToastContext';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  FileText,
  User,
  Building2,
  Upload,
  Download,
  MoreVertical,
  Palette,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [projectData, filesData] = await Promise.all([
        projectService.getById(params.id as string),
        fileService.getProjectFiles(params.id as string),
      ]);
      setProject(projectData);
      setFiles(filesData);
    } catch (err) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    if (!confirm(`Are you sure you want to delete "${project.title}"? This will also delete all files. This action cannot be undone.`)) {
      return;
    }

    try {
      await projectService.delete(project.id);
      toast.success(`${project.title} deleted successfully`);
      router.push('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Failed to delete project');
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      await fileService.deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      toast.success('File deleted successfully');
    } catch (err) {
      console.error('Failed to delete file:', err);
      toast.error('Failed to delete file');
    }
  };

  const statusColors: Record<string, string> = {
    IDEA: 'bg-slate-100 text-slate-800 border-slate-300',
    QUOTE: 'bg-blue-100 text-blue-800 border-blue-300',
    APPROVED: 'bg-purple-100 text-purple-800 border-purple-300',
    IN_PROGRESS: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    DELIVERED: 'bg-amber-100 text-amber-800 border-amber-300',
    COMPLETED: 'bg-teal-100 text-teal-800 border-teal-300',
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-amber-100 text-amber-700 border-amber-200',
    URGENT: 'bg-red-100 text-red-700 border-red-200',
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading project...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
            <Link href="/projects" className="text-blue-600 hover:text-blue-700">
              Back to projects
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'COMPLETED';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header - Streamlined */}
          <div>
            {/* Back & Title */}
            <div className="flex items-center gap-3 mb-4">
              <Link href="/projects" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">{project.title}</h1>
                  <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${statusColors[project.status]}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${priorityColors[project.priority]}`}>
                    {project.priority}
                  </span>
                </div>
                {project.client && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                    <User className="h-3.5 w-3.5" />
                    <Link href={`/clients/${project.client.id}`} className="hover:text-blue-600 transition">
                      {project.client.name}
                    </Link>
                    {project.client.company && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{project.client.company}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex gap-2 flex-1 flex-wrap">
                {/* Upload File */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                {/* Edit */}
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              </div>

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  title="More actions"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>

                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowActionsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description & Brief */}
              {(project.description || project.creativeBrief) && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
                  
                  {project.description && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.description}</p>
                    </div>
                  )}

                  {project.creativeBrief && (
                    <div className={project.description ? 'pt-4 border-t-2 border-gray-200' : ''}>
                      <p className="text-sm font-medium text-gray-600 mb-2">Creative Brief</p>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.creativeBrief}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Files & Revisions */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Files & Revisions
                    {files.length > 0 && (
                      <span className="text-gray-500 font-normal text-base ml-2">
                        ({files.length})
                      </span>
                    )}
                  </h2>
                </div>
                
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <FileCard 
                        key={file.id} 
                        file={file} 
                        onDelete={() => handleFileDelete(file.id, file.originalName)}
                        onUpdate={loadData}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No files uploaded yet</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                    >
                      <Upload className="h-4 w-4" />
                      Upload First File
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Info */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Information</h2>
                
                <div className="space-y-4">
                  {project.deadline && (
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${isOverdue ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Deadline</p>
                        <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {new Date(project.deadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {isOverdue && (
                          <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {project.startDate && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg flex-shrink-0">
                        <Clock className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Start Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(project.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.quotedAmount && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg flex-shrink-0">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Quoted Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          €{project.quotedAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.budget && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                        <DollarSign className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Budget</p>
                        <p className="text-sm text-gray-900">
                          €{project.budget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadFileModal
            projectId={project.id}
            projectTitle={project.title}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              loadData();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// File Card Component
function FileCard({ 
  file, 
  onDelete,
  onUpdate 
}: { 
  file: ProjectFile; 
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const latestRevision = file.revisions?.[0];

  const revisionStatusColors: Record<string, string> = {
    PENDING: 'bg-blue-100 text-blue-700 border-blue-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    CHANGES_REQUESTED: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const handleDownload = async () => {
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
    
    toast.success('File downloaded successfully');
  } catch (err) {
    console.error('Download failed:', err);
    toast.error('Failed to download file');
  }
};

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{file.originalName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {(file.fileSize / 1024 / 1024).toFixed(2)} MB • 
            {' '}Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
            {latestRevision && ` • v${latestRevision.versionNumber}`}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowRevisionModal(true)}
            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="New Revision"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {latestRevision && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${revisionStatusColors[latestRevision.status]}`}>
            {latestRevision.status.replace('_', ' ')}
          </span>
          {latestRevision.comment && (
            <span className="text-xs text-gray-500 truncate">
              {latestRevision.comment}
            </span>
          )}
        </div>
      )}

      {showRevisionModal && (
        <UploadRevisionModal
          file={file}
          onClose={() => setShowRevisionModal(false)}
          onSuccess={() => {
            setShowRevisionModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

// Upload File Modal Component
function UploadFileModal({
  projectId,
  projectTitle,
  onClose,
  onSuccess,
}: {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);

    try {
      await fileService.uploadFile(projectId, file, comment);
      toast.success(`${file.name} uploaded successfully`);
      onSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload File</h2>
        <p className="text-gray-600 mb-4">to {projectTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select File *
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              required
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder-gray-400 resize-none"
              placeholder="Add a note about this file..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Upload Revision Modal Component
function UploadRevisionModal({
  file,
  onClose,
  onSuccess,
}: {
  file: ProjectFile;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [newFile, setNewFile] = useState<globalThis.File | null>(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const latestVersion = file.revisions?.[0]?.versionNumber || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) return;

    setUploading(true);

    try {
      await fileService.uploadRevision(file.id, newFile, comment);
      toast.success(`Revision v${latestVersion + 1} uploaded successfully`);
      onSuccess();
    } catch (err: any) {
      console.error('Upload revision error:', err);
      toast.error(err.response?.data?.error || 'Failed to upload revision');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload New Revision</h2>
        <p className="text-gray-600 mb-1">{file.originalName}</p>
        <p className="text-sm text-gray-500 mb-4">
          Current: v{latestVersion} → New: v{latestVersion + 1}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select File *
            </label>
            <input
              type="file"
              onChange={(e) => setNewFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              required
            />
            {newFile && (
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {newFile.name} ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              What changed? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-gray-900 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder-gray-400 resize-none"
              placeholder="Describe the changes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !newFile}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {uploading ? 'Uploading...' : 'Upload Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}