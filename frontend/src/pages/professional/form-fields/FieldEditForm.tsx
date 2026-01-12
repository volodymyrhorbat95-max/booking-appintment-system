import { useState } from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

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
          <TextField
            label="Nombre del campo"
            value={field.fieldName}
            onChange={(e) => onFieldChange({ ...field, fieldName: e.target.value })}
            fullWidth
            size="small"
            placeholder="Ej: Obra Social, Número de DNI..."
          />
        </div>
        <div className="flex flex-wrap gap-4 fade-left-fast">
          <FormControl size="small" className="min-w-[200px]">
            <InputLabel id="field-type-label">Tipo de campo</InputLabel>
            <Select
              labelId="field-type-label"
              value={field.fieldType}
              onChange={(e) => onFieldChange({ ...field, fieldType: e.target.value })}
              label="Tipo de campo"
            >
              {FIELD_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="flex items-center">
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.isRequired}
                  onChange={(e) => onFieldChange({ ...field, isRequired: e.target.checked })}
                  color="primary"
                />
              }
              label="Obligatorio"
            />
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
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveOption(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 zoom-in-fast">
                <TextField
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                  size="small"
                  className="flex-1"
                  placeholder="Nueva opción..."
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddOption}
                  startIcon={<AddIcon />}
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 fade-up-normal">
          <Button
            variant="contained"
            color="primary"
            onClick={onSave}
            disabled={!isValid}
            startIcon={<SaveIcon />}
          >
            {isNew ? 'Crear Campo' : 'Guardar Cambios'}
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={<CloseIcon />}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FieldEditForm;
