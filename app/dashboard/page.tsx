import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Bienvenido, {session.user.name || session.user.email}
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Has iniciado sesión como <strong>{session.user.role}</strong> en
                  el tenant con ID: <strong>{session.user.tenant_id}</strong>
                </p>
              </div>
              <div className="mt-5">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Sistema Multi-Tenant Configurado
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          El sistema de autenticación multi-tenant está
                          funcionando correctamente. Los usuarios están aislados
                          por tenant y cada uno tiene acceso solo a sus propios
                          datos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
