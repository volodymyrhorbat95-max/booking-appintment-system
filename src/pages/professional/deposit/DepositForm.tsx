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
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`block h-8 w-14 rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => onEnabledChange(!enabled)}
            />
            <div
              className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : ''
              }`}
              onClick={() => onEnabledChange(!enabled)}
            />
          </div>
        </label>
      </div>

      {/* Amount input (shown only when enabled) */}
      {enabled && (
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 zoom-in-fast">
          <label className="block text-sm font-medium text-gray-700 fade-down-fast">
            Monto del depósito
          </label>
          <div className="mt-2 flex items-center gap-3 fade-right-fast">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                min="1"
                step="0.01"
                placeholder="0.00"
                className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
        <button
          type="button"
          onClick={onSave}
          disabled={!isValid}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed zoom-in-fast"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default DepositForm;
