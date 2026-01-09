import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  reorderPlans,
  clearError,
  clearSuccessMessage
} from '../../../store/slices/adminSlice';
import type { AdminPlan } from '../../../types';
import PlansHeader from './PlansHeader';
import PlansGrid from './PlansGrid';
import PlanFormModal from './PlanFormModal';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Page load → dispatch action → API call → state updates → component renders
// RULE: NO direct API calls from component
// RULE: Global loading spinner during requests

interface PlanFormData {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive: boolean;
}

const emptyFormData: PlanFormData = {
  name: '',
  description: '',
  monthlyPrice: 0,
  annualPrice: 0,
  features: [],
  isActive: true
};

const AdminPlansPage = () => {
  const dispatch = useAppDispatch();
  const { plans, error, successMessage } = useAppSelector((state) => state.admin);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyFormData);
  const [newFeature, setNewFeature] = useState('');

  // Load plans
  useEffect(() => {
    dispatch(getPlans());
  }, [dispatch]);

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

  // Open modal for new plan
  const handleNewPlan = () => {
    setEditingPlan(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditPlan = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      features: [...plan.features],
      isActive: plan.isActive
    });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormData(emptyFormData);
    setNewFeature('');
  };

  // Add feature
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  // Remove feature
  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Form change handler
  const handleFormChange = (data: Partial<PlanFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Save plan
  const handleSave = async () => {
    if (!formData.name || formData.monthlyPrice <= 0 || formData.annualPrice <= 0) {
      return;
    }

    if (editingPlan) {
      await dispatch(updatePlan({
        id: editingPlan.id,
        ...formData
      }));
    } else {
      await dispatch(createPlan(formData));
    }

    handleCloseModal();
  };

  // Delete plan
  const handleDeletePlan = async (plan: AdminPlan) => {
    if (plan.subscribersCount > 0) {
      alert('No se puede eliminar un plan con suscriptores activos. Desactívalo en su lugar.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar el plan "${plan.name}"?`)) {
      await dispatch(deletePlan(plan.id));
    }
  };

  // Toggle plan active status
  const handleToggleActive = async (plan: AdminPlan) => {
    await dispatch(updatePlan({
      id: plan.id,
      isActive: !plan.isActive
    }));
  };

  // Move plan up in display order
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newPlans = [...plans];
    [newPlans[index - 1], newPlans[index]] = [newPlans[index], newPlans[index - 1]];
    const planIds = newPlans.map(p => p.id);
    await dispatch(reorderPlans(planIds));
  };

  // Move plan down in display order
  const handleMoveDown = async (index: number) => {
    if (index === plans.length - 1) return;
    const newPlans = [...plans];
    [newPlans[index], newPlans[index + 1]] = [newPlans[index + 1], newPlans[index]];
    const planIds = newPlans.map(p => p.id);
    await dispatch(reorderPlans(planIds));
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <PlansHeader
        error={error}
        successMessage={successMessage}
        onNewPlan={handleNewPlan}
      />

      {/* Plans Grid */}
      <PlansGrid
        plans={plans}
        onEdit={handleEditPlan}
        onToggleActive={handleToggleActive}
        onDelete={handleDeletePlan}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      {/* Modal */}
      <PlanFormModal
        isOpen={isModalOpen}
        editingPlan={editingPlan}
        formData={formData}
        newFeature={newFeature}
        onClose={handleCloseModal}
        onSave={handleSave}
        onFormChange={handleFormChange}
        onNewFeatureChange={setNewFeature}
        onAddFeature={handleAddFeature}
        onRemoveFeature={handleRemoveFeature}
      />
    </div>
  );
};

export default AdminPlansPage;
