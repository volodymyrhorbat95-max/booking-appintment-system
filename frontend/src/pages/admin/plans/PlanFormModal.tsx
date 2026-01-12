import { Button, TextField, Checkbox, FormControlLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddFeature();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-2">
            {/* Name */}
            <div className="fade-right-fast">
              <TextField
                fullWidth
                label="Nombre del plan *"
                value={formData.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                placeholder="Ej: Plan Profesional"
                size="small"
              />
            </div>

            {/* Description */}
            <div className="fade-left-fast">
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                placeholder="Breve descripción del plan"
                size="small"
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="fade-up-normal">
                <TextField
                  fullWidth
                  type="number"
                  label="Precio Mensual (ARS) *"
                  value={formData.monthlyPrice}
                  onChange={(e) => onFormChange({ monthlyPrice: Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                  size="small"
                />
              </div>
              <div className="fade-down-normal">
                <TextField
                  fullWidth
                  type="number"
                  label="Precio Anual (ARS) *"
                  value={formData.annualPrice}
                  onChange={(e) => onFormChange({ annualPrice: Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                  size="small"
                />
              </div>
            </div>

            {/* Features */}
            <div className="fade-right-normal">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Características
              </label>
              <div className="flex gap-2 mb-2">
                <TextField
                  fullWidth
                  value={newFeature}
                  onChange={(e) => onNewFeatureChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Agregar característica..."
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={onAddFeature}
                  className="zoom-in-fast"
                  sx={{
                    textTransform: 'none',
                    bgcolor: 'rgb(243, 244, 246)',
                    color: 'rgb(55, 65, 81)',
                    borderColor: 'rgb(243, 244, 246)',
                    '&:hover': {
                      bgcolor: 'rgb(229, 231, 235)',
                      borderColor: 'rgb(229, 231, 235)'
                    }
                  }}
                >
                  Agregar
                </Button>
              </div>
              <ul className="space-y-1">
                {formData.features.map((feature, index) => (
                  <li
                    key={index}
                    className={`flex items-center justify-between rounded bg-gray-50 px-3 py-2 ${index % 2 === 0 ? 'fade-left-fast' : 'fade-right-fast'}`}
                  >
                    <span className="text-sm text-gray-700">{feature}</span>
                    <IconButton
                      onClick={() => onRemoveFeature(index)}
                      size="small"
                      className="zoom-in-fast"
                      sx={{
                        color: 'rgb(239, 68, 68)',
                        '&:hover': {
                          color: 'rgb(185, 28, 28)'
                        }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active */}
            <div className="fade-up-fast">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => onFormChange({ isActive: e.target.checked })}
                    size="small"
                  />
                }
                label="Plan activo (visible para profesionales)"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                    color: 'rgb(55, 65, 81)'
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              textTransform: 'none',
              color: 'rgb(55, 65, 81)',
              borderColor: 'rgb(209, 213, 219)',
              '&:hover': {
                bgcolor: 'rgb(249, 250, 251)',
                borderColor: 'rgb(209, 213, 219)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!formData.name || formData.monthlyPrice <= 0 || formData.annualPrice <= 0}
            className="zoom-in-fast"
            sx={{ textTransform: 'none' }}
          >
            {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
          </Button>
        </DialogActions>
    </Dialog>
  );
};

export default PlanFormModal;
