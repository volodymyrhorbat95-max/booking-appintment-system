import { TextField, Button, Radio, RadioGroup, FormControlLabel } from '@mui/material';

// Get today's date formatted for input
const getTodayForInput = (): string => {
  return new Date().toISOString().split('T')[0];
};

interface BlockedDateFormProps {
  mode: 'single' | 'range';
  singleDate: string;
  startDate: string;
  endDate: string;
  reason: string;
  onModeChange: (mode: 'single' | 'range') => void;
  onSingleDateChange: (date: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

const BlockedDateForm = ({
  mode,
  singleDate,
  startDate,
  endDate,
  reason,
  onModeChange,
  onSingleDateChange,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSubmit
}: BlockedDateFormProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-right-normal">
      <h2 className="mb-4 text-lg font-medium text-gray-900 fade-down-fast">Agregar Fecha Bloqueada</h2>

      {/* Mode toggle */}
      <RadioGroup
        row
        value={mode}
        onChange={(e) => onModeChange(e.target.value as 'single' | 'range')}
        className="mb-4 fade-up-fast"
      >
        <FormControlLabel value="single" control={<Radio />} label="Fecha única" />
        <FormControlLabel value="range" control={<Radio />} label="Rango de fechas" />
      </RadioGroup>

      {/* Date inputs */}
      {mode === 'single' ? (
        <div className="mb-4 zoom-in-fast sm:w-64">
          <TextField
            type="date"
            label="Fecha"
            value={singleDate}
            onChange={(e) => onSingleDateChange(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getTodayForInput() }}
          />
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-4 zoom-in-fast">
          <div className="fade-left-fast">
            <TextField
              type="date"
              label="Fecha inicio"
              value={startDate}
              onChange={(e) => {
                onStartDateChange(e.target.value);
                if (e.target.value > endDate) {
                  onEndDateChange(e.target.value);
                }
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getTodayForInput() }}
            />
          </div>
          <div className="fade-right-fast">
            <TextField
              type="date"
              label="Fecha fin"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate || getTodayForInput() }}
            />
          </div>
        </div>
      )}

      {/* Reason input */}
      <div className="mb-4 fade-up-normal">
        <TextField
          label="Motivo (opcional)"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Ej: Vacaciones, Feriado, Congreso médico..."
          fullWidth
          size="small"
        />
      </div>

      {/* Add button */}
      <Button
        variant="contained"
        color="primary"
        onClick={onSubmit}
        className="zoom-in-normal"
      >
        {mode === 'single' ? 'Bloquear Fecha' : 'Bloquear Rango'}
      </Button>
    </div>
  );
};

export default BlockedDateForm;
