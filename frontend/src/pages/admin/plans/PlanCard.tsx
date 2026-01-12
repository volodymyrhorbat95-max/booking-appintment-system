import { Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
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
              <IconButton
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
                size="small"
                title="Mover arriba"
                sx={{ p: 0.5 }}
              >
                <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                onClick={() => onMoveDown(index)}
                disabled={isLast}
                size="small"
                title="Mover abajo"
                sx={{ p: 0.5 }}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              </IconButton>
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
              <CheckIcon sx={{ fontSize: 16, mt: 0.5, color: 'rgb(34, 197, 94)', flexShrink: 0 }} className="zoom-in-fast" />
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
          <Button
            variant="outlined"
            onClick={() => onEdit(plan)}
            className="fade-up-fast"
            sx={{
              flex: 1,
              textTransform: 'none',
              color: 'rgb(55, 65, 81)',
              borderColor: 'rgb(209, 213, 219)',
              '&:hover': {
                bgcolor: 'rgb(249, 250, 251)',
                borderColor: 'rgb(209, 213, 219)'
              }
            }}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            onClick={() => onToggleActive(plan)}
            className="fade-down-fast"
            sx={{
              flex: 1,
              textTransform: 'none',
              ...(plan.isActive
                ? {
                    color: 'rgb(161, 98, 7)',
                    borderColor: 'rgb(253, 224, 71)',
                    '&:hover': {
                      bgcolor: 'rgb(254, 252, 232)',
                      borderColor: 'rgb(253, 224, 71)'
                    }
                  }
                : {
                    color: 'rgb(21, 128, 61)',
                    borderColor: 'rgb(134, 239, 172)',
                    '&:hover': {
                      bgcolor: 'rgb(240, 253, 244)',
                      borderColor: 'rgb(134, 239, 172)'
                    }
                  })
            }}
          >
            {plan.isActive ? 'Desactivar' : 'Activar'}
          </Button>
          {plan.subscribersCount === 0 && (
            <IconButton
              onClick={() => onDelete(plan)}
              className="zoom-in-fast"
              sx={{
                color: 'rgb(220, 38, 38)',
                border: '1px solid rgb(252, 165, 165)',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgb(254, 242, 242)',
                  border: '1px solid rgb(252, 165, 165)'
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
