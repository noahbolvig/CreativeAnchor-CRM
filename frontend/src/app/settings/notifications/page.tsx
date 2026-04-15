'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Save, Bell, Mail, Calendar, FileText, TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

export default function NotificationsSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    deadlineReminders: true,
    invoiceReminders: true,
    projectUpdates: true,
    weeklySummary: true,
    emailNotifications: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/auth/notification-settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      // Use defaults if endpoint doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/auth/notification-settings', settings);
      toast.success('Notification preferences saved');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationOptions = [
    {
      key: 'emailNotifications' as keyof typeof settings,
      icon: Mail,
      title: 'Email Notifications',
      description: 'Master switch for all email notifications',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      important: true,
    },
    {
      key: 'deadlineReminders' as keyof typeof settings,
      icon: Calendar,
      title: 'Deadline Reminders',
      description: 'Get notified 3 days before project deadlines',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      key: 'invoiceReminders' as keyof typeof settings,
      icon: FileText,
      title: 'Invoice Reminders',
      description: 'Alerts for overdue and upcoming invoices',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      key: 'projectUpdates' as keyof typeof settings,
      icon: Bell,
      title: 'Project Updates',
      description: 'Notifications when project statuses change',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'weeklySummary' as keyof typeof settings,
      icon: TrendingUp,
      title: 'Weekly Summary',
      description: 'Overview of your week every Monday morning',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading preferences...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
              <p className="mt-1 text-gray-600">Manage your email preferences and reminders</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border-2 border-gray-200">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Email Preferences</h2>
                  <p className="text-sm text-gray-600">Choose what updates you want to receive</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {notificationOptions.map((option) => {
                const Icon = option.icon;
                const isEnabled = settings[option.key];
                
                return (
                  <div
                    key={option.key}
                    className={`flex items-center justify-between p-5 border-2 rounded-xl transition-all ${
                      option.important 
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2.5 ${option.bgColor} rounded-lg flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${option.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{option.title}</p>
                          {option.important && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-300">
                              Master
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => toggle(option.key)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all flex-shrink-0 ml-4 ${
                        isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              {/* Info Box */}
              {!settings.emailNotifications && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email notifications are disabled. Enable the master switch to receive any emails.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t-2 border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">📬 About Notifications</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All emails are sent to your registered email address</li>
                  <li>• You can change these preferences at any time</li>
                  <li>• Important account security emails cannot be disabled</li>
                  <li>• Notifications help you stay on top of deadlines and payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}