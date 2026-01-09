import type { AdminPlan } from '../../../types';

interface PlanCardProps {
  plan: AdminPlan;
  index: number;
  totalPlans: number;
  onEdit: (plan: AdminPlan) => void;
  onToggleActive: (plan: AdminPlan) => void;
  onDelete: (plan: AdminPlan) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const PlanCard = ({ plan, index, totalPlans, onEdit, onToggleActive, onDelete, onMoveUp, onMoveDown }: PlanCardProps) => {
  const cardAnimations = ['fade-up-fast', 'fade-down-fast', 'fade-left-normal', 'fade-right-normal', 'zoom-in-fast', 'fade-up-normal'];
  const cardAnimation = cardAnimations[index % cardAnimations.length];

  const isFirst = index === 0;
  const isLast = index === totalPlans - 1;

  return (
    <div
      className={`rounded-lg bg-white shadow-sm overflow-hidden ${!plan.isActive ? 'opacity-60' : ''} ${cardAnimation}`}
    >
      {/* Plan header with reorder buttons */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between fade-right-fast">
          <div className="flex items-center gap-2">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
                className={`p-1 rounded transition-colors ${
                  isFirst
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Mover arriba"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(index)}
                disabled={isLast}
                className={`p-1 rounded transition-colors ${
                  isLast
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Mover abajo"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
          </div>
          {!plan.isActive && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 zoom-in-fast">
              Inactivo
            </span>
          )}
        </div>
        {plan.description && (
          <p className="mt-1 text-sm text-gray-500 fade-left-fast ml-8">{plan.description}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="p-4 bg-gray-50 fade-up-normal">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-gray-900 fade-right-normal">
            ${plan.monthlyPrice.toLocaleString('es-AR')}
          </span>
          <span className="text-gray-500 fade-left-normal">/mes</span>
        </div>
        <p className="text-sm text-gray-500 fade-down-fast">
          o ${plan.annualPrice.toLocaleString('es-AR')}/año
        </p>
      </div>

      {/* Features */}
      <div className="p-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2 fade-down-fast">Incluye:</p>
        <ul className="space-y-1">
          {plan.features.map((feature, featureIndex) => (
            <li
              key={featureIndex}
              className={`flex items-start gap-2 text-sm text-gray-600 ${featureIndex % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'}`}
            >
              <svg className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0 zoom-in-fast" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
          {plan.features.length === 0 && (
            <li className="text-sm text-gray-400 fade-up-fast">Sin características definidas</li>
          )}
        </ul>
      </div>

      {/* Stats and Actions */}
      <div className="border-t border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-3 fade-left-normal">
          {plan.subscribersCount} suscriptor{plan.subscribersCount !== 1 ? 'es' : ''}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 fade-up-fast"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onToggleActive(plan)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium fade-down-fast ${
              plan.isActive
                ? 'border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                : 'border border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            {plan.isActive ? 'Desactivar' : 'Activar'}
          </button>
          {plan.subscribersCount === 0 && (
            <button
              type="button"
              onClick={() => onDelete(plan)}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 zoom-in-fast"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
