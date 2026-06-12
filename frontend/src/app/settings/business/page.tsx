'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Building2, Save, Eye, AlertCircle, CheckCircle2, Loader2, ArrowLeft, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';

export default function BusinessSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    vatNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Netherlands',
    email: '',
  });

  const euCountries = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
    'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
    'Slovenia', 'Spain', 'Sweden', 'United Kingdom', 'Switzerland', 'Norway'
  ];

  useEffect(() => {
    loadBusinessInfo();
  }, []);

  const loadBusinessInfo = async () => {
    try {
      const response = await api.get('/auth/profile');
      const userData = response.data;
      setFormData({
        businessName: userData.businessName || '',
        vatNumber: userData.vatNumber || '',
        address: userData.address || '',
        city: userData.city || '',
        postalCode: userData.postalCode || '',
        country: userData.country || 'Netherlands',
        email: userData.email || '',
      });
    } catch (err) {
      console.error('Failed to load business info:', err);
      toast.error('Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/auth/profile', formData);
      toast.success('Business settings saved successfully');
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update business settings');
    } finally {
      setSaving(false);
    }
  };

  const validateVatNumber = (vat: string) => {
    const vatPattern = /^[A-Z]{2}[A-Z0-9]+$/;
    return vatPattern.test(vat.replace(/\s/g, ''));
  };

  const isFormValid = formData.businessName &&
                      formData.vatNumber &&
                      formData.address &&
                      formData.city &&
                      formData.postalCode &&
                      formData.country;

  const vatValid = formData.vatNumber ? validateVatNumber(formData.vatNumber) : true;

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading business settings...</p>
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
                <p className="mt-1 text-gray-600">Information shown on all your invoices</p>
              </div>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View Invoices</span>
            </Link>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">🇪🇺 EU Invoice Requirements</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your VAT number and complete business address are <strong>legally required</strong> on all EU invoices.
                  This information will be displayed on every invoice you generate and must be accurate.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form - 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border-2 border-gray-200">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                    <p className="text-sm text-gray-600">Required for generating invoices</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    placeholder="Your Business Name B.V."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your official registered business name
                  </p>
                </div>

                {/* VAT Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      VAT Number * <span className="text-gray-500 font-normal">(BTW-nummer / Tax ID)</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-3 text-gray-900 bg-white border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                      formData.vatNumber && !vatValid
                        ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-500'
                        : 'border-gray-200 focus:ring-blue-200 focus:border-blue-500'
                    }`}
                    placeholder="NL123456789B01"
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      Format: Country code + number (e.g., NL123456789B01, DE123456789, FR12345678901)
                    </p>
                    {formData.vatNumber && !vatValid && (
                      <p className="text-xs text-amber-700 flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        VAT number format may be incorrect - please verify
                      </p>
                    )}
                    {formData.vatNumber && vatValid && (
                      <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Format looks good
                      </p>
                    )}
                  </div>
                </div>

                {/* Address Section */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Business Address</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Street Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                        placeholder="Keizersgracht 123"
                      />
                    </div>

                    {/* City & Postal Code */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                          placeholder="1015 CJ"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                          placeholder="Amsterdam"
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Country *
                      </label>
                      <select
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                      >
                        {euCountries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <button
                    type="submit"
                    disabled={saving || !isFormValid}
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
                        Save Business Settings
                      </>
                    )}
                  </button>
                  {!isFormValid && (
                    <p className="text-xs text-amber-600 mt-2 text-center">
                      All fields are required
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Preview - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6 sticky top-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900">Invoice Preview</h3>
                </div>

                <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm">
                  <div className="text-sm space-y-2">
                    <p className="text-lg font-bold text-gray-900 mb-3">
                      {formData.businessName || 'Your Business Name'}
                    </p>
                    <div className="text-gray-700 space-y-1">
                      <p>{formData.address || 'Street Address'}</p>
                      <p>
                        {formData.postalCode || 'Postal'} {formData.city || 'City'}
                      </p>
                      <p>{formData.country}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="font-semibold text-gray-900">
                        VAT: {formData.vatNumber || 'NL123456789B01'}
                      </p>
                    </div>
                    {formData.email && (
                      <p className="text-gray-600 text-xs pt-2">{formData.email}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                  This is exactly how your business information will appear on all generated invoices.
                </p>

                {isFormValid && (
                  <div className="mt-4 flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Ready to invoice!</span>
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