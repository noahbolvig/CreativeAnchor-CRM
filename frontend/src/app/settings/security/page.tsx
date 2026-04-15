'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Save, Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

export default function SecuritySettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Password change error:', err);
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const passwordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-amber-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength(formData.newPassword);
  const passwordsMatch = formData.confirmPassword && formData.newPassword === formData.confirmPassword;
  const isValid = formData.currentPassword && formData.newPassword.length >= 8 && passwordsMatch;

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
              <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
              <p className="mt-1 text-gray-600">Password and account security</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border-2 border-gray-200">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-600">Keep your account secure</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    required
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Password strength:</span>
                      <span className={`text-xs font-semibold ${
                        strength.label === 'Weak' ? 'text-red-600' :
                        strength.label === 'Fair' ? 'text-amber-600' :
                        strength.label === 'Good' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            i <= strength.strength ? strength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Password requirements:</p>
                  <div className="space-y-1">
                    {[
                      { met: formData.newPassword.length >= 8, text: 'At least 8 characters' },
                      { met: /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword), text: 'Upper and lowercase letters' },
                      { met: /\d/.test(formData.newPassword), text: 'At least one number' },
                      { met: /[^A-Za-z0-9]/.test(formData.newPassword), text: 'At least one special character' },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={req.met ? 'text-green-700 font-medium' : 'text-gray-600'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-12 py-3 text-gray-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                      formData.confirmPassword && !passwordsMatch
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {formData.confirmPassword && (
                  <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                    passwordsMatch ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {passwordsMatch ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" />
                        Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t-2 border-gray-200">
                <button
                  type="submit"
                  disabled={saving || !isValid}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Tips */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">🔒 Security Best Practices</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Use a unique password you don't use anywhere else</li>
                  <li>• Consider using a password manager</li>
                  <li>• Change your password if you suspect unauthorized access</li>
                  <li>• Never share your password with anyone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}