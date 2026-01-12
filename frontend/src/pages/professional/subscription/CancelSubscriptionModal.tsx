import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface CancelSubscriptionModalProps {
  nextBillingDate: string | null;
  formatDate: (dateStr: string | null) => string;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelSubscriptionModal = ({
  nextBillingDate,
  formatDate,
  onClose,
  onConfirm
}: CancelSubscriptionModalProps) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>¿Cancelar suscripción?</DialogTitle>
      <DialogContent>
        <p className="text-sm text-gray-500">
          Tu suscripción permanecerá activa hasta el{' '}
          <span className="font-medium">{formatDate(nextBillingDate)}</span>.
          Después de esa fecha, perderás acceso a las funciones premium.
        </p>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          Mantener suscripción
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

export default CancelSubscriptionModal;
