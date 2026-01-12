import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface CancelAppointmentModalProps {
  patientName: string;
  cancelReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CancelAppointmentModal = ({
  patientName,
  cancelReason,
  onReasonChange,
  onConfirm,
  onCancel
}: CancelAppointmentModalProps) => {
  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Cancelar cita</DialogTitle>
      <DialogContent>
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro de que deseas cancelar la cita de {patientName}?
        </p>
        <TextField
          label="Motivo de cancelación (opcional)"
          value={cancelReason}
          onChange={(e) => onReasonChange(e.target.value)}
          multiline
          rows={3}
          fullWidth
          placeholder="Ingresa el motivo..."
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          Volver
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
        >
          Sí, cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelAppointmentModal;
