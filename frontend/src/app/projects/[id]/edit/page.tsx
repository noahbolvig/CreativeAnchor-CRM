'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService, Project, ProjectStatus, Priority } from '@/services/projectService';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/contexts/ToastContext';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Building2, 
  Calendar, 
  DollarSign, 
  FileText 
} from 'lucide-react';
import Link from 'next/link';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    status: 'IDEA' as ProjectStatus,
    priority: 'MEDIUM' as Priority,
    budget: '',
    quotedAmount: '',
    startDate: '',
    deadline: '',
    creativeBrief: '',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [projectData, clientsData] = await Promise.all([
        projectService.getById(params.id as string),
        clientService.getAll(),
      ]);

      setClients(clientsData);
      setFormData({
        clientId: projectData.clientId,
        title: projectData.title,
        description: projectData.description || '',
        status: projectData.status,
        priority: projectData.priority,
        budget: projectData.budget?.toString() || '',
        quotedAmount: projectData.quotedAmount?.toString() || '',
        startDate: projectData.startDate ? projectData.startDate.split('T')[0] : '',
        deadline: projectData.deadline ? projectData.deadline.split('T')[0] : '',
        creativeBrief: projectData.creativeBrief || '',
      });
    } catch (err) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await projectService.update(params.id as string, {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        quotedAmount: formData.quotedAmount ? parseFloat(formData.quotedAmount) : undefined,
      });
      toast.success('Project updated successfully');
      router.push(`/projects/${params.id}`);
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update project');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading project...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${params.id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Edit Project</h1>
              <p className="text-lg text-gray-600 mt-1">Update project details and settings</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                </div>
                
                <div className="space-y-4">
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
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400 resize-none"
                      placeholder="Brief overview of the project..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      >
                        <option value="IDEA">Idea</option>
                        <option value="QUOTE">Quote</option>
                        <option value="APPROVED">Approved</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Timeline</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Financial</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Quoted Amount (€)
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
              </div>

              {/* Creative Brief */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Creative Brief</h2>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Brief Details
                  </label>
                  <textarea
                    value={formData.creativeBrief}
                    onChange={(e) => setFormData({ ...formData, creativeBrief: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400 resize-none"
                    placeholder="Detailed creative brief, requirements, deliverables, and any special notes..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
                <Link
                  href={`/projects/${params.id}`}
                  className="flex-1 px-6 py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}