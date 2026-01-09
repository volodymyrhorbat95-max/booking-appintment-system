import type { AdminProfessional } from '../../../types';

interface ProfessionalsTableProps {
  professionals: AdminProfessional[];
  onSuspend: (id: string, name: string) => void;
  onActivate: (id: string) => void;
}

const ProfessionalsTable = ({ professionals, onSuspend, onActivate }: ProfessionalsTableProps) => {
  // Status badge
  const getStatusBadge = (isActive: boolean, isSuspended: boolean) => {
    if (isSuspended) {
      return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-600 zoom-in-fast">Suspendido</span>;
    }
    if (!isActive) {
      return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 zoom-in-fast">Inactivo</span>;
    }
    return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600 zoom-in-fast">Activo</span>;
  };

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden fade-up-normal">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider fade-down-fast">
                Profesional
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider fade-down-fast">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider fade-down-fast">
                Suscripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider fade-down-fast">
                Citas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider fade-down-fast">
                Registro
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider fade-down-fast">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {professionals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 fade-up-fast">
                  No se encontraron profesionales
                </td>
              </tr>
            ) : (
              professionals.map((professional, index) => {
                const rowAnimations = ['fade-left-fast', 'fade-right-fast', 'fade-up-fast', 'fade-down-fast'];
                const rowAnimation = rowAnimations[index % rowAnimations.length];

                return (
                  <tr key={professional.id} className={`hover:bg-gray-50 ${rowAnimation}`}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 fade-right-fast">{professional.fullName}</p>
                        <p className="text-sm text-gray-500 fade-left-fast">{professional.email}</p>
                        <p className="text-xs text-gray-400 fade-up-fast">/{professional.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(professional.isActive, professional.isSuspended)}
                    </td>
                    <td className="px-4 py-4">
                      {professional.subscription ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900 fade-right-normal">{professional.subscription.planName}</p>
                          <p className="text-xs text-gray-500 fade-left-normal">
                            {professional.subscription.billingPeriod === 'MONTHLY' ? 'Mensual' : 'Anual'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 fade-up-normal">Sin suscripción</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900 fade-down-fast">{professional.appointmentsCount}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500 fade-left-fast">
                        {new Date(professional.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {professional.isSuspended ? (
                        <button
                          type="button"
                          onClick={() => onActivate(professional.id)}
                          className="text-sm font-medium text-green-600 hover:text-green-500 zoom-in-fast"
                        >
                          Activar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSuspend(professional.id, professional.fullName)}
                          className="text-sm font-medium text-red-600 hover:text-red-500 zoom-in-fast"
                        >
                          Suspender
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfessionalsTable;
