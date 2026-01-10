/**
 * Composable for managing the intent create/edit dialog
 */

import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { domainIntentsApi } from '@/api/domainIntents.api'
import type {
  DomainIntent,
  DomainKey,
  IntentCreate,
  IntentUpdate
} from '@/types/domainIntents.types'

interface IntentFormData extends IntentCreate {
  is_enabled: boolean
  exact_match: boolean
}

const defaultFormData: IntentFormData = {
  intent_key: '',
  name: '',
  description: '',
  weight: 1.0,
  priority: 50,
  is_enabled: true,
  exact_match: false
}

export function useIntentDialog(
  selectedDomain: { value: DomainKey | null },
  organizationId: { value: string | null },
  loadIntents: () => Promise<void>
) {
  const toast = useToast()

  // State
  const showDialog = ref(false)
  const saving = ref(false)
  const editingIntent = ref<DomainIntent | null>(null)
  const formData = ref<IntentFormData>({ ...defaultFormData })

  // Computed-like
  const isEditing = () => editingIntent.value !== null
  const dialogTitle = () => (isEditing() ? 'Editar Intent' : 'Nuevo Intent')
  const submitLabel = () => (isEditing() ? 'Guardar Cambios' : 'Crear Intent')

  // Actions
  function openCreateDialog() {
    editingIntent.value = null
    formData.value = { ...defaultFormData }
    showDialog.value = true
  }

  function openEditDialog(intent: DomainIntent) {
    editingIntent.value = intent
    formData.value = {
      intent_key: intent.intent_key,
      name: intent.name,
      description: intent.description || '',
      weight: intent.weight,
      priority: intent.priority,
      is_enabled: intent.is_enabled,
      exact_match: intent.exact_match
    }
    showDialog.value = true
  }

  function closeDialog() {
    showDialog.value = false
    editingIntent.value = null
  }

  async function saveIntent() {
    if (!selectedDomain.value || !organizationId.value) return

    saving.value = true
    try {
      if (editingIntent.value) {
        // Update existing
        const updateData: IntentUpdate = {
          name: formData.value.name,
          description: formData.value.description || null,
          weight: formData.value.weight,
          priority: formData.value.priority,
          is_enabled: formData.value.is_enabled,
          exact_match: formData.value.exact_match
        }
        await domainIntentsApi.updateIntent(
          selectedDomain.value,
          editingIntent.value.id,
          updateData
        )
        toast.add({
          severity: 'success',
          summary: 'Intent actualizado',
          detail: `"${formData.value.name}" guardado correctamente`,
          life: 3000
        })
      } else {
        // Create new
        const createData: IntentCreate = {
          intent_key: formData.value.intent_key,
          name: formData.value.name,
          description: formData.value.description || null,
          weight: formData.value.weight,
          priority: formData.value.priority,
          is_enabled: formData.value.is_enabled,
          exact_match: formData.value.exact_match
        }
        await domainIntentsApi.createIntent(
          selectedDomain.value,
          organizationId.value,
          createData
        )
        toast.add({
          severity: 'success',
          summary: 'Intent creado',
          detail: `"${formData.value.name}" creado correctamente`,
          life: 3000
        })
      }
      closeDialog()
      await loadIntents()
    } catch (error: unknown) {
      console.error('Error saving intent:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el intent'
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
    editingIntent,
    formData,

    // Computed-like
    isEditing,
    dialogTitle,
    submitLabel,

    // Actions
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveIntent
  }
}
