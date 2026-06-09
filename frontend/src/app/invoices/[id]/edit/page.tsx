'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { invoiceService } from '@/services/invoiceService';
import { projectService, Project } from '@/services/projectService';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Save, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  amount: number;
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    projectId: '',
    invoiceNumber: '',
    status: 'DRAFT' as any,
    notes: '',
    dueDate: '',
    vatRate: 21,
    reverseCharge: false,
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, vatRate: 21, amount: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, [params.id]);

  useEffect(() => {
    setItems(items.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice
    })));
  }, [items.map(i => `${i.quantity}-${i.unitPrice}`).join(',')]);

  const loadData = async () => {
    try {
      const [invoiceData, projectsData] = await Promise.all([
        invoiceService.getById(params.id as string),
        projectService.getAll(),
      ]);

      setProjects(projectsData);
      setFormData({
  projectId: invoiceData.projectId || '',
  invoiceNumber: invoiceData.invoiceNumber,
  status: invoiceData.status,
  notes: invoiceData.notes || '',
  dueDate: invoiceData.dueDate ? invoiceData.dueDate.split('T')[0] : '',
  vatRate: invoiceData.vatRate || 21,
  reverseCharge: invoiceData.reverseCharge || false,
});

      if (invoiceData.items && invoiceData.items.length > 0) {
        setItems(invoiceData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate || 21,
          amount: item.amount,
        })));
      } else {
        setItems([{
          description: invoiceData.project?.title || '',
          quantity: 1,
          unitPrice: invoiceData.amount,
          vatRate: 21,
          amount: invoiceData.amount,
        }]);
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
      toast.error('Failed to load invoice');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      vatRate: formData.vatRate, 
      amount: 0 
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    let vatAmount = 0;
    if (!formData.reverseCharge) {
      vatAmount = items.reduce((sum, item) => sum + (item.amount * (item.vatRate / 100)), 0);
    }
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (items.some(item => !item.description || item.unitPrice <= 0)) {
      toast.error('Please fill in all item details with valid prices');
      setSaving(false);
      return;
    }

    try {
      await invoiceService.update(params.id as string, {
        ...formData,
        amount: total,
        items: items.map((item, index) => ({
          ...item,
          order: index,
        })),
      });
      toast.success('Invoice updated successfully');
      router.push('/invoices/' + params.id);
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update invoice');
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
              <p className="text-gray-600">Loading invoice...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href={'/invoices/' + params.id} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Edit Invoice</h1>
              <p className="text-lg text-gray-600 mt-1">Update invoice details and line items</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Info Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Project <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} {p.client && `• ${p.client.name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Invoice Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      placeholder="INV-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="PAID">Paid</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Default VAT Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 21 })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      placeholder="21"
                    />
                    <p className="text-xs text-gray-500 mt-1">Applied to new line items</p>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <input
                        type="checkbox"
                        checked={formData.reverseCharge}
                        onChange={(e) => setFormData({ ...formData, reverseCharge: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">Reverse Charge</span>
                        <span className="text-xs text-gray-600">B2B cross-border (0% VAT)</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Line Items Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Line Items</h2>
                    <p className="text-sm text-gray-600 mt-1">Add products or services</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={addItem} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto border-2 border-gray-200 rounded-xl">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Description</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase w-24">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase w-32">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase w-24">VAT %</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase w-32">Amount</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              required
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium text-center bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.vatRate}
                              onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium text-right bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-gray-900">€{item.amount.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                              title={items.length === 1 ? 'Cannot remove last item' : 'Remove item'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Item {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          required
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        />
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Qty</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Price</label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">VAT%</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.vatRate}
                              onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                          <span className="text-xs font-medium text-gray-600">Amount:</span>
                          <span className="text-base font-bold text-gray-900">€{item.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6">
                <div className="space-y-3 max-w-md ml-auto">
                  <div className="flex justify-between text-gray-900">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-bold">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span className="font-semibold">
                      VAT {formData.reverseCharge ? '(0% - Reverse Charge)' : `(${formData.vatRate}%)`}:
                    </span>
                    <span className="font-bold">€{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-900 pt-3">
                    <span>Total:</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes / Payment Terms
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition resize-none"
                  placeholder="Payment terms, bank details, or additional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
                <Link
                  href={'/invoices/' + params.id}
                  className="flex-1 px-6 py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
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