/**
 * Composable for managing the response config create/edit dialog
 */

import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { responseConfigsApi } from '@/api/responseConfigs.api'
import type {
  ResponseConfig,
  ResponseConfigCreate,
  ResponseConfigUpdate,
  ResponseConfigFormData,
  ResponseParam,
  ValidationWarning
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

  // Validation warnings from last save
  const saveWarnings = ref<ValidationWarning[]>([])

  // Parameter registry
  const availableParams = ref<ResponseParam[]>([])
  const loadingParams = ref(false)

  // Computed-like
  const isEditing = () => editingConfig.value !== null
  const dialogTitle = () => (isEditing() ? 'Editar Configuración' : 'Nueva Configuración')
  const submitLabel = () => (isEditing() ? 'Guardar Cambios' : 'Crear Configuración')

  // Load available params when domain changes
  async function loadParams(domain: string) {
    loadingParams.value = true
    try {
      availableParams.value = await responseConfigsApi.getAvailableParams(domain)
    } catch (error) {
      console.error('Error loading params:', error)
      availableParams.value = []
    } finally {
      loadingParams.value = false
    }
  }

  // Watch domain changes to load params
  watch(
    () => selectedDomain.value,
    (newDomain) => {
      if (newDomain) {
        loadParams(newDomain)
      }
    },
    { immediate: true }
  )

  // Actions
  function openCreateDialog() {
    editingConfig.value = null
    formData.value = { ...DEFAULT_RESPONSE_CONFIG_FORM }
    saveWarnings.value = []
    showDialog.value = true
  }

  function openEditDialog(config: ResponseConfig) {
    editingConfig.value = config
    saveWarnings.value = []
    formData.value = {
      intent_key: config.intent_key,
      display_name: config.display_name || '',
      description: config.description || '',
      task_description: config.task_description,
      fallback_template_key: config.fallback_template_key,
      response_type: config.response_type || 'fixed',
      template_text: config.template_text || '',
      buttons: config.buttons ? [...config.buttons] : [],
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
    saveWarnings.value = []
    try {
      let result: ResponseConfig
      if (editingConfig.value) {
        // Update existing
        const updateData: ResponseConfigUpdate = {
          is_critical: formData.value.is_critical,
          task_description: formData.value.task_description,
          fallback_template_key: formData.value.fallback_template_key,
          response_type: formData.value.response_type,
          template_text: formData.value.template_text || null,
          buttons: formData.value.buttons.length > 0 ? formData.value.buttons : null,
          display_name: formData.value.display_name || null,
          description: formData.value.description || null,
          priority: formData.value.priority,
          is_enabled: formData.value.is_enabled
        }
        result = await responseConfigsApi.updateConfig(editingConfig.value.id, updateData)
      } else {
        // Create new
        const createData: ResponseConfigCreate = {
          organization_id: organizationId.value,
          domain_key: selectedDomain.value,
          intent_key: formData.value.intent_key,
          is_critical: formData.value.is_critical,
          task_description: formData.value.task_description,
          fallback_template_key: formData.value.fallback_template_key,
          response_type: formData.value.response_type,
          template_text: formData.value.template_text || null,
          buttons: formData.value.buttons.length > 0 ? formData.value.buttons : null,
          display_name: formData.value.display_name || null,
          description: formData.value.description || null,
          priority: formData.value.priority,
          is_enabled: formData.value.is_enabled
        }
        result = await responseConfigsApi.createConfig(createData)
      }

      // Capture inline validation warnings from response
      const warnings = result.warnings ?? []
      saveWarnings.value = warnings

      if (warnings.length > 0) {
        const critical = warnings.filter(w => w.severity === 'critical').length
        toast.add({
          severity: critical > 0 ? 'warn' : 'info',
          summary: 'Guardado con avisos',
          detail: `${warnings.length} aviso(s) de validación detectado(s)`,
          life: 5000
        })
      } else {
        toast.add({
          severity: 'success',
          summary: isEditing() ? 'Configuración actualizada' : 'Configuración creada',
          detail: `"${formData.value.display_name || formData.value.intent_key}" guardada correctamente`,
          life: 3000
        })
        closeDialog()
      }
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
    saveWarnings,

    // Params
    availableParams,
    loadingParams,

    // Computed-like
    isEditing,
    dialogTitle,
    submitLabel,

    // Actions
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveConfig,
    loadParams
  }
}
