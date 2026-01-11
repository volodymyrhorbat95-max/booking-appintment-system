import type { Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { FieldType } from '../types';

// ============================================
// CUSTOM FORM FIELDS MANAGEMENT
// Fixed fields (always present): firstName, lastName, whatsappNumber, email
// Professional can add/edit/remove custom fields
// ============================================

// Fixed fields that cannot be removed or modified
const FIXED_FIELDS = [
  {
    id: 'fixed-firstName',
    fieldName: 'Nombre',
    fieldType: 'TEXT' as const,
    isRequired: true,
    displayOrder: 1,
    options: [],
    isFixed: true
  },
  {
    id: 'fixed-lastName',
    fieldName: 'Apellido',
    fieldType: 'TEXT' as const,
    isRequired: true,
    displayOrder: 2,
    options: [],
    isFixed: true
  },
  {
    id: 'fixed-whatsappNumber',
    fieldName: 'WhatsApp',
    fieldType: 'TEXT' as const,
    isRequired: true,
    displayOrder: 3,
    options: [],
    isFixed: true
  },
  {
    id: 'fixed-email',
    fieldName: 'Email',
    fieldType: 'TEXT' as const,
    isRequired: true,
    displayOrder: 4,
    options: [],
    isFixed: true
  }
];

// Get all form fields for the professional (fixed + custom)
export const getFormFields = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Get custom fields
    const customFields = await prisma.customFormField.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    // Combine fixed and custom fields
    const allFields = [
      ...FIXED_FIELDS,
      ...customFields.map((field) => ({
        ...field,
        isFixed: false
      }))
    ];

    return res.json({
      success: true,
      data: {
        fixedFields: FIXED_FIELDS,
        customFields: customFields.map((field) => ({
          ...field,
          isFixed: false
        })),
        allFields
      }
    });
  } catch (error) {
    logger.error('Error getting form fields:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener campos del formulario'
    });
  }
};

// Add a custom field
export const addCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fieldName, fieldType, isRequired, options } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    // Validate input
    if (!fieldName || !fieldName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del campo es requerido'
      });
    }

    // Validate field type
    const validFieldTypes = Object.values(FieldType);
    if (fieldType && !validFieldTypes.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de campo inválido'
      });
    }

    // Validate options for dropdown type
    if (fieldType === FieldType.DROPDOWN && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({
        success: false,
        error: 'Los campos de tipo lista deben tener al menos 2 opciones'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Get current max display order
    const maxOrderField = await prisma.customFormField.findFirst({
      where: { professionalId: professional.id },
      orderBy: { displayOrder: 'desc' }
    });

    const newDisplayOrder = (maxOrderField?.displayOrder || FIXED_FIELDS.length) + 1;

    // Create custom field
    const newField = await prisma.customFormField.create({
      data: {
        professionalId: professional.id,
        fieldName: fieldName.trim(),
        fieldType: fieldType || FieldType.TEXT,
        isRequired: isRequired || false,
        displayOrder: newDisplayOrder,
        options: fieldType === FieldType.DROPDOWN ? options : [],
        isActive: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Campo personalizado creado correctamente',
      data: {
        ...newField,
        isFixed: false
      }
    });
  } catch (error) {
    logger.error('Error adding custom field:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear campo personalizado'
    });
  }
};

// Update a custom field
export const updateCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { fieldName, fieldType, isRequired, options } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID del campo requerido'
      });
    }

    // Check if trying to modify a fixed field
    if (id.startsWith('fixed-')) {
      return res.status(400).json({
        success: false,
        error: 'No se pueden modificar los campos fijos'
      });
    }

    // Validate input
    if (!fieldName || !fieldName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del campo es requerido'
      });
    }

    // Validate field type
    const validFieldTypes = Object.values(FieldType);
    if (fieldType && !validFieldTypes.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de campo inválido'
      });
    }

    // Validate options for dropdown type
    if (fieldType === FieldType.DROPDOWN && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({
        success: false,
        error: 'Los campos de tipo lista deben tener al menos 2 opciones'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Find the field
    const field = await prisma.customFormField.findUnique({
      where: { id }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Campo no encontrado'
      });
    }

    // Verify ownership
    if (field.professionalId !== professional.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para modificar este campo'
      });
    }

    // Update the field
    const updatedField = await prisma.customFormField.update({
      where: { id },
      data: {
        fieldName: fieldName.trim(),
        fieldType: fieldType || field.fieldType,
        isRequired: isRequired !== undefined ? isRequired : field.isRequired,
        options: fieldType === FieldType.DROPDOWN ? options : []
      }
    });

    return res.json({
      success: true,
      message: 'Campo actualizado correctamente',
      data: {
        ...updatedField,
        isFixed: false
      }
    });
  } catch (error) {
    logger.error('Error updating custom field:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar campo personalizado'
    });
  }
};

