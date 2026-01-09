import type { AdminPlan } from '../../../types';

interface PlanFormData {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive: boolean;
}

interface PlanFormModalProps {
  isOpen: boolean;
  editingPlan: AdminPlan | null;
  formData: PlanFormData;
  newFeature: string;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: Partial<PlanFormData>) => void;
  onNewFeatureChange: (value: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
}

const PlanFormModal = ({
  isOpen,
  editingPlan,
  formData,
  newFeature,
  onClose,
  onSave,
  onFormChange,
  onNewFeatureChange,
  onAddFeature,
  onRemoveFeature
}: PlanFormModalProps) => {
  if (!isOpen) return null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddFeature();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 fade-up-fast">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl zoom-in-normal">
        {/* Modal header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 fade-down-fast">
            {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
          </h3>
        </div>

        {/* Modal body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Name */}
            <div className="fade-right-fast">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del plan *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ej: Plan Profesional"
              />
            </div>

            {/* Description */}
            <div className="fade-left-fast">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Breve descripción del plan"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="fade-up-normal">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Mensual (ARS) *
                </label>
                <input
                  type="number"
                  value={formData.monthlyPrice}
                  onChange={(e) => onFormChange({ monthlyPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div className="fade-down-normal">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Anual (ARS) *
                </label>
                <input
                  type="number"
                  value={formData.annualPrice}
                  onChange={(e) => onFormChange({ annualPrice: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* Features */}
            <div className="fade-right-normal">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Características
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => onNewFeatureChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Agregar característica..."
                />
                <button
                  type="button"
                  onClick={onAddFeature}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 zoom-in-fast"
                >
                  Agregar
                </button>
              </div>
              <ul className="space-y-1">
                {formData.features.map((feature, index) => (
                  <li
                    key={index}
                    className={`flex items-center justify-between rounded bg-gray-50 px-3 py-2 ${index % 2 === 0 ? 'fade-left-fast' : 'fade-right-fast'}`}
                  >
                    <span className="text-sm text-gray-700">{feature}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveFeature(index)}
                      className="text-red-500 hover:text-red-700 zoom-in-fast"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2 fade-up-fast">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => onFormChange({ isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Plan activo (visible para profesionales)
              </label>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 fade-down-fast">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!formData.name || formData.monthlyPrice <= 0 || formData.annualPrice <= 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed zoom-in-fast"
          >
            {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanFormModal;
