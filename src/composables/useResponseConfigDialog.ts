/**
 * Composable for managing the response config create/edit dialog
 */

import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { responseConfigsApi } from '@/api/responseConfigs.api'
import type {
  ResponseConfig,
  ResponseConfigCreate,
  ResponseConfigUpdate,
  ResponseConfigFormData
} from '@/types/responseConfigs.types'
import { DEFAULT_RESPONSE_CONFIG_FORM } from '@/types/responseConfigs.types'
import type { DomainKey } from '@/types/domainIntents.types'

export function useResponseConfigDialog(
  selectedDomain: { value: DomainKey | null },
  organizationId: { value: string | null },
  loadConfigs: () => Promise<void>
) {
  const toast = useToast()

  // State
  const showDialog = ref(false)
  const saving = ref(false)
  const editingConfig = ref<ResponseConfig | null>(null)
  const formData = ref<ResponseConfigFormData>({ ...DEFAULT_RESPONSE_CONFIG_FORM })

  // Computed-like
  const isEditing = () => editingConfig.value !== null
  const dialogTitle = () => (isEditing() ? 'Editar Configuración' : 'Nueva Configuración')
  const submitLabel = () => (isEditing() ? 'Guardar Cambios' : 'Crear Configuración')

  // Actions
  function openCreateDialog() {
    editingConfig.value = null
    formData.value = { ...DEFAULT_RESPONSE_CONFIG_FORM }
    showDialog.value = true
  }

  function openEditDialog(config: ResponseConfig) {
    editingConfig.value = config
    formData.value = {
      intent_key: config.intent_key,
      display_name: config.display_name || '',
      description: config.description || '',
      task_description: config.task_description,
      fallback_template_key: config.fallback_template_key,
      priority: config.priority,
      is_critical: config.is_critical,
      is_enabled: config.is_enabled
    }
    showDialog.value = true
  }

  function closeDialog() {
    showDialog.value = false
    editingConfig.value = null
  }

  async function saveConfig() {
    if (!selectedDomain.value || !organizationId.value) return

    // Validation
    if (!formData.value.intent_key.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El intent key es requerido',
        life: 3000
      })
      return
    }

    if (!formData.value.task_description.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La descripción de tarea es requerida',
        life: 3000
      })
      return
    }

    if (!formData.value.fallback_template_key.trim()) {
      toast.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El fallback template key es requerido',
        life: 3000
      })
      return
    }

    saving.value = true
    try {
      if (editingConfig.value) {
        // Update existing
        const updateData: ResponseConfigUpdate = {
          is_critical: formData.value.is_critical,
          task_description: formData.value.task_description,
          fallback_template_key: formData.value.fallback_template_key,
          display_name: formData.value.display_name || null,
          description: formData.value.description || null,
          priority: formData.value.priority,
          is_enabled: formData.value.is_enabled
        }
        await responseConfigsApi.updateConfig(editingConfig.value.id, updateData)
        toast.add({
          severity: 'success',
          summary: 'Configuración actualizada',
          detail: `"${formData.value.display_name || formData.value.intent_key}" guardada correctamente`,
          life: 3000
        })
      } else {
        // Create new
        const createData: ResponseConfigCreate = {
          organization_id: organizationId.value,
          domain_key: selectedDomain.value,
          intent_key: formData.value.intent_key,
          is_critical: formData.value.is_critical,
          task_description: formData.value.task_description,
          fallback_template_key: formData.value.fallback_template_key,
          display_name: formData.value.display_name || null,
          description: formData.value.description || null,
          priority: formData.value.priority,
          is_enabled: formData.value.is_enabled
        }
        await responseConfigsApi.createConfig(createData)
        toast.add({
          severity: 'success',
          summary: 'Configuración creada',
          detail: `"${formData.value.display_name || formData.value.intent_key}" creada correctamente`,
          life: 3000
        })
      }
      closeDialog()
      await loadConfigs()
    } catch (error: unknown) {
      console.error('Error saving config:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar la configuración'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000
      })
    } finally {
      saving.value = false
    }
  }

  return {
    // State
    showDialog,
    saving,
    editingConfig,
    formData,

    // Computed-like
    isEditing,
    dialogTitle,
    submitLabel,

    // Actions
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveConfig
  }
}