// Delete a custom field (soft delete by setting isActive = false)
export const deleteCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID del campo requerido'
      });
    }

    // Check if trying to delete a fixed field
    if (id.startsWith('fixed-')) {
      return res.status(400).json({
        success: false,
        error: 'No se pueden eliminar los campos fijos'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Find the field
    const field = await prisma.customFormField.findUnique({
      where: { id }
    });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Campo no encontrado'
      });
    }

    // Verify ownership
    if (field.professionalId !== professional.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar este campo'
      });
    }

    // Soft delete the field
    await prisma.customFormField.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Campo eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error deleting custom field:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar campo personalizado'
    });
  }
};

// Reorder custom fields
export const reorderCustomFields = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fieldIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de IDs de campos requerida'
      });
    }

    // Get professional from user
    const professional = await prisma.professional.findUnique({
      where: { userId }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Verify all fields belong to this professional
    const fields = await prisma.customFormField.findMany({
      where: {
        id: { in: fieldIds },
        professionalId: professional.id,
        isActive: true
      }
    });

    if (fields.length !== fieldIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Algunos campos no fueron encontrados o no te pertenecen'
      });
    }

    // Update display order for each field
    // Start after fixed fields (display order 5+)
    const updates = fieldIds.map((fieldId: string, index: number) =>
      prisma.customFormField.update({
        where: { id: fieldId },
        data: { displayOrder: FIXED_FIELDS.length + index + 1 }
      })
    );

    await prisma.$transaction(updates);

    // Get updated fields
    const updatedFields = await prisma.customFormField.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    return res.json({
      success: true,
      message: 'Orden de campos actualizado',
      data: updatedFields.map((field) => ({
        ...field,
        isFixed: false
      }))
    });
  } catch (error) {
    logger.error('Error reordering custom fields:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al reordenar campos'
    });
  }
};

// Get form fields for public booking page (by professional slug)
export const getPublicFormFields = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug del profesional requerido'
      });
    }

    // Get professional by slug
    const professional = await prisma.professional.findUnique({
      where: { slug }
    });

    if (!professional || !professional.isActive || professional.isSuspended) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado'
      });
    }

    // Get custom fields
    const customFields = await prisma.customFormField.findMany({
      where: {
        professionalId: professional.id,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        fieldName: true,
        fieldType: true,
        isRequired: true,
        displayOrder: true,
        options: true
      }
    });

    // Combine fixed and custom fields for the booking form
    const allFields = [
      ...FIXED_FIELDS.map((f) => ({
        id: f.id,
        fieldName: f.fieldName,
        fieldType: f.fieldType,
        isRequired: f.isRequired,
        displayOrder: f.displayOrder,
        options: f.options,
        isFixed: true
      })),
      ...customFields.map((field) => ({
        ...field,
        isFixed: false
      }))
    ];

    return res.json({
      success: true,
      data: allFields
    });
  } catch (error) {
    logger.error('Error getting public form fields:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener campos del formulario'
    });
  }
};
