import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getFormFields,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  clearError
} from '../../../store/slices/customFormFieldsSlice';
import FormFieldsHeader from './FormFieldsHeader';
import FixedFieldsList from './FixedFieldsList';
import CustomFieldItem, { type CustomField } from './CustomFieldItem';
import FieldEditForm, { type EditingField } from './FieldEditForm';
import FormFieldsHelpSection from './FormFieldsHelpSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

const initialEditingField: EditingField = {
  fieldName: '',
  fieldType: 'TEXT',
  isRequired: false,
  options: []
};

const FormFieldsPage = () => {
  const dispatch = useAppDispatch();
  const { fixedFields, customFields, error } = useAppSelector((state) => state.customFormFields);

  // Local state
  const [isAddingField, setIsAddingField] = useState(false);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [newField, setNewField] = useState<EditingField>(initialEditingField);
  const [successMessage, setSuccessMessage] = useState('');

  // Load form fields on mount
  useEffect(() => {
    dispatch(getFormFields());
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

  // Handle add new field
  const handleAddField = async () => {
    if (!newField.fieldName.trim()) {
      return;
    }

    if (newField.fieldType === 'DROPDOWN' && newField.options.length < 2) {
      return;
    }

    const result = await dispatch(
      addCustomField({
        fieldName: newField.fieldName.trim(),
        fieldType: newField.fieldType,
        isRequired: newField.isRequired,
        options: newField.fieldType === 'DROPDOWN' ? newField.options : undefined
      })
    );

    if (addCustomField.fulfilled.match(result)) {
      setSuccessMessage('Campo creado correctamente');
      setNewField(initialEditingField);
      setIsAddingField(false);
    }
  };

  // Handle update field
  const handleUpdateField = async () => {
    if (!editingField || !editingField.id || !editingField.fieldName.trim()) {
      return;
    }

    if (editingField.fieldType === 'DROPDOWN' && editingField.options.length < 2) {
      return;
    }

    const result = await dispatch(
      updateCustomField({
        id: editingField.id,
        fieldName: editingField.fieldName.trim(),
        fieldType: editingField.fieldType,
        isRequired: editingField.isRequired,
        options: editingField.fieldType === 'DROPDOWN' ? editingField.options : undefined
      })
    );

    if (updateCustomField.fulfilled.match(result)) {
      setSuccessMessage('Campo actualizado correctamente');
      setEditingField(null);
    }
  };

  // Handle delete field
  const handleDeleteField = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este campo?')) {
      return;
    }

    const result = await dispatch(deleteCustomField(id));

    if (deleteCustomField.fulfilled.match(result)) {
      setSuccessMessage('Campo eliminado correctamente');
    }
  };

  // Start editing a field
  const startEditing = (field: CustomField) => {
    setEditingField({
      id: field.id,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      options: field.options || []
    });
    setIsAddingField(false);
  };

  // Cancel editing/adding
  const cancelEdit = () => {
    setEditingField(null);
    setIsAddingField(false);
    setNewField(initialEditingField);
  };

  return (
    <div className="mx-auto max-w-4xl zoom-in-normal">
      {/* Header Section */}
      <FormFieldsHeader error={error} successMessage={successMessage} />

      {/* Fixed Fields Section */}
      <FixedFieldsList fields={fixedFields} />

      {/* Custom Fields Section */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm fade-left-normal">
        <div className="mb-4 flex items-center justify-between fade-down-fast">
          <h2 className="text-lg font-medium text-gray-900">Campos Personalizados</h2>
          {!isAddingField && !editingField && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsAddingField(true)}
              startIcon={<AddIcon />}
              className="zoom-in-fast"
            >
              Agregar Campo
            </Button>
          )}
        </div>

        {/* Existing custom fields list */}
        {customFields.length === 0 && !isAddingField ? (
          <p className="text-sm text-gray-500 fade-up-fast">
            No hay campos personalizados. Agrega campos adicionales para recopilar más información de tus pacientes.
          </p>
        ) : (
          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div key={field.id}>
                {editingField?.id === field.id ? (
                  <FieldEditForm
                    field={editingField}
                    isNew={false}
                    onFieldChange={setEditingField}
                    onSave={handleUpdateField}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <CustomFieldItem
                    field={field}
                    onEdit={startEditing}
                    onDelete={handleDeleteField}
                    animationIndex={index}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new field form */}
        {isAddingField && (
          <div className="mt-4">
            <FieldEditForm
              field={newField}
              isNew={true}
              onFieldChange={setNewField}
              onSave={handleAddField}
              onCancel={cancelEdit}
            />
          </div>
        )}
      </div>

      {/* Help Section */}
      <FormFieldsHelpSection />
    </div>
  );
};

export default FormFieldsPage;
