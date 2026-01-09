import type { MessageTemplateVariable } from '../../../types';

interface TemplateEditFormProps {
  editedText: string;
  availableVariables: MessageTemplateVariable[];
  onTextChange: (text: string) => void;
  onInsertVariable: (variable: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateEditForm = ({
  editedText,
  availableVariables,
  onTextChange,
  onInsertVariable,
  onSave,
  onCancel
}: TemplateEditFormProps) => {
  return (
    <div className="space-y-4">
      <div className="fade-up-fast">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto del mensaje:
        </label>
        <textarea
          value={editedText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={8}
          maxLength={1024}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Escribe tu mensaje personalizado..."
        />
        <p className="mt-1 text-xs text-gray-500 fade-right-fast">
          {editedText.length}/1024 caracteres
        </p>
      </div>

      {/* Variables */}
      <div className="fade-up-normal">
        <p className="text-sm font-medium text-gray-700 mb-2 fade-left-fast">
          Variables disponibles (haz clic para insertar):
        </p>
        <div className="flex flex-wrap gap-2">
          {availableVariables.map((variable, index) => (
            <button
              key={variable.key}
              type="button"
              onClick={() => onInsertVariable(variable.key)}
              className={`rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 ${
                index % 2 === 0 ? 'fade-right-fast' : 'fade-left-fast'
              }`}
              title={variable.description}
            >
              {variable.key}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 fade-up-slow">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 fade-left-normal"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 fade-right-normal"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default TemplateEditForm;
