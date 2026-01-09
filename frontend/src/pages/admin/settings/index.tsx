import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getSettings,
  updateSettings,
  clearError,
  clearSuccessMessage
} from '../../../store/slices/adminSlice';
import SettingsHeader from './SettingsHeader';
import GeneralSettingsSection from './GeneralSettingsSection';
import RegionalSettingsSection from './RegionalSettingsSection';
import SettingsInfoBox from './SettingsInfoBox';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const AdminSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { settings, error, successMessage } = useAppSelector((state) => state.admin);

  // Local form state
  const [formData, setFormData] = useState({
    platformName: '',
    defaultTimezone: 'America/Argentina/Buenos_Aires',
    defaultCountryCode: '+54',
    supportEmail: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings
  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        platformName: settings.platformName || '',
        defaultTimezone: settings.defaultTimezone || 'America/Argentina/Buenos_Aires',
        defaultCountryCode: settings.defaultCountryCode || '+54',
        supportEmail: settings.supportEmail || ''
      });
      setHasChanges(false);
    }
  }, [settings]);

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

  // Handle field change
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    await dispatch(updateSettings(formData));
    setHasChanges(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <SettingsHeader error={error} successMessage={successMessage} />

      {/* Settings Form */}
      <div className="rounded-lg bg-white shadow-sm">
        {/* General Settings */}
        <GeneralSettingsSection
          platformName={formData.platformName}
          supportEmail={formData.supportEmail}
          onChange={handleChange}
        />

        {/* Regional Settings */}
        <RegionalSettingsSection
          defaultTimezone={formData.defaultTimezone}
          defaultCountryCode={formData.defaultCountryCode}
          hasChanges={hasChanges}
          onChange={handleChange}
          onSave={handleSave}
        />
      </div>

      {/* Info Box */}
      <SettingsInfoBox />
    </div>
  );
};

export default AdminSettingsPage;
