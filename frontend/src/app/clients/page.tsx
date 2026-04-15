'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientModal from '@/components/ClientModal';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/contexts/ToastContext';
import { Users, Plus, Search, Mail, Phone, Building2, Trash2, Edit, Eye, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const router = useRouter();
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all related projects.`)) {
      return;
    }

    try {
      await clientService.delete(id);
      setClients(clients.filter(c => c.id !== id));
      toast.success(`${name} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete client:', err);
      toast.error('Failed to delete client');
    }
  };

  const handleEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setEditingClient(undefined);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(undefined);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingClient(undefined);
    loadClients();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading clients...</p>
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
              <h1 className="text-4xl font-bold text-gray-900">Clients</h1>
              <p className="mt-2 text-lg text-gray-600">Manage your client portfolio</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              <Plus className="h-5 w-5" />
              <span>Add Client</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-blue-600">
                {clients.reduce((sum, c) => sum + (c._count?.projects || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">EU Clients</p>
              <p className="text-3xl font-bold text-emerald-600">
                {clients.filter(c => c.vatNumber).length}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 placeholder-gray-400 transition"
            />
          </div>

          {/* Client Grid */}
          {filteredClients.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Add your first client to start managing projects'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                    Add Your First Client
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="group bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{client.company}</span>
                        </p>
                      )}
                      {client.vatNumber && (
                        <p className="text-xs text-emerald-600 font-medium">
                          VAT: {client.vatNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={`/clients/${client.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={(e) => handleEdit(client, e)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(client.id, client.name);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      <span>{client._count?.projects || 0} {client._count?.projects === 1 ? 'project' : 'projects'}</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      View →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Modal */}
        {showModal && (
          <ClientModal
            client={editingClient}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}