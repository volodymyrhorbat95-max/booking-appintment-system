import { Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import type { SubscriptionPlanOption, BillingPeriod, CurrentSubscription } from '../../../types';

interface PlansSectionProps {
  plans: SubscriptionPlanOption[];
  currentSubscription: CurrentSubscription | null;
  selectedPeriod: BillingPeriod;
  onPeriodChange: (period: BillingPeriod) => void;
  onSubscribe: (planId: string) => void;
  formatPrice: (price: number) => string;
}

const PlansSection = ({
  plans,
  currentSubscription,
  selectedPeriod,
  onPeriodChange,
  onSubscribe,
  formatPrice
}: PlansSectionProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4 fade-down-fast">
        {currentSubscription ? 'Cambiar Plan' : 'Elegir Plan'}
      </h2>

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button
          variant={selectedPeriod === 'MONTHLY' ? 'contained' : 'outlined'}
          onClick={() => onPeriodChange('MONTHLY')}
        >
          Mensual
        </Button>
        <Button
          variant={selectedPeriod === 'ANNUAL' ? 'contained' : 'outlined'}
          onClick={() => onPeriodChange('ANNUAL')}
        >
          Anual
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full zoom-in-fast">
            Ahorra 2 meses
          </span>
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, index) => {
          const isCurrentPlan = currentSubscription?.plan.id === plan.id;
          const price = selectedPeriod === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;
          const cardAnimation = index === 0 ? 'fade-left-fast' : index === 1 ? 'zoom-in-normal' : 'fade-right-fast';

          return (
            <div
              key={plan.id}
              className={`rounded-lg bg-white shadow-sm overflow-hidden ${cardAnimation} ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {isCurrentPlan && (
                <div className="bg-blue-500 text-white text-center text-sm py-1 fade-down-fast">
                  Plan Actual
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 fade-up-fast">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-500 fade-up-normal">{plan.description}</p>
                )}
                <div className="mt-4 fade-right-normal">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(price)}
                  </span>
                  <span className="text-gray-500">
                    /{selectedPeriod === 'MONTHLY' ? 'mes' : 'año'}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className={`flex items-start gap-2 text-sm text-gray-600 ${
                        featureIndex % 2 === 0 ? 'fade-left-normal' : 'fade-right-normal'
                      }`}
                    >
                      <CheckIcon sx={{ fontSize: 16, mt: 0.5, color: 'rgb(34, 197, 94)', flexShrink: 0 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="contained"
                  onClick={() => onSubscribe(plan.id)}
                  disabled={isCurrentPlan && currentSubscription?.billingPeriod === selectedPeriod}
                  fullWidth
                  sx={{ mt: 3 }}
                >
                  {isCurrentPlan
                    ? currentSubscription?.billingPeriod === selectedPeriod
                      ? 'Plan Actual'
                      : 'Cambiar a ' + (selectedPeriod === 'MONTHLY' ? 'Mensual' : 'Anual')
                    : currentSubscription
                    ? 'Cambiar a este plan'
                    : 'Suscribirse'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-500 fade-up-slow">
          No hay planes disponibles en este momento.
        </div>
      )}
    </div>
  );
};

export default PlansSection;
