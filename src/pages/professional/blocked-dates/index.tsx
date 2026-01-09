import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getBlockedDates,
  addBlockedDate,
  addBlockedDateRange,
  removeBlockedDate,
  clearError
} from '../../../store/slices/blockedDatesSlice';
import BlockedDatesHeader from './BlockedDatesHeader';
import BlockedDateForm from './BlockedDateForm';
import BlockedDatesList from './BlockedDatesList';
import BlockedDatesHelpSection from './BlockedDatesHelpSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

// Get today's date formatted for input
const getTodayForInput = (): string => {
  return new Date().toISOString().split('T')[0];
};

const BlockedDatesPage = () => {
  const dispatch = useAppDispatch();
  const { blockedDates, error } = useAppSelector((state) => state.blockedDates);

  // Local state for forms
  const [mode, setMode] = useState<'single' | 'range'>('single');
  const [singleDate, setSingleDate] = useState(getTodayForInput());
  const [startDate, setStartDate] = useState(getTodayForInput());
  const [endDate, setEndDate] = useState(getTodayForInput());
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load blocked dates on mount
  useEffect(() => {
    dispatch(getBlockedDates());
  }, [dispatch]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle add single date
  const handleAddSingleDate = async () => {
    setSuccessMessage('');

    if (!singleDate) {
      return;
    }

    const result = await dispatch(addBlockedDate({ date: singleDate, reason: reason || undefined }));

    if (addBlockedDate.fulfilled.match(result)) {
      setSuccessMessage('Fecha bloqueada correctamente');
      setSingleDate(getTodayForInput());
      setReason('');
    }
  };

  // Handle add date range
  const handleAddDateRange = async () => {
    setSuccessMessage('');

    if (!startDate || !endDate) {
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      dispatch(clearError());
      return;
    }

    const result = await dispatch(
      addBlockedDateRange({
        startDate,
        endDate,
        reason: reason || undefined
      })
    );

    if (addBlockedDateRange.fulfilled.match(result)) {
      const { blockedCount, skippedCount } = result.payload;
      let message = `${blockedCount} fecha(s) bloqueada(s) correctamente`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} ya estaban bloqueadas)`;
      }
      setSuccessMessage(message);
      setStartDate(getTodayForInput());
      setEndDate(getTodayForInput());
      setReason('');
      // Refetch to get all blocked dates
      dispatch(getBlockedDates());
    }
  };

  // Handle remove blocked date
  const handleRemoveBlockedDate = async (id: string) => {
    setSuccessMessage('');
    const result = await dispatch(removeBlockedDate(id));

    if (removeBlockedDate.fulfilled.match(result)) {
      setSuccessMessage('Fecha desbloqueada correctamente');
    }
  };

  // Handle form submit based on mode
  const handleSubmit = () => {
    if (mode === 'single') {
      handleAddSingleDate();
    } else {
      handleAddDateRange();
    }
  };

  return (
    <div className="mx-auto max-w-4xl zoom-in-normal">
      {/* Header Section */}
      <BlockedDatesHeader error={error} successMessage={successMessage} />

      {/* Form Section */}
      <BlockedDateForm
        mode={mode}
        singleDate={singleDate}
        startDate={startDate}
        endDate={endDate}
        reason={reason}
        onModeChange={setMode}
        onSingleDateChange={setSingleDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReasonChange={setReason}
        onSubmit={handleSubmit}
      />

      {/* List Section */}
      <BlockedDatesList
        blockedDates={blockedDates}
        onRemove={handleRemoveBlockedDate}
      />

      {/* Help Section */}
      <BlockedDatesHelpSection />
    </div>
  );
};

export default BlockedDatesPage;
