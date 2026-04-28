'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { clientService, Client } from '@/services/clientService';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Save, Loader2, Building2, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';

const EU_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
  'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 
  'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
  'Spain', 'Sweden'
];

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    vatNumber: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    loadClient();
  }, [params.id]);

  const loadClient = async () => {
    try {
      const data = await clientService.getById(params.id as string);
      setFormData({
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        vatNumber: data.vatNumber || '',
        address: data.address || '',
        city: data.city || '',
        postalCode: data.postalCode || '',
        country: data.country || '',
      });
    } catch (err) {
      console.error('Failed to load client:', err);
      toast.error('Failed to load client');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await clientService.update(params.id as string, formData);
      toast.success('Client updated successfully');
      router.push(`/clients/${params.id}`);
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.error || 'Failed to update client');
    } finally {
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
              <p className="text-gray-600">Loading client...</p>
            </div>
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
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${params.id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Edit Client</h1>
              <p className="text-lg text-gray-600 mt-1">Update client information</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                        placeholder="+45 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                        placeholder="Acme Corp"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">Address</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                      placeholder="Margrethevej 6"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                        placeholder="Hellerup"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                        placeholder="2900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                    >
                      <option value="">Select country</option>
                      <optgroup label="EU Countries">
                        {EU_COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Other">
                        <option value="Denmark">Denmark</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Other">Other</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* EU VAT Information */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-900">EU VAT Information</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Optional, for B2B invoicing and reverse charge</p>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 font-medium bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition placeholder:text-gray-400"
                    placeholder="DK12345678"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Format: Country code + digits (e.g., DK12345678, NL123456789B01)
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
                <Link
                  href={`/clients/${params.id}`}
                  className="flex-1 px-6 py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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