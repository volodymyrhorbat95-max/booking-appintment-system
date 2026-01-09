import { useState } from 'react';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'DROPDOWN', label: 'Lista desplegable' }
];

export interface EditingField {
  id?: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options: string[];
}

interface FieldEditFormProps {
  field: EditingField;
  isNew: boolean;
  onFieldChange: (field: EditingField) => void;
  onSave: () => void;
  onCancel: () => void;
}

const FieldEditForm = ({
  field,
  isNew,
  onFieldChange,
  onSave,
  onCancel
}: FieldEditFormProps) => {
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    onFieldChange({
      ...field,
      options: [...field.options, newOption.trim()]
    });
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    onFieldChange({
      ...field,
      options: field.options.filter((_, i) => i !== index)
    });
  };

  const isValid = field.fieldName.trim() &&
    (field.fieldType !== 'DROPDOWN' || field.options.length >= 2);

  const bgColor = isNew ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50';

  return (
    <div className={`rounded-lg border p-4 ${bgColor} zoom-in-fast`}>
      <h3 className="mb-4 font-medium text-gray-900 fade-down-fast">
        {isNew ? 'Nuevo Campo Personalizado' : 'Editar Campo'}
      </h3>
      <div className="space-y-4">
        <div className="fade-right-fast">
          <label className="block text-sm font-medium text-gray-700">
            Nombre del campo
          </label>
          <input
            type="text"
            value={field.fieldName}
            onChange={(e) => onFieldChange({ ...field, fieldName: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Obra Social, Número de DNI..."
          />
        </div>
        <div className="flex flex-wrap gap-4 fade-left-fast">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de campo
            </label>
            <select
              value={field.fieldType}
              onChange={(e) => onFieldChange({ ...field, fieldType: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.isRequired}
                onChange={(e) => onFieldChange({ ...field, isRequired: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Obligatorio</span>
            </label>
          </div>
        </div>

        {/* Options for dropdown */}
        {field.fieldType === 'DROPDOWN' && (
          <div className="fade-up-normal">
            <label className="block text-sm font-medium text-gray-700">
              Opciones (mínimo 2)
            </label>
            <div className="mt-2 space-y-2">
              {field.options.map((option, index) => (
                <div key={index} className={`flex items-center gap-2 ${index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'}`}>
                  <span className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
                    {option}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-600 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 zoom-in-fast">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nueva opción..."
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 fade-up-normal">
          <button
            type="button"
            onClick={onSave}
            disabled={!isValid}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isNew ? 'Crear Campo' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldEditForm;
