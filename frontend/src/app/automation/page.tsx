'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AutomationPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation</h1>
          <p className="mt-2 text-gray-600">Visual project pipeline coming soon...</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}