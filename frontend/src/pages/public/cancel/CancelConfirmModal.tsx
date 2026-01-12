import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface CancelConfirmModalProps {
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelConfirmModal = ({
  reason,
  onReasonChange,
  onConfirm,
  onClose
}: CancelConfirmModalProps) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar cancelación</DialogTitle>
      <DialogContent>
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
        </p>
        <TextField
          label="Motivo de cancelación (opcional)"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          multiline
          rows={2}
          placeholder="Cuéntanos por qué cancelas..."
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: 'error.main',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: 'error.main',
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: 'none',
            minHeight: 40,
          }}
        >
          Volver
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          color="error"
          sx={{
            textTransform: 'none',
            minHeight: 40,
          }}
        >
          Sí, cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelConfirmModal;
