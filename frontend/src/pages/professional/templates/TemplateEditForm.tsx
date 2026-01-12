import { Button, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
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
        <TextField
          label="Texto del mensaje"
          value={editedText}
          onChange={(e) => onTextChange(e.target.value)}
          multiline
          rows={8}
          fullWidth
          inputProps={{ maxLength: 1024 }}
          placeholder="Escribe tu mensaje personalizado..."
          helperText={`${editedText.length}/1024 caracteres`}
        />
      </div>

      {/* Variables */}
      <div className="fade-up-normal">
        <p className="text-sm font-medium text-gray-700 mb-2 fade-left-fast">
          Variables disponibles (haz clic para insertar):
        </p>
        <div className="flex flex-wrap gap-2">
          {availableVariables.map((variable) => (
            <Button
              key={variable.key}
              variant="outlined"
              size="small"
              onClick={() => onInsertVariable(variable.key)}
              title={variable.description}
              sx={{ borderRadius: '16px' }}
            >
              {variable.key}
            </Button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 fade-up-slow">
        <Button
          variant="outlined"
          onClick={onCancel}
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          startIcon={<SaveIcon />}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
};

export default TemplateEditForm;
