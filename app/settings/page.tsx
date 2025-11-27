import { requireAuth } from '@/lib/auth';
import { getTenantById } from '@/lib/tenant';
import { UserRole } from '@prisma/client';
import TenantSettingsForm from './TenantSettingsForm';

export default async function SettingsPage() {
  const session = await requireAuth();

  // Check if user has permission to access settings
  if (
    session.user.role !== UserRole.OWNER &&
    session.user.role !== UserRole.ADMIN
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Only OWNER and ADMIN roles can access tenant settings.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Get tenant data
  const tenant = await getTenantById(session.user.tenant_id);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tenant Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            Unable to load tenant settings.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tenant Settings
          </h1>
          <p className="text-gray-600">
            Manage your company information and branding
          </p>
        </div>

        {/* Settings Form */}
        <TenantSettingsForm tenant={tenant} />
      </div>
    </div>
  );
}
