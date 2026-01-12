import { Switch, TextField, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

// Format currency for display
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};

interface DepositFormProps {
  enabled: boolean;
  amount: string;
  onEnabledChange: (enabled: boolean) => void;
  onAmountChange: (amount: string) => void;
  onSave: () => void;
}

const DepositForm = ({
  enabled,
  amount,
  onEnabledChange,
  onAmountChange,
  onSave
}: DepositFormProps) => {
  const isValid = !enabled || (amount && parseFloat(amount) > 0);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm fade-right-normal">
      {/* Enable/disable toggle */}
      <div className="mb-6 fade-up-fast">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-base font-medium text-gray-900">
              Requerir depósito para confirmar reserva
            </span>
            <p className="mt-1 text-sm text-gray-500">
              Si está habilitado, los pacientes deberán pagar un depósito para confirmar su cita
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            color="primary"
          />
        </label>
      </div>

      {/* Amount input (shown only when enabled) */}
      {enabled && (
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 zoom-in-fast">
          <div className="mt-2 flex items-center gap-3 fade-right-fast">
            <TextField
              type="number"
              label="Monto del depósito"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              size="small"
              className="flex-1 max-w-xs"
              slotProps={{
                input: {
                  startAdornment: <span className="mr-2 text-gray-500">$</span>,
                },
                htmlInput: {
                  min: 1,
                  step: 0.01
                }
              }}
              placeholder="0.00"
            />
            <span className="text-sm text-gray-500">ARS (Pesos Argentinos)</span>
          </div>
          {amount && parseFloat(amount) > 0 && (
            <p className="mt-2 text-sm text-gray-600 fade-up-fast">
              Los pacientes pagarán <strong>{formatCurrency(amount)}</strong> para confirmar su cita
            </p>
          )}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end fade-up-normal">
        <Button
          variant="contained"
          color="primary"
          onClick={onSave}
          disabled={!isValid}
          startIcon={<SaveIcon />}
          className="zoom-in-fast"
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};

export default DepositForm;
