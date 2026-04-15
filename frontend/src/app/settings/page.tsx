'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User, Building2, Bell, Shield, ChevronRight, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();

  // Check completion status
  const hasBusinessInfo = user?.businessName && user?.vatNumber && user?.address;
  const hasFullProfile = user?.firstName && user?.lastName;

  const settingsSections = [
    {
      id: 'profile',
      name: 'Profile Settings',
      description: 'Name and personal information',
      icon: User,
      href: '/settings/profile',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      completed: hasFullProfile,
    },
    {
      id: 'business',
      name: 'Business Settings',
      description: 'VAT number, address, and company details',
      icon: Building2,
      href: '/settings/business',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badge: 'Required for invoices',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      completed: hasBusinessInfo,
      important: true,
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Email preferences and reminders',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      completed: true,
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Password and account security',
      icon: Shield,
      href: '/settings/security',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      completed: true,
    },
    {
      id: 'export',
      name: 'Export Data',
      description: 'Download all your data as CSV',
      icon: Download,
      href: '/export',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      completed: true,
    },
  ];

  const completedSections = settingsSections.filter(s => s.completed).length;
  const totalSections = settingsSections.length;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-lg text-gray-600">Manage your account and business preferences</p>
          </div>

          {/* Account Overview Card */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : 'Welcome!'}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">{user?.email}</p>
                  {user?.businessName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{user.businessName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Progress */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Setup</span>
                  <span className="text-lg font-bold text-gray-900">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {completedSections} of {totalSections} sections complete
                </p>
              </div>
            </div>
          </div>

          {/* Warning if business info not set */}
          {!hasBusinessInfo && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Business information required</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    You need to set up your business information before you can send invoices. EU law requires VAT numbers and complete addresses on all invoices.
                  </p>
                  <Link 
                    href="/settings/business"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium text-sm shadow-sm"
                  >
                    Complete Business Settings →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`group bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all ${
                    section.important && !section.completed 
                      ? 'border-amber-300 bg-amber-50/30' 
                      : section.borderColor || 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${section.bgColor} rounded-lg ${section.color} relative`}>
                      <Icon className="h-6 w-6" />
                      {section.completed && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {section.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {section.badge && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        section.badgeColor || 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {section.badge}
                      </span>
                    )}
                    {!section.completed && section.important && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                        Action needed
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Having trouble with your settings? Check our documentation or contact support.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://docs.claude.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                View Docs
              </a>
              <a 
                href="mailto:support@creativeanchor.com"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}