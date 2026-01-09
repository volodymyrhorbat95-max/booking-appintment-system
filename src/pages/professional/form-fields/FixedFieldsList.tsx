const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'DROPDOWN', label: 'Lista desplegable' }
];

interface FixedField {
  id: string;
  fieldName: string;
  fieldType: string;
}

interface FixedFieldsListProps {
  fields: FixedField[];
}

const FixedFieldsList = ({ fields }: FixedFieldsListProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-right-normal">
      <h2 className="mb-4 text-lg font-medium text-gray-900 fade-down-fast">Campos Fijos</h2>
      <p className="mb-4 text-sm text-gray-500 fade-up-fast">
        Estos campos son obligatorios y no se pueden eliminar ni modificar.
      </p>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={`flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 ${
              index % 2 === 0 ? 'fade-left-fast' : 'fade-right-fast'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">{field.fieldName}</span>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label || field.fieldType}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Obligatorio
              </span>
            </div>
            <span className="text-xs text-gray-400">No editable</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FixedFieldsList;
