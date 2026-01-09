import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getDepositSettings,
  updateDepositSettings,
  clearError
} from '../../../store/slices/depositSettingsSlice';
import DepositHeader from './DepositHeader';
import DepositForm from './DepositForm';
import DepositInfoSection from './DepositInfoSection';
import DepositBenefits from './DepositBenefits';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const DepositSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { depositEnabled, depositAmount, error } = useAppSelector(
    (state) => state.depositSettings
  );

  // Local state for form
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load deposit settings on mount
  useEffect(() => {
    dispatch(getDepositSettings());
  }, [dispatch]);

  // Initialize form when data loads
  useEffect(() => {
    setEnabled(depositEnabled);
    setAmount(depositAmount ? depositAmount.toString() : '');
  }, [depositEnabled, depositAmount]);

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

  // Handle save
  const handleSave = async () => {
    setSuccessMessage('');

    // Validate amount if enabled
    if (enabled) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return;
      }
    }

    const result = await dispatch(
      updateDepositSettings({
        depositEnabled: enabled,
        depositAmount: enabled ? parseFloat(amount) : null
      })
    );

    if (updateDepositSettings.fulfilled.match(result)) {
      setSuccessMessage(
        enabled
          ? 'Depósito habilitado correctamente'
          : 'Depósito deshabilitado correctamente'
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl zoom-in-normal">
      {/* Header Section */}
      <DepositHeader error={error} successMessage={successMessage} />

      {/* Form Section */}
      <DepositForm
        enabled={enabled}
        amount={amount}
        onEnabledChange={setEnabled}
        onAmountChange={setAmount}
        onSave={handleSave}
      />

      {/* Info Section */}
      <DepositInfoSection />

      {/* Benefits Section */}
      <DepositBenefits />
    </div>
  );
};

export default DepositSettingsPage;
