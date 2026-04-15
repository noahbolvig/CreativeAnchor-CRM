'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/contexts/ToastContext';
import { 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Palette,
  MoreVertical,
  MapPin,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  useEffect(() => {
    loadClient();
  }, [params.id]);

  const loadClient = async () => {
    try {
      const data = await clientService.getById(params.id as string);
      setClient(data);
    } catch (err) {
      console.error('Failed to load client:', err);
      toast.error('Failed to load client');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    if (!confirm(`Are you sure you want to delete ${client.name}? This will also delete all related projects and invoices.`)) {
      return;
    }

    try {
      await clientService.delete(client.id);
      toast.success(`${client.name} deleted successfully`);
      router.push('/clients');
    } catch (err) {
      console.error('Failed to delete client:', err);
      toast.error('Failed to delete client');
    }
  };

  const handleEmailClient = () => {
    if (!client?.email) {
      toast.error('This client has no email address');
      return;
    }
    // Open default email client
    window.location.href = `mailto:${client.email}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading client...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client not found</h2>
            <Link href="/clients" className="text-blue-600 hover:text-blue-700">
              Back to clients
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header - Streamlined */}
          <div>
            {/* Back & Title */}
            <div className="flex items-center gap-3 mb-4">
              <Link href="/clients" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                {client.company && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {client.company}
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex gap-2 flex-1 flex-wrap">
                {/* Email Client */}
                <button
                  onClick={handleEmailClient}
                  disabled={!client.email}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!client.email ? 'No email address' : 'Email client'}
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </button>

                {/* New Project */}
                <Link
                  href={`/projects/new?clientId=${client.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition font-medium text-sm border border-emerald-300"
                >
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">New Project</span>
                </Link>

                {/* Edit */}
                <Link
                  href={`/clients/${client.id}/edit`}
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
                        Delete Client
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                
                <div className="space-y-4">
                  {client.email && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <a 
                          href={`mailto:${client.email}`}
                          className="text-blue-600 hover:text-blue-700 text-sm break-all"
                        >
                          {client.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg flex-shrink-0">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <a 
                          href={`tel:${client.phone}`}
                          className="text-gray-900 hover:text-blue-600 text-sm"
                        >
                          {client.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {client.website && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                        <Globe className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600">Website</p>
                        <a 
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm break-all"
                        >
                          {client.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {(client.address || client.city || client.postalCode || client.country) && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <div className="text-gray-900 text-sm">
                          {client.address && <div>{client.address}</div>}
                          {(client.postalCode || client.city) && (
                            <div>{client.postalCode} {client.city}</div>
                          )}
                          {client.country && <div>{client.country}</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VAT Number */}
                  {client.vatNumber && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">VAT Number</p>
                        <p className="text-gray-900 text-sm font-mono">{client.vatNumber}</p>
                      </div>
                    </div>
                  )}

                  {client.notes && (
                    <div className="pt-4 border-t-2 border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{client.notes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Client since</p>
                    <p className="text-gray-900 text-sm">
                      {new Date(client.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Projects */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Projects {client.projects && client.projects.length > 0 && (
                      <span className="text-gray-500 font-normal text-base ml-2">
                        ({client.projects.length})
                      </span>
                    )}
                  </h2>
                  {client.projects && client.projects.length > 0 && (
                    <Link
                      href={`/projects?client=${client.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </Link>
                  )}
                </div>

                {client.projects && client.projects.length > 0 ? (
                  <div className="space-y-3">
                    {client.projects.map((project: any) => {
                      const statusColors: Record<string, string> = {
                        IDEA: 'bg-slate-100 text-slate-700 border-slate-200',
                        QUOTE: 'bg-blue-100 text-blue-700 border-blue-200',
                        APPROVED: 'bg-purple-100 text-purple-700 border-purple-200',
                        IN_PROGRESS: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        DELIVERED: 'bg-amber-100 text-amber-700 border-amber-200',
                        COMPLETED: 'bg-teal-100 text-teal-700 border-teal-200',
                      };

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition flex-shrink-0">
                              <Palette className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">{project.title}</p>
                              {project.description && (
                                <p className="text-sm text-gray-500 truncate">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-lg border flex-shrink-0 ${statusColors[project.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Palette className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-3">No projects yet</p>
                    <Link
                      href={`/projects/new?clientId=${client.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      <Palette className="h-4 w-4" />
                      Create First Project
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}