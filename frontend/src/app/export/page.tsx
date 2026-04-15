'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { invoiceService } from '@/services/invoiceService';
import { 
  exportClientsToCSV, 
  exportProjectsToCSV, 
  exportInvoicesToCSV,
  exportAllData 
} from '@/utils/csvExport';
import { Download, Users, Palette, FileText, Database, CheckCircle } from 'lucide-react';

export default function ExportPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, projectsData, invoicesData] = await Promise.all([
        clientService.getAll(),
        projectService.getAll(),
        invoiceService.getAll(),
      ]);
      setClients(clientsData);
      setProjects(projectsData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string, exportFn: () => void) => {
    setExporting(type);
    try {
      exportFn();
      // Show success briefly
      setTimeout(() => setExporting(null), 1500);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(null);
    }
  };

  const handleExportAll = async () => {
    setExporting('all');
    try {
      await exportAllData(clients, projects, invoices);
      setTimeout(() => setExporting(null), 2000);
    } catch (error) {
      console.error('Export all failed:', error);
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'clients',
      name: 'Clients',
      description: 'Export all client contacts and information',
      icon: Users,
      count: clients.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      exportFn: () => exportClientsToCSV(clients),
    },
    {
      id: 'projects',
      name: 'Projects',
      description: 'Export all projects with details and dates',
      icon: Palette,
      count: projects.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      exportFn: () => exportProjectsToCSV(projects),
    },
    {
      id: 'invoices',
      name: 'Invoices',
      description: 'Export all invoices and payment records',
      icon: FileText,
      count: invoices.length,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      exportFn: () => exportInvoicesToCSV(invoices),
    },
  ];

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Export Data</h1>
            <p className="mt-2 text-lg text-gray-600">Download your data as CSV files</p>
          </div>

          {/* Export All */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="h-8 w-8" />
                  <h2 className="text-2xl font-bold">Export Everything</h2>
                </div>
                <p className="text-blue-100 mb-4">
                  Download all your clients, projects, and invoices at once
                </p>
                <p className="text-sm text-blue-100">
                  {clients.length} clients • {projects.length} projects • {invoices.length} invoices
                </p>
              </div>
              <button
                onClick={handleExportAll}
                disabled={exporting === 'all'}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium shadow-lg disabled:opacity-50"
              >
                {exporting === 'all' ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Exported!
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Export All
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Individual Exports */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Or export individually:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isExporting = exporting === option.id;
                
                return (
                  <div
                    key={option.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all"
                  >
                    <div className={`p-3 ${option.bgColor} rounded-lg ${option.color} w-fit mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {option.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {option.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        {option.count} records
                      </span>
                      <button
                        onClick={() => handleExport(option.id, option.exportFn)}
                        disabled={isExporting || option.count === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Exported!
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Export
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">📋 About CSV Exports</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet app</li>
              <li>• All dates are formatted as YYYY-MM-DD for compatibility</li>
              <li>• Files are named with today's date (e.g., clients-export-2026-02-26.csv)</li>
              <li>• Your data never leaves your browser - exports happen locally</li>
              <li>• Use this to backup your data or migrate to another system</li>
            </ul>
          </div>

          {/* Empty State */}
          {clients.length === 0 && projects.length === 0 && invoices.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No data to export yet</h2>
              <p className="text-gray-600 mb-6">
                Add some clients, projects, or invoices first, then come back to export your data
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}