'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceService, Invoice } from '@/services/invoiceService';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/contexts/ToastContext';
import { 
  Plus, 
  FileText, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Loader2,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import CreateInvoiceModal from '@/components/CreateInvoiceModal';

export default function InvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, clientsData] = await Promise.all([
        invoiceService.getAll(),
        clientService.getAll(),
      ]);
      setInvoices(invoicesData || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      toast.error('Failed to load invoices');
      setInvoices([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (deleteConfirm !== invoice.id) {
      setDeleteConfirm(invoice.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      await invoiceService.delete(invoice.id);
      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      setDeleteConfirm(null);
      toast.success(`Invoice ${invoice.invoiceNumber} deleted`);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      toast.error('Failed to delete invoice');
    }
  };

  const handleStatusUpdate = async (invoice: Invoice, newStatus: Invoice['status']) => {
    const oldStatus = invoice.status;

    // Optimistic update
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoice.id ? { ...inv, status: newStatus } : inv
      )
    );

    try {
      await invoiceService.updateStatus(invoice.id, newStatus);
      toast.success(`Invoice ${invoice.invoiceNumber} marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
      // Revert on error
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoice.id ? { ...inv, status: oldStatus } : inv
        )
      );
    }
  };

  // Calculate stats
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv?.amount || 0), 0);
  const paidAmount = invoices.filter(i => i?.status === 'PAID').reduce((sum, inv) => sum + (inv?.amount || 0), 0);
  const unpaidAmount = invoices.filter(i => i?.status === 'SENT' || i?.status === 'OVERDUE').reduce((sum, inv) => sum + (inv?.amount || 0), 0);
  const overdueCount = invoices.filter(i => i?.status === 'OVERDUE').length;

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    if (!invoice) return false;

    const matchesSearch = !searchQuery ||
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.client as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      name: 'Total Revenue',
      value: `€${totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`,
    },
    {
      name: 'Paid',
      value: `€${paidAmount.toLocaleString()}`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: `${invoices.filter(i => i?.status === 'PAID').length} paid`,
    },
    {
      name: 'Outstanding',
      value: `€${unpaidAmount.toLocaleString()}`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: `${invoices.filter(i => i?.status === 'SENT').length} pending`,
    },
    {
      name: 'Overdue',
      value: overdueCount.toString(),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: overdueCount === 0 ? 'All good!' : 'Needs attention',
    },
  ];

  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    PAID: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading invoices...</p>
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
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoices</h1>
              <p className="text-lg text-gray-600">
                Manage invoices and track payments
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={clients.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title={clients.length === 0 ? 'Add a client first' : 'Create new invoice'}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              <span>New Invoice</span>
            </button>
          </div>

          {/* Warning if no clients */}
          {clients.length === 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">No clients yet</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    You need to add at least one client before you can create invoices.
                  </p>
                  <Link
                    href="/clients/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium text-sm"
                  >
                    Add Your First Client →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className={`bg-white rounded-xl border-2 ${stat.borderColor} p-6 hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 ${stat.bgColor} rounded-lg ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 text-gray-900 font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition bg-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {(searchQuery || statusFilter !== 'ALL') && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {statusFilter !== 'ALL' && ` with status "${statusFilter}"`}
                </p>
              </div>
            )}
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
            {filteredInvoices.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Client</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Issue Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => {
                        const anyInvoice = invoice as any;
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {invoice.invoiceNumber || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                href={`/clients/${anyInvoice.client?.id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {anyInvoice.client?.name || 'No client'}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm">
                              {new Date(invoice.issueDate).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm">
                              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900">
                                €{(invoice.amount || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={invoice.status}
                                onChange={(e) => handleStatusUpdate(invoice, e.target.value as Invoice['status'])}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition ${
                                  statusConfig[invoice.status]?.color || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="PAID">Paid</option>
                                <option value="OVERDUE">Overdue</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <Link
                                  href={`/invoices/${invoice.id}`}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="View invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/invoices/${invoice.id}/edit`}
                                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="Edit invoice"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleDelete(invoice)}
                                  className={`p-2 rounded-lg transition ${
                                    deleteConfirm === invoice.id
                                      ? 'text-white bg-red-600 hover:bg-red-700'
                                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  title={deleteConfirm === invoice.id ? 'Click again to confirm' : 'Delete invoice'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => {
                    const anyInvoice = invoice as any;
                    return (
                      <div key={invoice.id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold text-gray-900">
                                {invoice.invoiceNumber}
                              </span>
                            </div>
                            <Link
                              href={`/clients/${anyInvoice.client?.id}`}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {anyInvoice.client?.name}
                            </Link>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${
                            statusConfig[invoice.status]?.color
                          }`}>
                            {statusConfig[invoice.status]?.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500">Issue:</span>
                            <span className="ml-1 text-gray-900">
                              {new Date(invoice.issueDate).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Due:</span>
                            <span className="ml-1 text-gray-900">
                              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-lg font-bold text-gray-900">
                            €{(invoice.amount || 0).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/invoices/${invoice.id}/edit`}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(invoice)}
                              className={`p-2 rounded-lg transition ${
                                deleteConfirm === invoice.id
                                  ? 'text-white bg-red-600'
                                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-4">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'ALL' ? 'No matching invoices' : 'No invoices yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Try adjusting your filters'
                    : clients.length === 0
                      ? 'Add a client first, then create your first invoice'
                      : 'Create your first invoice to get started'}
                </p>
                {!searchQuery && statusFilter === 'ALL' && clients.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                    Create First Invoice
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary Card */}
          {filteredInvoices.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Filtered Summary</h3>
                  <p className="text-sm text-gray-600">
                    Showing {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      €{filteredInvoices.reduce((sum, inv) => sum + (inv?.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="hidden sm:block w-px bg-gray-300" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Paid</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      €{filteredInvoices.filter(i => i?.status === 'PAID').reduce((sum, inv) => sum + (inv?.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="hidden sm:block w-px bg-gray-300" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                    <p className="text-2xl font-bold text-amber-600">
                      €{filteredInvoices.filter(i => i?.status === 'SENT' || i?.status === 'OVERDUE').reduce((sum, inv) => sum + (inv?.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateInvoiceModal
            clients={clients}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadData();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}