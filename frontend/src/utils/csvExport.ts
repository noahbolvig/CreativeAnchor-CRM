// CSV Export Utility Functions

export interface ExportData {
  headers: string[];
  rows: any[][];
  filename: string;
}

// Convert data to CSV format
export function convertToCSV(data: ExportData): string {
  const { headers, rows } = data;
  
  // Escape CSV values
  const escapeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };
  
  // Create CSV header
  const csvHeaders = headers.map(escapeValue).join(',');
  
  // Create CSV rows
  const csvRows = rows.map(row => 
    row.map(escapeValue).join(',')
  ).join('\n');
  
  return `${csvHeaders}\n${csvRows}`;
}

// Download CSV file
export function downloadCSV(data: ExportData): void {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', data.filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Format date for CSV
export function formatDateForCSV(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return '';
  }
}

// Format currency for CSV
export function formatCurrencyForCSV(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return amount.toFixed(2);
}

// Export clients to CSV
export function exportClientsToCSV(clients: any[]): void {
  const data: ExportData = {
    headers: [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Website',
      'VAT Number',
      'Address',
      'City',
      'Postal Code',
      'Country',
      'Created Date',
    ],
    rows: clients.map(client => [
      client.name || '',
      client.email || '',
      client.phone || '',
      client.company || '',
      client.website || '',
      client.vatNumber || '',
      client.address || '',
      client.city || '',
      client.postalCode || '',
      client.country || '',
      formatDateForCSV(client.createdAt),
    ]),
    filename: `clients-export-${new Date().toISOString().split('T')[0]}.csv`,
  };
  
  downloadCSV(data);
}

// Export projects to CSV
export function exportProjectsToCSV(projects: any[]): void {
  const data: ExportData = {
    headers: [
      'Title',
      'Client',
      'Status',
      'Priority',
      'Budget',
      'Quoted Amount',
      'Start Date',
      'Deadline',
      'Completed Date',
      'Created Date',
    ],
    rows: projects.map(project => [
      project.title || '',
      project.client?.name || '',
      project.status || '',
      project.priority || '',
      formatCurrencyForCSV(project.budget),
      formatCurrencyForCSV(project.quotedAmount),
      formatDateForCSV(project.startDate),
      formatDateForCSV(project.deadline),
      formatDateForCSV(project.completedDate),
      formatDateForCSV(project.createdAt),
    ]),
    filename: `projects-export-${new Date().toISOString().split('T')[0]}.csv`,
  };
  
  downloadCSV(data);
}

// Export invoices to CSV
export function exportInvoicesToCSV(invoices: any[]): void {
  const data: ExportData = {
    headers: [
      'Invoice Number',
      'Project',
      'Client',
      'Amount',
      'Status',
      'Issue Date',
      'Due Date',
      'Paid Date',
      'Payment Method',
    ],
    rows: invoices.map(invoice => [
      invoice.invoiceNumber || '',
      invoice.project?.title || '',
      invoice.project?.client?.name || '',
      formatCurrencyForCSV(invoice.amount),
      invoice.status || '',
      formatDateForCSV(invoice.issueDate),
      formatDateForCSV(invoice.dueDate),
      formatDateForCSV(invoice.paidDate),
      invoice.paymentMethod || '',
    ]),
    filename: `invoices-export-${new Date().toISOString().split('T')[0]}.csv`,
  };
  
  downloadCSV(data);
}

// Export all data to multiple CSV files
export async function exportAllData(clients: any[], projects: any[], invoices: any[]): Promise<void> {
  exportClientsToCSV(clients);
  
  // Delay to avoid browser blocking multiple downloads
  await new Promise(resolve => setTimeout(resolve, 500));
  exportProjectsToCSV(projects);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  exportInvoicesToCSV(invoices);
}