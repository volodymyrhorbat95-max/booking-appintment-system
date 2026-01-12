import { useState, useEffect } from 'react';
import { Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getReminderSettings,
  updateReminderSettings,
  clearError,
  clearSuccessMessage
} from '../../../store/slices/whatsappSlice';
import type { ReminderSettingInput } from '../../../types';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const HOURS_OPTIONS = [
  { value: 2, label: '2 horas antes' },
  { value: 3, label: '3 horas antes' },
  { value: 6, label: '6 horas antes' },
  { value: 12, label: '12 horas antes' },
  { value: 24, label: '24 horas antes (1 día)' },
  { value: 48, label: '48 horas antes (2 días)' },
  { value: 72, label: '72 horas antes (3 días)' },
  { value: 96, label: '96 horas antes (4 días)' },
  { value: 168, label: '168 horas antes (1 semana)' }
];

const RemindersPage = () => {
  const dispatch = useAppDispatch();
  const { reminders, error, successMessage } = useAppSelector((state) => state.whatsapp);

  // Local state for form
  const [localReminders, setLocalReminders] = useState<ReminderSettingInput[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    dispatch(getReminderSettings());
  }, [dispatch]);

  // Initialize local state when data loads
  useEffect(() => {
    if (reminders.length > 0) {
      setLocalReminders(reminders.map(r => ({ ...r })));
    } else {
      // Default: 1 reminder 24 hours before
      setLocalReminders([
        { reminderNumber: 1, hoursBefore: 24, enableNightBefore: false, isActive: true }
      ]);
    }
    setHasChanges(false);
  }, [reminders]);

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

  // Add new reminder
  const handleAddReminder = () => {
    if (localReminders.length >= 5) return; // Max 5 reminders
    const newNumber = Math.max(...localReminders.map(r => r.reminderNumber), 0) + 1;
    setLocalReminders([
      ...localReminders,
      { reminderNumber: newNumber, hoursBefore: 24, enableNightBefore: false, isActive: true }
    ]);
    setHasChanges(true);
  };

  // Remove reminder
  const handleRemoveReminder = (reminderNumber: number) => {
    if (localReminders.length <= 1) return; // Keep at least 1 reminder
    setLocalReminders(localReminders.filter(r => r.reminderNumber !== reminderNumber));
    setHasChanges(true);
  };

  // Update reminder field
  const handleUpdateReminder = (
    reminderNumber: number,
    field: keyof ReminderSettingInput,
    value: number | boolean
  ) => {
    setLocalReminders(
      localReminders.map(r =>
        r.reminderNumber === reminderNumber ? { ...r, [field]: value } : r
      )
    );
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    // Renumber reminders sequentially
    const renumbered = localReminders.map((r, index) => ({
      ...r,
      reminderNumber: index + 1
    }));
    await dispatch(updateReminderSettings(renumbered));
    setHasChanges(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurar Recordatorios</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configura cuántos recordatorios enviar y con cuánta anticipación
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {/* Reminders list */}
      <div className="space-y-4">
        {localReminders.map((reminder, index) => (
          <div
            key={reminder.reminderNumber}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Recordatorio {index + 1}</h3>
              {localReminders.length > 1 && (
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  onClick={() => handleRemoveReminder(reminder.reminderNumber)}
                  startIcon={<DeleteIcon />}
                >
                  Eliminar
                </Button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {/* Hours before */}
              <FormControl fullWidth size="small">
                <InputLabel>Enviar con anticipación de:</InputLabel>
                <Select
                  value={reminder.hoursBefore}
                  onChange={(e) =>
                    handleUpdateReminder(reminder.reminderNumber, 'hoursBefore', Number(e.target.value))
                  }
                  label="Enviar con anticipación de:"
                >
                  {HOURS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Night before option */}
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reminder.enableNightBefore}
                      onChange={(e) =>
                        handleUpdateReminder(reminder.reminderNumber, 'enableNightBefore', e.target.checked)
                      }
                    />
                  }
                  label={
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Enviar la noche anterior</span>
                      <p className="text-gray-500">
                        Para citas temprano en la mañana, envía el recordatorio a las 20:00 del día anterior
                        en lugar de muy temprano en la mañana
                      </p>
                    </div>
                  }
                />
              </div>

              {/* Active toggle */}
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reminder.isActive}
                      onChange={(e) =>
                        handleUpdateReminder(reminder.reminderNumber, 'isActive', e.target.checked)
                      }
                    />
                  }
                  label="Recordatorio activo"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add reminder button */}
      {localReminders.length < 5 && (
        <Button
          variant="outlined"
          onClick={handleAddReminder}
          startIcon={<AddIcon />}
          fullWidth
          sx={{ mt: 2, borderStyle: 'dashed' }}
        >
          Agregar otro recordatorio
        </Button>
      )}

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
          startIcon={<SaveIcon />}
        >
          Guardar Configuración
        </Button>
      </div>

      {/* Help text */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-900">Cómo funcionan los recordatorios</h3>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
            <span>Los recordatorios se envían automáticamente por WhatsApp</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
            <span>Los pacientes pueden confirmar o cancelar desde el mensaje</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
            <span>Puedes configurar hasta 5 recordatorios por cita</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
            <span>La opción "noche anterior" evita enviar mensajes muy temprano</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RemindersPage;
