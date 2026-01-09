import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getMessageTemplates,
  updateMessageTemplate,
  resetMessageTemplate,
  clearError,
  clearSuccessMessage
} from '../../../store/slices/whatsappSlice';
import type { MessageTemplateType, MessageTemplateData } from '../../../types';
import TemplatesHeader from './TemplatesHeader';
import TemplateCard from './TemplateCard';
import VariablesReference from './VariablesReference';
import TemplatesHelpSection from './TemplatesHelpSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const TEMPLATE_LABELS: Record<MessageTemplateType, string> = {
  BOOKING_CONFIRMATION: 'Confirmación de Reserva',
  REMINDER: 'Recordatorio',
  CANCELLATION: 'Cancelación'
};

const TEMPLATE_DESCRIPTIONS: Record<MessageTemplateType, string> = {
  BOOKING_CONFIRMATION: 'Se envía inmediatamente después de que el paciente reserva una cita',
  REMINDER: 'Se envía como recordatorio antes de la cita según tu configuración',
  CANCELLATION: 'Se envía cuando una cita es cancelada'
};

const TemplatesPage = () => {
  const dispatch = useAppDispatch();
  const { templates, availableVariables, error, successMessage } = useAppSelector((state) => state.whatsapp);

  // Local state for editing
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplateType | null>(null);
  const [editedText, setEditedText] = useState('');

  // Load templates on mount
  useEffect(() => {
    dispatch(getMessageTemplates());
  }, [dispatch]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Start editing a template
  const handleEdit = (template: MessageTemplateData) => {
    setEditingTemplate(template.type);
    setEditedText(template.messageText);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditedText('');
  };

  // Save template
  const handleSave = async () => {
    if (!editingTemplate) return;
    await dispatch(updateMessageTemplate({
      type: editingTemplate,
      messageText: editedText
    }));
    setEditingTemplate(null);
    setEditedText('');
  };

  // Reset to default
  const handleReset = async (type: MessageTemplateType) => {
    if (window.confirm('¿Estás seguro de que deseas restablecer esta plantilla a los valores por defecto?')) {
      await dispatch(resetMessageTemplate(type));
    }
  };

  // Insert variable at cursor position
  const handleInsertVariable = (variable: string) => {
    setEditedText((prev) => prev + variable);
  };

  return (
    <div className="mx-auto max-w-4xl zoom-in-normal">
      {/* Header */}
      <TemplatesHeader error={error} successMessage={successMessage} />

      {/* Templates list */}
      <div className="space-y-6">
        {templates.map((template, index) => (
          <TemplateCard
            key={template.type}
            template={template}
            label={TEMPLATE_LABELS[template.type]}
            description={TEMPLATE_DESCRIPTIONS[template.type]}
            isEditing={editingTemplate === template.type}
            editedText={editedText}
            availableVariables={availableVariables}
            index={index}
            onEdit={handleEdit}
            onReset={handleReset}
            onTextChange={setEditedText}
            onInsertVariable={handleInsertVariable}
            onSave={handleSave}
            onCancelEdit={handleCancelEdit}
          />
        ))}
      </div>

      {/* Variables reference */}
      <VariablesReference variables={availableVariables} />

      {/* Help text */}
      <TemplatesHelpSection />
    </div>
  );
};

export default TemplatesPage;
