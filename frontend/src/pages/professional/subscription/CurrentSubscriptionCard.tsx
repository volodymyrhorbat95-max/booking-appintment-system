import { Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import type { CurrentSubscription } from '../../../types';

interface CurrentSubscriptionCardProps {
  subscription: CurrentSubscription;
  onCancelClick: () => void;
  formatDate: (dateStr: string | null) => string;
  formatPrice: (price: number) => string;
}

// Get status badge
const getStatusBadge = (status: string) => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Activa' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
    EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expirada' },
    PAST_DUE: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pago pendiente' }
  };
  const badge = badges[status] || badges.EXPIRED;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text} zoom-in-fast`}>
      {badge.label}
    </span>
  );
};

const CurrentSubscriptionCard = ({
  subscription,
  onCancelClick,
  formatDate,
  formatPrice
}: CurrentSubscriptionCardProps) => {
  return (
    <div className="mb-8 rounded-lg bg-white shadow-sm zoom-in-normal">
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 fade-down-fast">Plan Actual</h2>
          {getStatusBadge(subscription.status)}
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900 fade-right-fast">{subscription.plan.name}</h3>
            {subscription.plan.description && (
              <p className="mt-1 text-sm text-gray-500 fade-right-normal">{subscription.plan.description}</p>
            )}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 fade-up-fast">
                <span className="font-medium">Período:</span>{' '}
                {subscription.billingPeriod === 'MONTHLY' ? 'Mensual' : 'Anual'}
              </p>
              <p className="text-sm text-gray-600 fade-up-normal">
                <span className="font-medium">Fecha de inicio:</span>{' '}
                {formatDate(subscription.startDate)}
              </p>
              {subscription.nextBillingDate && subscription.status === 'ACTIVE' && (
                <p className="text-sm text-gray-600 fade-up-slow">
                  <span className="font-medium">Próximo cobro:</span>{' '}
                  {formatDate(subscription.nextBillingDate)}
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase mb-2 fade-left-fast">Incluye:</h4>
            <ul className="space-y-2">
              {subscription.plan.features.map((feature, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-2 text-sm text-gray-600 ${
                    index % 2 === 0 ? 'fade-left-normal' : 'fade-right-normal'
                  }`}
                >
                  <CheckIcon sx={{ fontSize: 16, mt: 0.5, color: 'rgb(34, 197, 94)', flexShrink: 0 }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cancel button */}
        {subscription.status === 'ACTIVE' && (
          <div className="mt-6 pt-6 border-t border-gray-100 fade-up-slow">
            <Button
              variant="text"
              color="error"
              onClick={onCancelClick}
            >
              Cancelar suscripción
            </Button>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      {subscription.recentPayments.length > 0 && (
        <div className="border-t border-gray-100 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4 fade-down-fast">Pagos Recientes</h4>
          <div className="space-y-3">
            {subscription.recentPayments.map((payment, index) => (
              <div
                key={payment.id}
                className={`flex items-center justify-between text-sm ${
                  index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
                }`}
              >
                <div>
                  <span className="text-gray-900">{formatPrice(payment.amount)}</span>
                  <span className="text-gray-500 ml-2">
                    {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                  </span>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  payment.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : payment.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {payment.status === 'COMPLETED' ? 'Completado' : payment.status === 'PENDING' ? 'Pendiente' : 'Fallido'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentSubscriptionCard;
