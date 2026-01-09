import type { MessageTemplateType, MessageTemplateData, MessageTemplateVariable } from '../../../types';
import TemplateEditForm from './TemplateEditForm';

interface TemplateCardProps {
  template: MessageTemplateData;
  label: string;
  description: string;
  isEditing: boolean;
  editedText: string;
  availableVariables: MessageTemplateVariable[];
  index: number;
  onEdit: (template: MessageTemplateData) => void;
  onReset: (type: MessageTemplateType) => void;
  onTextChange: (text: string) => void;
  onInsertVariable: (variable: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
}

const TemplateCard = ({
  template,
  label,
  description,
  isEditing,
  editedText,
  availableVariables,
  index,
  onEdit,
  onReset,
  onTextChange,
  onInsertVariable,
  onSave,
  onCancelEdit
}: TemplateCardProps) => {
  const cardAnimation = index === 0 ? 'fade-right-fast' : index === 1 ? 'fade-left-fast' : 'fade-up-normal';

  return (
    <div className={`rounded-lg bg-white shadow-sm ${cardAnimation}`}>
      {/* Template header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 fade-down-fast">{label}</h3>
            <p className="text-sm text-gray-500 fade-up-fast">{description}</p>
          </div>
          {template.isCustom && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600 zoom-in-fast">
              Personalizado
            </span>
          )}
        </div>
      </div>

      {/* Template content */}
      <div className="p-4">
        {isEditing ? (
          <TemplateEditForm
            editedText={editedText}
            availableVariables={availableVariables}
            onTextChange={onTextChange}
            onInsertVariable={onInsertVariable}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        ) : (
          // View mode
          <div>
            <div className="rounded-lg bg-gray-50 p-4 fade-up-fast">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {template.messageText}
              </pre>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex justify-end gap-3 fade-up-normal">
              {template.isCustom && (
                <button
                  type="button"
                  onClick={() => onReset(template.type)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 fade-left-fast"
                >
                  Restablecer
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(template)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 fade-right-fast"
              >
                Editar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;
