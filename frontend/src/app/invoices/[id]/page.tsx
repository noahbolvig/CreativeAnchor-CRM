'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceService, Invoice } from '@/services/invoiceService';
import { emailService } from '@/services/emailService';
import { useToast } from '@/contexts/ToastContext';
import api from '@/services/api';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Printer, 
  Check, 
  Mail,
  Send,
  AlertCircle,
  Building2,
  Clock,
  MoreVertical,
  Download,
} from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const data = await invoiceService.getById(params.id as string);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      toast.error('Failed to load invoice');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    
    const confirmMessage = `Are you sure you want to delete invoice ${invoice.invoiceNumber}?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      await invoiceService.delete(invoice.id);
      toast.success('Invoice deleted successfully');
      router.push('/invoices');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete invoice');
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    setActionLoading(true);
    try {
      const updated = await invoiceService.updateStatus(invoice.id, 'PAID');
      setInvoice(updated);
      toast.success('Invoice marked as paid');
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: Invoice['status']) => {
    if (!invoice) return;
    
    setActionLoading(true);
    try {
      const updated = await invoiceService.updateStatus(invoice.id, status);
      setInvoice(updated);
      toast.success(`Invoice status updated to ${status}`);
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoice = () => {
    if (!invoice) return;
    
    if (!invoice.client?.email) {
      toast.error('This client has no email address. Please add one in the client details.');
      return;
    }

    if (!invoice.business?.businessName) {
      toast.error('Please set your business information in Settings before sending invoices.');
      return;
    }

    setShowEmailModal(true);
  };

  const handleSendInvoiceEmail = async () => {
    if (!invoice) return;
    
    setActionLoading(true);
    try {
      const result = await emailService.sendInvoiceEmail({ invoiceId: invoice.id });
      
      // Reload invoice to get updated status
      await loadInvoice();
      
      toast.success(result.message || `Invoice sent successfully to ${invoice.client?.email}`);
      setShowEmailModal(false);
    } catch (err: any) {
      console.error('Send invoice error:', err);
      toast.error(err.message || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = () => {
    if (!invoice) return;
    
    if (!invoice.client?.email) {
      toast.error('This client has no email address.');
      return;
    }

    setShowReminderModal(true);
  };

  const handleSendReminderEmail = async () => {
    if (!invoice) return;
    
    setActionLoading(true);
    try {
      const result = await emailService.sendPaymentReminder({ invoiceId: invoice.id });
      toast.success(result.message || `Payment reminder sent to ${invoice.client?.email}`);
      setShowReminderModal(false);
    } catch (err: any) {
      console.error('Send reminder error:', err);
      toast.error(err.message || 'Failed to send reminder');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      const token = localStorage.getItem('token');
      const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
      
      const response = await fetch(`${baseURL}/pdf/invoice/${invoice.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF');
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
    SENT: 'bg-blue-100 text-blue-700 border-blue-300',
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    OVERDUE: 'bg-red-100 text-red-700 border-red-300',
    CANCELLED: 'bg-gray-100 text-gray-700 border-gray-300',
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

  if (!invoice) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invoice not found</h2>
            <Link href="/invoices" className="text-blue-600 hover:text-blue-700">
              Back to invoices
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

 const subtotal = invoice.subtotal;
const vatAmount = invoice.vatAmount;
const total = invoice.amount;
const isReverseCharge = invoice.reverseCharge;
const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';

// Calculate VAT rate to display
const displayVatRate = (() => {
  if (invoice.vatRate) {
    return invoice.vatRate >= 1 ? invoice.vatRate : invoice.vatRate * 100;
  } else if (invoice.items && invoice.items.length > 0 && invoice.items[0].vatRate !== undefined) {
    return invoice.items[0].vatRate;
  } else if (subtotal > 0 && vatAmount > 0) {
    return (vatAmount / subtotal) * 100;
  }
  return 21;
})();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header - Hide on print */}
          <div className="print:hidden">
            {/* Back & Title */}
            <div className="flex items-center gap-3 mb-4">
              <Link href="/invoices" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                <p className="text-sm text-gray-600">
                  {invoice.client?.name || 'No client'}
                  {invoice.project?.title && ` • ${invoice.project.title}`}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-xs ${statusColors[invoice.status]}`}>
                {invoice.status}
              </div>
            </div>

            {/* Action Buttons - Streamlined */}
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              {/* Primary Actions */}
              <div className="flex gap-2 flex-1 flex-wrap">
                {/* Send Invoice - Primary CTA */}
                {invoice.status !== 'PAID' && (
                  <button 
                    onClick={handleSendInvoice}
                    disabled={actionLoading || !invoice.client?.email}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
                    title={!invoice.client?.email ? 'Client has no email address' : 'Send invoice via email'}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                )}

                {/* Send Reminder - Only for SENT/OVERDUE */}
                {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                  <button 
                    onClick={handleSendReminder}
                    disabled={actionLoading || !invoice.client?.email}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition disabled:opacity-50 font-medium text-sm border border-amber-300"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Remind</span>
                  </button>
                )}

                {/* Mark as Paid */}
                {invoice.status !== 'PAID' && (
                  <button 
                    onClick={handleMarkAsPaid}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition disabled:opacity-50 font-medium text-sm border border-emerald-300"
                  >
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Mark Paid</span>
                  </button>
                )}

                {/* Edit */}
                <Link 
                  href={`/invoices/${invoice.id}/edit`} 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              </div>

              {/* Secondary Actions - Dropdown */}
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
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActionsMenu(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {/* Status Change */}
                      {invoice.status !== 'PAID' && (
                        <div className="px-3 py-2 border-b border-gray-100">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Change Status</label>
                          <select
                            value={invoice.status}
                            onChange={(e) => {
                              handleStatusChange(e.target.value as Invoice['status']);
                              setShowActionsMenu(false);
                            }}
                            disabled={actionLoading}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 bg-white"
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="SENT">Sent</option>
                            <option value="PAID">Paid</option>
                            <option value="OVERDUE">Overdue</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          handleDownloadPDF();
                          setShowActionsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </button>

                      <button 
                        onClick={() => {
                          handlePrint();
                          setShowActionsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Printer className="h-4 w-4" />
                        Print Invoice
                      </button>

                      <button 
                        onClick={() => {
                          handleDelete();
                          setShowActionsMenu(false);
                        }}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Invoice
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Document */}
          <div className="invoice-document bg-white rounded-xl border-2 border-gray-200 p-8 sm:p-12 print:border-0 print:p-0 shadow-sm">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
              {/* Left: Invoice Title & Number */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-2xl font-semibold text-gray-900 mb-4">{invoice.invoiceNumber}</p>
                {/* Status badge - HIDDEN on print */}
                <div className={`inline-block px-4 py-2 rounded-lg border-2 font-semibold text-sm print:hidden ${statusColors[invoice.status]}`}>
                  {invoice.status}
                </div>
              </div>

              {/* Right: Business Info (From) */}
              <div className="text-left md:text-right">
                {invoice.business?.businessName ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{invoice.business.businessName}</p>
                    {invoice.business.address && <p className="text-gray-900">{invoice.business.address}</p>}
                    {(invoice.business.postalCode || invoice.business.city) && (
                      <p className="text-gray-900">
                        {invoice.business.postalCode} {invoice.business.city}
                      </p>
                    )}
                    {invoice.business.country && <p className="text-gray-900">{invoice.business.country}</p>}
                    {invoice.business.vatNumber && (
                      <p className="text-gray-900 font-semibold mt-2">VAT: {invoice.business.vatNumber}</p>
                    )}
                    {invoice.business.email && (
                      <p className="text-gray-600 mt-1">{invoice.business.email}</p>
                    )}
                  </>
                ) : (
                  <div className="text-gray-400 italic text-center md:text-right print:hidden">
                    <Building2 className="h-8 w-8 mx-auto md:ml-auto md:mr-0 mb-2" />
                    <p className="text-sm">No business info set</p>
                    <Link href="/settings" className="text-blue-600 hover:text-blue-700 text-xs underline">
                      Add in settings
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To & Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Bill To */}
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill To</p>
                {invoice.client ? (
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900">{invoice.client.name}</p>
                    {invoice.client.company && <p className="text-gray-900">{invoice.client.company}</p>}
                    {invoice.client.address && <p className="text-gray-900">{invoice.client.address}</p>}
                    {(invoice.client.postalCode || invoice.client.city) && (
                      <p className="text-gray-900">
                        {invoice.client.postalCode} {invoice.client.city}
                      </p>
                    )}
                    {invoice.client.country && <p className="text-gray-900">{invoice.client.country}</p>}
                    {invoice.client.email && <p className="text-gray-600 mt-2">{invoice.client.email}</p>}
                    {invoice.client.vatNumber && (
                      <p className="text-gray-900 font-semibold mt-2">VAT: {invoice.client.vatNumber}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No client information</p>
                )}
              </div>

              {/* Invoice Details */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl space-y-3 border-2 border-gray-200 print:bg-gray-50 print:border-gray-300">
                {invoice.project && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-700 font-medium">Project:</span>
                    <span className="font-semibold text-gray-900 text-right">{invoice.project.title}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Issue Date:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(invoice.issueDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Due Date:</span>
                    <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                      {isOverdue && ' (Overdue)'}
                    </span>
                  </div>
                )}
                {invoice.status === 'PAID' && invoice.paidDate && (
                  <div className="flex justify-between pt-2 border-t-2 border-emerald-300">
                    <span className="text-emerald-700 font-medium">Paid Date:</span>
                    <span className="font-semibold text-emerald-700">
                      {new Date(invoice.paidDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            {invoice.items && invoice.items.length > 0 ? (
              <div className="mb-12 overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-900">
                    <tr>
                      <th className="text-left py-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-center py-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="text-right py-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="text-right py-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                        VAT %
                      </th>
                      <th className="text-right py-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 print:hover:bg-transparent transition">
                        <td className="py-4 text-gray-900">{item.description}</td>
                        <td className="py-4 text-center text-gray-900">{item.quantity}</td>
                        <td className="py-4 text-right text-gray-900">€{item.unitPrice.toFixed(2)}</td>
                        <td className="py-4 text-right text-gray-600">{item.vatRate}%</td>
                        <td className="py-4 text-right font-semibold text-gray-900">
                          €{((item.amount || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mb-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-semibold text-gray-900">Service Provided</p>
                {invoice.project?.description && (
                  <p className="text-gray-700 mt-1">{invoice.project.description}</p>
                )}
              </div>
            )}

  {/* Totals */}
<div className="flex justify-end mb-12">
  <div className="w-full max-w-md space-y-3">
    <div className="flex justify-between text-gray-900 text-lg">
      <span className="font-medium">Subtotal:</span>
      <span className="font-semibold">€{subtotal.toFixed(2)}</span>
    </div>
    {isReverseCharge ? (
      <div className="flex justify-between text-gray-900">
        <span className="font-medium">VAT (0% - Reverse Charge):</span>
        <span className="font-semibold">€0.00</span>
      </div>
    ) : (
      <div className="flex justify-between text-gray-900">
        <span className="font-medium">
          VAT ({
            invoice.items && invoice.items.length > 0 && invoice.items[0].vatRate
              ? invoice.items[0].vatRate
              : subtotal > 0 && vatAmount > 0
              ? ((vatAmount / subtotal) * 100).toFixed(0)
              : '21'
          }%):
        </span>
        <span className="font-semibold">€{vatAmount.toFixed(2)}</span>
      </div>
    )}
    <div className="flex justify-between pt-4 border-t-2 border-gray-900 text-2xl font-bold text-gray-900">
      <span>Total:</span>
      <span>€{total.toFixed(2)}</span>
    </div>
    {isReverseCharge && (
      <p className="text-sm text-gray-600 italic pt-2">
        * Reverse charge applies - VAT to be accounted for by recipient
      </p>
    )}
  </div>
</div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200 print:bg-gray-50 print:border-gray-300">
                <p className="text-sm font-semibold text-blue-900 uppercase tracking-wider mb-3 print:text-gray-900">
                  Notes / Payment Terms
                </p>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
              </div>
            )}

            {/* Paid Badge - Only show when actually PAID */}
            {invoice.status === 'PAID' && invoice.paidDate && (
              <div className="mb-8 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl print:bg-green-50">
                <p className="text-emerald-800 font-semibold flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Paid on {new Date(invoice.paidDate).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200 text-center">
              <p className="text-gray-700 text-sm font-medium">Thank you for your business!</p>
              {invoice.business?.email && (
                <p className="text-gray-600 text-xs mt-2">
                  Questions? Contact us at {invoice.business.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email Confirmation Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Send Invoice via Email?</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                This will send invoice <strong>{invoice.invoiceNumber}</strong> to:
              </p>
              <p className="text-gray-900 font-semibold mb-4">
                {invoice.client?.email}
              </p>
              
              {invoice.status === 'DRAFT' && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  ℹ️ Invoice status will be updated to "SENT" after sending
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvoiceEmail}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                  {actionLoading ? 'Sending...' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Reminder Modal */}
        {showReminderModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Send Payment Reminder?</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                This will send a {isOverdue ? 'overdue' : 'friendly'} payment reminder for invoice{' '}
                <strong>{invoice.invoiceNumber}</strong> to:
              </p>
              <p className="text-gray-900 font-semibold mb-6">
                {invoice.client?.email}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReminderEmail}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50 shadow-lg"
                >
                  <Send className="h-4 w-4" />
                  {actionLoading ? 'Sending...' : 'Send Reminder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm 15mm;
            }
            
            /* Hide EVERYTHING except the invoice */
            body * {
              visibility: hidden;
            }
            
            /* Show only the invoice document and its children */
            .invoice-document,
            .invoice-document * {
              visibility: visible;
            }
            
            /* Position invoice at top of page */
            .invoice-document {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            
            /* Ensure colors print correctly */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Remove gradients for print */
            .bg-gradient-to-br {
              background: #f9fafb !important;
              border-color: #e5e7eb !important;
            }
            
            /* Clean backgrounds */
            .bg-blue-50 {
              background: #f9fafb !important;
            }
            
            .border-blue-200 {
              border-color: #e5e7eb !important;
            }
            
            .text-blue-900 {
              color: #111827 !important;
            }
            
            /* Prevent page breaks inside important sections */
            .invoice-header,
            .info-section,
            .items-table,
            .totals-section,
            .notes-section,
            .paid-stamp-section,
            .invoice-footer {
              page-break-inside: avoid;
            }
            
            /* Keep table rows together */
            .items-table tr {
              page-break-inside: avoid;
            }
            
            /* Remove rounded corners and shadows for print */
            .rounded-xl,
            .rounded-lg {
              border-radius: 0 !important;
            }
            
            .shadow-sm {
              box-shadow: none !important;
            }
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}