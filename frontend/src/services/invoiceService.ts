import api from './api';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  vatRate: number;
  order: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    company?: string;
    vatNumber?: string;
    country?: string;
  };
  projectId?: string;
  project?: {
    id: string;
    title: string;
    client?: {
      id: string;
      name: string;
    };
  };
  amount: number;
  subtotal: number;
  vatRate?: number;
  vatAmount: number;
  reverseCharge: boolean;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface CreateInvoiceData {
  clientId: string;
  projectId?: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate?: string;
  status?: InvoiceStatus;
  reverseCharge?: boolean;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    order: number;
  }[];
}

export interface UpdateInvoiceData {
  clientId?: string;
  projectId?: string;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  status?: InvoiceStatus;
  reverseCharge?: boolean;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    order: number;
  }[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalRevenue: number;
  unpaidAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    company?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  projectId?: string;
  project?: {
    id: string;
    title: string;
    client?: {
      id: string;
      name: string;
    };
  };
  business?: {
    businessName?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  amount: number;
  subtotal: number;
  vatRate?: number;
  vatAmount: number;
  reverseCharge: boolean;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// INVOICE SERVICE
// ============================================

class InvoiceService {
  private readonly baseUrl = '/invoices';

  /**
   * Get all invoices
   */
  async getAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    try {
      console.log('📄 Fetching all invoices...', filters);
      
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
      const response = await api.get<Invoice[]>(url);
      
      console.log(`✅ Fetched ${response.data.length} invoices`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch invoices:', error);
      this.handleError(error, 'fetch invoices');
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getById(id: string): Promise<Invoice> {
    try {
      if (!id) {
        throw new Error('Invoice ID is required');
      }

      console.log('📄 Fetching invoice:', id);
      const response = await api.get<Invoice>(`${this.baseUrl}/${id}`);
      
      console.log('✅ Invoice fetched:', response.data.invoiceNumber);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch invoice:', error);
      this.handleError(error, 'fetch invoice');
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  async create(data: CreateInvoiceData): Promise<Invoice> {
    try {
      console.log('📝 Creating invoice...');
      
      // Validate data
      this.validateCreateData(data);

      // Ensure defaults
      const invoiceData = {
        ...data,
        status: data.status || 'DRAFT',
        reverseCharge: data.reverseCharge || false,
      };

      console.log('Sending invoice data:', {
        clientId: invoiceData.clientId,
        itemCount: invoiceData.items.length,
        reverseCharge: invoiceData.reverseCharge,
      });

      const response = await api.post<Invoice>(this.baseUrl, invoiceData);
      
      console.log('✅ Invoice created:', response.data.invoiceNumber);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create invoice:', error.response?.data || error);
      this.handleError(error, 'create invoice');
      throw error;
    }
  }

  /**
   * Update existing invoice
   */
  async update(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    try {
      if (!id) {
        throw new Error('Invoice ID is required');
      }

      console.log('📝 Updating invoice:', id);

      // Validate if items are included
      if (data.items) {
        this.validateItems(data.items);
      }

      const response = await api.put<Invoice>(`${this.baseUrl}/${id}`, data);
      
      console.log('✅ Invoice updated:', response.data.invoiceNumber);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update invoice:', error);
      this.handleError(error, 'update invoice');
      throw error;
    }
  }

  /**
   * Update invoice status only
   */
  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    try {
      if (!id) {
        throw new Error('Invoice ID is required');
      }

      if (!this.isValidStatus(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      console.log(`📝 Updating invoice ${id} status to: ${status}`);
      const response = await api.patch<Invoice>(`${this.baseUrl}/${id}/status`, { status });
      
      console.log('✅ Status updated');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update invoice status:', error);
      this.handleError(error, 'update invoice status');
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  async delete(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Invoice ID is required');
      }

      console.log('🗑️ Deleting invoice:', id);
      await api.delete(`${this.baseUrl}/${id}`);
      
      console.log('✅ Invoice deleted');
    } catch (error: any) {
      console.error('❌ Failed to delete invoice:', error);
      this.handleError(error, 'delete invoice');
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  async getStats(): Promise<InvoiceStats> {
    try {
      const invoices = await this.getAll();
      
      return {
        total: invoices.length,
        draft: invoices.filter(i => i.status === 'DRAFT').length,
        sent: invoices.filter(i => i.status === 'SENT').length,
        paid: invoices.filter(i => i.status === 'PAID').length,
        overdue: invoices.filter(i => i.status === 'OVERDUE').length,
        cancelled: invoices.filter(i => i.status === 'CANCELLED').length,
        totalRevenue: invoices
          .filter(i => i.status === 'PAID')
          .reduce((sum, i) => sum + i.amount, 0),
        unpaidAmount: invoices
          .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
          .reduce((sum, i) => sum + i.amount, 0),
      };
    } catch (error: any) {
      console.error('❌ Failed to get invoice stats:', error);
      throw error;
    }
  }

  /**
   * Calculate invoice totals from items
   */
  calculateTotals(items: InvoiceItem[], reverseCharge: boolean = false): {
    subtotal: number;
    vatAmount: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    let vatAmount = 0;
    if (!reverseCharge) {
      vatAmount = items.reduce((sum, item) => {
        const itemAmount = item.quantity * item.unitPrice;
        return sum + (itemAmount * (item.vatRate / 100));
      }, 0);
    }

    const total = subtotal + vatAmount;

    return { subtotal, vatAmount, total };
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  private validateCreateData(data: CreateInvoiceData): void {
    if (!data.clientId) {
      throw new Error('Client is required');
    }

    if (!data.issueDate) {
      throw new Error('Issue date is required');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one item is required');
    }

    this.validateItems(data.items);
  }

  private validateItems(items: CreateInvoiceData['items']): void {
    items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        throw new Error(`Item ${index + 1}: Description is required`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }

      if (item.unitPrice < 0) {
        throw new Error(`Item ${index + 1}: Unit price cannot be negative`);
      }

      if (item.vatRate < 0) {
        throw new Error(`Item ${index + 1}: VAT rate cannot be negative`);
      }
    });
  }

  private isValidStatus(status: string): status is InvoiceStatus {
    return ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status);
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleError(error: any, action: string): void {
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.error || error.response.data?.message || 'Unknown error';

      switch (status) {
        case 400:
          console.error(`❌ Bad request when trying to ${action}:`, message);
          break;
        case 401:
          console.error(`❌ Unauthorized - please login again`);
          break;
        case 403:
          console.error(`❌ Forbidden - you don't have permission to ${action}`);
          break;
        case 404:
          console.error(`❌ Invoice not found`);
          break;
        case 500:
          console.error(`❌ Server error when trying to ${action}:`, message);
          break;
        default:
          console.error(`❌ Error ${status} when trying to ${action}:`, message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error(`❌ No response from server when trying to ${action}`);
      console.error('Is the backend running on http://localhost:5001?');
    } else {
      // Error in request setup
      console.error(`❌ Error setting up request to ${action}:`, error.message);
    }
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const invoiceService = new InvoiceService();