'use client';

import { useState, useEffect } from 'react';
import { clientService, Client } from '@/services/clientService';
import { invoiceService } from '@/services/invoiceService';
import { useToast } from '@/contexts/ToastContext';
import { X, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  amount: number;
}

interface CreateInvoiceModalProps {
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInvoiceModal({ clients, onClose, onSuccess }: CreateInvoiceModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'DRAFT' as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    reverseCharge: false,
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, vatRate: 21, amount: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      vatRate: 21, 
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
    const numValue = field === 'quantity' || field === 'unitPrice' || field === 'vatRate' 
      ? (typeof value === 'string' ? parseFloat(value) : value) || 0
      : value;
    
    newItems[index] = { 
      ...newItems[index], 
      [field]: numValue 
    };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    let vatAmount = 0;
    if (!formData.reverseCharge) {
      vatAmount = items.reduce((sum, item) => {
        const itemAmount = item.quantity * item.unitPrice;
        return sum + (itemAmount * (item.vatRate / 100));
      }, 0);
    }
    
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.clientId) {
      toast.error('Please select a client');
      setLoading(false);
      return;
    }

    if (items.some(item => !item.description.trim())) {
      toast.error('Please add a description for all items');
      setLoading(false);
      return;
    }

    if (items.some(item => item.unitPrice <= 0)) {
      toast.error('All items must have a price greater than 0');
      setLoading(false);
      return;
    }

    try {
      const invoiceData = {
        clientId: formData.clientId,
        invoiceNumber: formData.invoiceNumber || undefined,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        reverseCharge: formData.reverseCharge,
        notes: formData.notes || undefined,
        items: items.map((item, index) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          order: index,
        })),
      };

      await invoiceService.create(invoiceData);
      toast.success('Invoice created successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Invoice creation error:', err);
      toast.error(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
            <p className="text-sm text-gray-600 mt-1">Generate a new invoice with line items</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white rounded-lg transition disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Client & Basic Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {client.name} {client.company ? `• ${client.company}` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedClient?.vatNumber && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      VAT: {selectedClient.vatNumber}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                    placeholder="Auto-generated if empty"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for auto-generation</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Issue Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
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

                <div className="flex items-center pt-8">
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

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
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

              {/* Desktop View */}
              <div className="hidden lg:block space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Description <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Quantity <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Price <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            VAT %
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.vatRate}
                            onChange={(e) => updateItem(index, 'vatRate', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                          />
                        </div>
                        <div className="col-span-1 flex items-end justify-end pb-2">
                          <div className="text-right">
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                              Amount
                            </label>
                            <span className="text-sm font-bold text-gray-900">
                              €{item.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title={items.length === 1 ? 'Cannot remove last item' : 'Remove item'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile View */}
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
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Description *</label>
                        <input
                          type="text"
                          required
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Price *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">VAT%</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.vatRate}
                            onChange={(e) => updateItem(index, 'vatRate', e.target.value)}
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
              <h3 className="text-sm font-bold text-gray-700 mb-4">Invoice Summary</h3>
              <div className="space-y-3 max-w-md ml-auto">
                <div className="flex justify-between text-gray-900">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-bold">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span className="font-semibold">
                    VAT {formData.reverseCharge ? '(0% - Reverse Charge)' : ''}:
                  </span>
                  <span className="font-bold">€{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-900 pt-3">
                  <span>Total:</span>
                  <span className="text-blue-600">€{total.toFixed(2)}</span>
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
                className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400 resize-none"
                placeholder="Payment terms, bank details, or additional notes..."
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
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
              'Create Invoice'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}