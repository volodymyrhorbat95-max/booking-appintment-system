import type { AdminPlan } from '../../../types';
import PlanCard from './PlanCard';

interface PlansGridProps {
  plans: AdminPlan[];
  onEdit: (plan: AdminPlan) => void;
  onToggleActive: (plan: AdminPlan) => void;
  onDelete: (plan: AdminPlan) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const PlansGrid = ({ plans, onEdit, onToggleActive, onDelete, onMoveUp, onMoveDown }: PlansGridProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan, index) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          index={index}
          totalPlans={plans.length}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      ))}

      {plans.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500 fade-up-normal">
          No hay planes creados. Crea tu primer plan de suscripción.
        </div>
      )}
    </div>
  );
};

export default PlansGrid;
