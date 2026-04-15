'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService, Project, ProjectStatus } from '@/services/projectService';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/contexts/ToastContext';
import { Plus, Palette, Calendar, DollarSign, AlertCircle, Briefcase, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, clientsData] = await Promise.all([
        projectService.getAll(),
        clientService.getAll(),
      ]);
      setProjects(projectsData);
      setClients(clientsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const columns: { id: ProjectStatus; title: string; bgColor: string; textColor: string }[] = [
    { id: 'IDEA', title: 'Ideas', bgColor: 'bg-slate-50', textColor: 'text-slate-700' },
    { id: 'QUOTE', title: 'Quote', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    { id: 'APPROVED', title: 'Approved', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
    { id: 'IN_PROGRESS', title: 'In Progress', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { id: 'DELIVERED', title: 'Delivered', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    { id: 'COMPLETED', title: 'Completed', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find(p => p.id === event.active.id);
    setActiveProject(project || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) return;

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;

    const project = projects.find(p => p.id === projectId);
    if (!project || project.status === newStatus) return;

    // Optimistic update
    const oldStatus = project.status;
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );

    try {
      await projectService.updateStatus(projectId, newStatus, 0);
      toast.success(`${project.title} moved to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Failed to update project status:', err);
      toast.error('Failed to update project status');
      // Revert on error
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === projectId ? { ...p, status: oldStatus } : p
        )
      );
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Projects</h1>
              <p className="mt-2 text-lg text-gray-600">Visual pipeline for your creative work</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={clients.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={clients.length === 0 ? 'Add a client first' : 'Create new project'}
            >
              <Plus className="h-5 w-5" />
              <span>New Project</span>
            </button>
          </div>

          {/* Empty State */}
          {projects.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">
                  {clients.length === 0 
                    ? 'Add a client first, then create your first project'
                    : 'Create your first project to start tracking work'}
                </p>
                {clients.length > 0 ? (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                    Create First Project
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/clients/new')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                    Add Your First Client
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Kanban Board */}
          {projects.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {columns.map((column) => (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    projects={getProjectsByStatus(column.id)}
                    onProjectClick={(projectId) => router.push(`/projects/${projectId}`)}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeProject ? (
                  <div className="rotate-2">
                    <ProjectCard project={activeProject} isDragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Add Project Modal */}
        {showAddModal && (
          <AddProjectModal
            clients={clients}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadData();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  projects,
  onProjectClick,
}: {
  column: { id: ProjectStatus; title: string; bgColor: string; textColor: string };
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      status: column.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${column.bgColor} border-2 border-gray-200 rounded-xl p-4 min-h-[500px]`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-semibold ${column.textColor}`}>{column.title}</h2>
        <span className="text-sm text-gray-600 bg-white px-2.5 py-0.5 rounded-full font-medium border border-gray-200">
          {projects.length}
        </span>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project}
            onClick={() => onProjectClick(project.id)}
          />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Project Card Component
function ProjectCard({ 
  project, 
  isDragging = false,
  onClick
}: { 
  project: Project; 
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: project.id,
    data: {
      type: 'project',
      project,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-amber-100 text-amber-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  const isOverdue = project.deadline && new Date(project.deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isSortableDragging && onClick) {
          onClick();
        }
      }}
      className={`bg-white rounded-lg p-4 border-2 border-gray-200 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all ${
        isDragging ? 'shadow-xl border-blue-400' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
          {project.title}
        </h3>
        <Palette className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {project.client && (
        <p className="text-xs text-gray-600 mb-3 font-medium">
          {project.client.name}
        </p>
      )}

      {project.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[project.priority]}`}>
          {project.priority}
        </span>

        {project.deadline && (
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}

        {project.quotedAmount && (
          <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
            <DollarSign className="h-3 w-3" />
            €{project.quotedAmount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

// Add Project Modal Component
function AddProjectModal({
  clients,
  onClose,
  onSuccess,
}: {
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    status: 'IDEA' as ProjectStatus,
    priority: 'MEDIUM' as any,
    quotedAmount: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await projectService.create({
        ...formData,
        quotedAmount: formData.quotedAmount ? parseFloat(formData.quotedAmount) : undefined,
      });
      toast.success(`${formData.title} created successfully`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create project error:', err);
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold text-gray-900">New Project</h2>
          <p className="text-sm text-gray-600 mt-1">Create a new project for a client</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Client <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Project Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                placeholder="Brand Identity Design"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400 resize-none"
                placeholder="Brief overview of the project..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Quote (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quotedAmount}
                  onChange={(e) => setFormData({ ...formData, quotedAmount: e.target.value })}
                  className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Deadline <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}