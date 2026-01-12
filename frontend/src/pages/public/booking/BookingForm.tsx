import { useState, useMemo } from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Button, FormHelperText } from '@mui/material';
import type { BookingFormField } from '../../../types';
import CountryCodeSelector from './CountryCodeSelector';

interface BookingFormProps {
  formFields: BookingFormField[];
  selectedDate: string;
  selectedTime: string;
  professionalName: string;
  depositEnabled: boolean;
  depositAmount: number | null;
  onSubmit: (formData: Record<string, string>) => void;
}

const BookingForm = ({
  formFields,
  selectedDate,
  selectedTime,
  professionalName,
  depositEnabled,
  depositAmount,
  onSubmit
}: BookingFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCode, setCountryCode] = useState('+54'); // Argentina default

  // Sort fields by displayOrder
  const sortedFields = useMemo(
    () => [...formFields].sort((a, b) => a.displayOrder - b.displayOrder),
    [formFields]
  );

  // Format selected date for display
  const formattedDate = useMemo(() => {
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [selectedDate]);

  // Handle input change
  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    sortedFields.forEach((field) => {
      const value = formData[field.id]?.trim() || '';

      if (field.isRequired && !value) {
        newErrors[field.id] = 'Este campo es requerido';
        return;
      }

      // Email validation
      if (field.id === 'fixed-email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Ingresa un email válido';
        }
      }

      // WhatsApp validation (only numbers, between 6-15 digits)
      if (field.id === 'fixed-whatsappNumber' && value) {
        const phoneRegex = /^\d{6,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          newErrors[field.id] = 'Ingresa un número válido (sin el código de país)';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Add country code to WhatsApp number
    const finalFormData = {
      ...formData,
      countryCode
    };

    onSubmit(finalFormData);
  };

  // Render input based on field type
  const renderInput = (field: BookingFormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    // Special handling for WhatsApp field
    if (field.id === 'fixed-whatsappNumber') {
      return (
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">
            {field.fieldName}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex">
            <CountryCodeSelector
              value={countryCode}
              onChange={setCountryCode}
            />
            <TextField
              type="tel"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder="Número sin código de país"
              error={!!error}
              helperText={error}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }
              }}
            />
          </div>
        </div>
      );
    }

    // Regular text input
    if (field.fieldType === 'TEXT' || field.fieldType === 'NUMBER') {
      return (
        <TextField
          type={field.fieldType === 'NUMBER' ? 'number' : field.id === 'fixed-email' ? 'email' : 'text'}
          label={field.fieldName}
          value={value}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          error={!!error}
          helperText={error}
          required={field.isRequired}
          fullWidth
        />
      );
    }

    // Date input
    if (field.fieldType === 'DATE') {
      return (
        <TextField
          type="date"
          label={field.fieldName}
          value={value}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          error={!!error}
          helperText={error}
          required={field.isRequired}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    // Dropdown
    if (field.fieldType === 'DROPDOWN') {
      return (
        <FormControl fullWidth error={!!error} required={field.isRequired}>
          <InputLabel>{field.fieldName}</InputLabel>
          <Select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            label={field.fieldName}
          >
            <MenuItem value="">Seleccionar...</MenuItem>
            {field.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      );
    }

    return null;
  };

  return (
    <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm zoom-in-normal">
      {/* Appointment summary */}
      <div className="mb-4 sm:mb-6 rounded-lg bg-blue-50 p-3 sm:p-4 fade-down-fast">
        <h3 className="text-sm sm:text-base font-medium text-blue-900">Resumen de tu cita</h3>
        <div className="mt-2 space-y-1 text-sm sm:text-base text-blue-700">
          <p className="fade-right-fast"><strong>Profesional:</strong> {professionalName}</p>
          <p className="fade-left-fast"><strong>Fecha:</strong> {formattedDate}</p>
          <p className="fade-right-fast"><strong>Hora:</strong> {selectedTime}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <h3 className="mb-4 text-base sm:text-lg font-semibold text-gray-900 fade-up-fast">Tus datos</h3>

        <div className="space-y-4 sm:space-y-5 flip-up-normal">
          {sortedFields.map((field) => (
            <div key={field.id}>{renderInput(field)}</div>
          ))}
        </div>

        {/* Deposit notice */}
        {depositEnabled && depositAmount && (
          <div className="mt-4 sm:mt-6 rounded-lg bg-yellow-50 p-3 sm:p-4 zoom-out-normal">
            <h4 className="text-sm sm:text-base font-medium text-yellow-900">Depósito requerido</h4>
            <p className="mt-1 text-sm text-yellow-700">
              Para confirmar tu cita, deberás realizar un depósito de{' '}
              <strong>
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS'
                }).format(depositAmount)}
              </strong>
            </p>
          </div>
        )}

        {/* Submit button - touch-friendly with minimum height */}
        <div className="mt-6 sm:mt-8 fade-up-slow">
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              textTransform: 'none',
              minHeight: { xs: 56, sm: 48 },
              fontSize: { xs: '1rem', sm: '0.875rem' }
            }}
          >
            {depositEnabled ? 'Continuar al pago' : 'Confirmar reserva'}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs sm:text-sm text-gray-500 fade-up-slow">
          Al reservar, aceptas recibir recordatorios por WhatsApp sobre tu cita
        </p>
      </form>
    </div>
  );
};

export default BookingForm;
