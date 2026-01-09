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
        <button
          type="button"
          onClick={() => onPeriodChange('MONTHLY')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors fade-left-fast ${
            selectedPeriod === 'MONTHLY'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange('ANNUAL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors fade-right-fast ${
            selectedPeriod === 'ANNUAL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Anual
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full zoom-in-fast">
            Ahorra 2 meses
          </span>
        </button>
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
                      <svg className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onSubscribe(plan.id)}
                  disabled={isCurrentPlan && currentSubscription?.billingPeriod === selectedPeriod}
                  className={`mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-colors fade-up-slow ${
                    isCurrentPlan && currentSubscription?.billingPeriod === selectedPeriod
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isCurrentPlan
                    ? currentSubscription?.billingPeriod === selectedPeriod
                      ? 'Plan Actual'
                      : 'Cambiar a ' + (selectedPeriod === 'MONTHLY' ? 'Mensual' : 'Anual')
                    : currentSubscription
                    ? 'Cambiar a este plan'
                    : 'Suscribirse'}
                </button>
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
