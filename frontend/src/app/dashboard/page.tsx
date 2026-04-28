'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { projectService, Project } from '@/services/projectService';
import { clientService, Client } from '@/services/clientService';
import { invoiceService, Invoice } from '@/services/invoiceService';
import { 
  Users, 
  Palette, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Target,
  Zap,
  Plus,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, clientsData, invoicesData] = await Promise.all([
        projectService.getAll(),
        clientService.getAll(),
        invoiceService.getAll(),
      ]);
      setProjects(projectsData || []);
      setClients(clientsData || []);
      setInvoices(invoicesData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data');
      setProjects([]);
      setClients([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate revenue by month (last 6 months)
  const getMonthlyRevenue = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthRevenue = (invoices || [])
        .filter(inv => {
          if (!inv || !inv.issueDate) return false;
          const invDate = new Date(inv.paidDate || inv.issueDate);
          return invDate.getMonth() === date.getMonth() && 
                 invDate.getFullYear() === date.getFullYear() &&
                 inv.status === 'PAID';
        })
        .reduce((sum, inv) => sum + (inv?.amount || 0), 0);
      
      months.push({
        month: monthName,
        revenue: monthRevenue,
      });
    }
    
    return months;
  };

  // Project status distribution
  const getProjectStatusData = () => {
    const statusMap = {
      'IDEA': { label: 'Ideas', color: '#64748B' },
      'QUOTE': { label: 'Quote', color: '#3B82F6' },
      'APPROVED': { label: 'Approved', color: '#8B5CF6' },
      'IN_PROGRESS': { label: 'In Progress', color: '#10B981' },
      'DELIVERED': { label: 'Delivered', color: '#F59E0B' },
      'COMPLETED': { label: 'Completed', color: '#14B8A6' },
    };
    
    const statusCounts: Record<string, number> = {};
    (projects || []).forEach(p => {
      if (p && p.status) {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      }
    });
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: statusMap[status as keyof typeof statusMap]?.label || status,
        value: count,
        color: statusMap[status as keyof typeof statusMap]?.color || '#64748B',
      }))
      .filter(item => item.value > 0);
  };

  const monthlyData = getMonthlyRevenue();
  const projectStatusData = getProjectStatusData();

  // Calculate stats
  const activeClients = (clients || []).length;
  const inProgressProjects = (projects || []).filter(p => p?.status === 'IN_PROGRESS').length;
  const totalRevenue = (invoices || []).filter(i => i?.status === 'PAID').reduce((sum, inv) => sum + (inv?.amount || 0), 0);
  const unpaidAmount = (invoices || []).filter(i => i?.status === 'SENT' || i?.status === 'OVERDUE').reduce((sum, inv) => sum + (inv?.amount || 0), 0);
  const overdueInvoices = (invoices || []).filter(i => i?.status === 'OVERDUE').length;

  // Calculate growth
  const thisMonthRevenue = monthlyData[5]?.revenue || 0;
  const lastMonthRevenue = monthlyData[4]?.revenue || 0;
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;

  // Recent active projects
  const recentProjects = (projects || [])
    .filter(p => p && p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Upcoming deadlines
  const upcomingDeadlines = (projects || [])
    .filter(p => p && p.deadline && p.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)
    .map(p => {
      const deadline = new Date(p.deadline!);
      const today = new Date();
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntil < 0;
      const isUrgent = daysUntil >= 0 && daysUntil <= 3;
      
      return {
        project: p.title,
        client: p.client?.name || 'Unknown',
        date: daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        daysUntil,
        urgent: isUrgent,
        overdue: isOverdue,
        projectId: p.id,
      };
    });

  const stats = [
    { 
      name: 'Total Revenue', 
      value: `€${totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      change: revenueGrowth !== 0 ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%` : 'No change',
      changeLabel: 'vs last month',
      trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      link: '/invoices',
    },
    { 
      name: 'Active Clients', 
      value: activeClients.toString(), 
      icon: Users, 
      change: `${(clients || []).filter(c => c?._count?.projects && c._count.projects > 0).length} with projects`,
      changeLabel: 'engaged',
      trend: 'neutral',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      link: '/clients',
    },
    { 
      name: 'In Progress', 
      value: inProgressProjects.toString(), 
      icon: Target, 
      change: `${(projects || []).length} total projects`,
      changeLabel: 'active pipeline',
      trend: 'neutral',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      link: '/projects',
    },
    { 
      name: 'Outstanding', 
      value: `€${unpaidAmount.toLocaleString()}`, 
      icon: AlertCircle, 
      change: overdueInvoices > 0 ? `${overdueInvoices} overdue` : 'All on track',
      changeLabel: overdueInvoices > 0 ? 'needs attention' : 'status',
      trend: overdueInvoices > 0 ? 'down' : 'neutral',
      color: overdueInvoices > 0 ? 'text-red-600' : 'text-amber-600',
      bgColor: overdueInvoices > 0 ? 'bg-red-50' : 'bg-amber-50',
      borderColor: overdueInvoices > 0 ? 'border-red-200' : 'border-amber-200',
      link: '/invoices',
    },
  ];

  const statusColors: Record<string, string> = {
    IDEA: 'bg-slate-100 text-slate-700 border-slate-200',
    QUOTE: 'bg-blue-100 text-blue-700 border-blue-200',
    APPROVED: 'bg-purple-100 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DELIVERED: 'bg-amber-100 text-amber-700 border-amber-200',
    COMPLETED: 'bg-teal-100 text-teal-700 border-teal-200',
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
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
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName || 'there'} 👋
              </h1>
              <p className="text-lg text-gray-600">
                Here's what's happening with your business
              </p>
            </div>
            <Link
              href="/invoices/new"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm whitespace-nowrap"
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              <span>New Invoice</span>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              
              return (
                <Link
                  key={stat.name}
                  href={stat.link}
                  className={`group bg-white rounded-xl border-2 ${stat.borderColor} p-6 hover:shadow-lg transition-all duration-200`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 ${stat.bgColor} rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {stat.trend !== 'neutral' && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.changeLabel}</p>
                </Link>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Revenue Overview</h2>
                  <p className="text-sm text-gray-600 mt-1">Last 6 months paid invoices</p>
                </div>
                {revenueGrowth !== 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% this month
                    </span>
                  </div>
                )}
              </div>
              {monthlyData.some(m => m.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                      tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                    />
                    <Tooltip 
  contentStyle={{ 
    backgroundColor: '#fff', 
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    padding: '12px',
  }}
  formatter={(value: any) => {
    const numValue = typeof value === 'number' ? value : 0;
    return [`€${numValue.toLocaleString()}`, 'Revenue'];
  }}
  labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
/>
                    <Bar 
                      dataKey="revenue" 
                      fill="#3B82F6" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <DollarSign className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">No revenue yet</p>
                  <p className="text-xs mt-1">Create and send your first invoice</p>
                </div>
              )}
            </div>

            {/* Project Distribution */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Project Status</h2>
                <p className="text-sm text-gray-600 mt-1">{projects.length} total projects</p>
              </div>
              {projectStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '8px 12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {projectStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-700 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Target className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">No projects yet</p>
                  <Link href="/projects" className="text-xs text-blue-600 hover:text-blue-700 mt-2">
                    Create your first project →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Active Projects - 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="px-6 py-4 border-b-2 border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
                  <p className="text-sm text-gray-600 mt-0.5">{recentProjects.length} in progress</p>
                </div>
                <Link 
                  href="/projects" 
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 group"
                >
                  View all
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="p-6">
                {recentProjects.length > 0 ? (
                  <div className="space-y-3">
                    {recentProjects.map((project) => {
                      const daysUntilDeadline = project.deadline 
                        ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                      const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0;

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="group block p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition">
                                {project.title}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                {project.client?.name || 'No client'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                              {daysUntilDeadline !== null && (
                                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                  isUrgent ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  {daysUntilDeadline === 0 ? 'Today' : daysUntilDeadline === 1 ? 'Tomorrow' : `${daysUntilDeadline}d`}
                                </span>
                              )}
                              <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${statusColors[project.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <Palette className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No active projects</p>
                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Create Project
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines - 1 column */}
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Deadlines</h2>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">Upcoming due dates</p>
              </div>
              <div className="p-6">
                {upcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((item, index) => (
                      <Link
                        key={index}
                        href={`/projects/${item.projectId}`}
                        className={`block p-3 rounded-xl border-2 transition-all ${
                          item.overdue
                            ? 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400' 
                            : item.urgent 
                            ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            item.overdue ? 'bg-red-500' : item.urgent ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm mb-1 truncate">{item.project}</p>
                            <p className="text-xs text-gray-600 mb-2">{item.client}</p>
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-semibold ${
                                item.overdue ? 'text-red-600' : item.urgent ? 'text-amber-600' : 'text-gray-600'
                              }`}>
                                {item.overdue ? `${Math.abs(item.daysUntil)}d overdue` : item.date}
                              </p>
                              {item.overdue && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full border border-red-200">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No upcoming deadlines</p>
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