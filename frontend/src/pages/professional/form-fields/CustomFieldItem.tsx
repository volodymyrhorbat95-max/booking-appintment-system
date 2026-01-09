import { FieldType } from '../../../types';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'DROPDOWN', label: 'Lista desplegable' }
];

export interface CustomField {
  id: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options: string[];
}

interface CustomFieldItemProps {
  field: CustomField;
  onEdit: (field: CustomField) => void;
  onDelete: (id: string) => void;
  animationIndex: number;
}

const CustomFieldItem = ({ field, onEdit, onDelete, animationIndex }: CustomFieldItemProps) => {
  const getAnimation = () => {
    const animations = ['fade-right-fast', 'fade-left-fast', 'zoom-in-fast'];
    return animations[animationIndex % animations.length];
  };

  return (
    <div className={`flex items-center justify-between rounded-lg border border-gray-200 p-3 ${getAnimation()}`}>
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-700">{field.fieldName}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType}
        </span>
        {field.isRequired && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            Obligatorio
          </span>
        )}
        {field.fieldType === FieldType.DROPDOWN && field.options.length > 0 && (
          <span className="text-xs text-gray-500">
            ({field.options.length} opciones)
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(field)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(field.id)}
          className="text-sm text-red-600 hover:text-red-500"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default CustomFieldItem;
