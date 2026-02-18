<script setup lang="ts">
/**
 * HumanHandoffTab - Configure which specialties trigger human handoff.
 *
 * Fetches specialties from HCWeb via backend proxy, displays as a checklist.
 * Selected specialties are persisted in settings.workflow.human_handoff_specialties.
 */

import { ref, computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import { tenantInstitutionConfigApi } from '@/api/tenantInstitutionConfig.api'
import type { WorkflowSettings } from '@/types/tenantInstitutionConfig.types'

// ============================================================
// Props & Model
// ============================================================

interface Props {
  orgId?: string
  configId?: string
  isEditing: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orgId: undefined,
  configId: undefined
})

const model = defineModel<WorkflowSettings>({ required: true })

// ============================================================
// State
// ============================================================

const availableSpecialties = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const error = ref('')
const loaded = ref(false)
const searchQuery = ref('')

// ============================================================
// Computed
// ============================================================

const canFetch = computed(() => props.isEditing && props.orgId && props.configId)

const filteredSpecialties = computed(() => {
  if (!searchQuery.value) return availableSpecialties.value
  const q = searchQuery.value.toLowerCase()
  return availableSpecialties.value.filter((s) => s.name.toLowerCase().includes(q))
})

const selectedCount = computed(() => model.value.human_handoff_specialties.length)

// ============================================================
// Methods
// ============================================================

async function fetchSpecialties() {
  if (!props.orgId || !props.configId) return

  loading.value = true
  error.value = ''

  try {
    availableSpecialties.value = await tenantInstitutionConfigApi.fetchSpecialties(
      props.orgId,
      props.configId
    )
    loaded.value = true
  } catch (e: any) {
    error.value = e.response?.data?.detail || e.message || 'Error al cargar especialidades'
  } finally {
    loading.value = false
  }
}

function isSelected(name: string): boolean {
  return model.value.human_handoff_specialties.some(
    (s) => s.toUpperCase() === name.toUpperCase()
  )
}

function toggleSpecialty(name: string) {
  const list = [...model.value.human_handoff_specialties]
  const idx = list.findIndex((s) => s.toUpperCase() === name.toUpperCase())
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(name)
  }
  model.value = { ...model.value, human_handoff_specialties: list }
}

function removeSpecialty(name: string) {
  const list = model.value.human_handoff_specialties.filter(
    (s) => s.toUpperCase() !== name.toUpperCase()
  )
  model.value = { ...model.value, human_handoff_specialties: list }
}
</script>

<template>
  <div class="human-handoff-tab space-y-4">
    <!-- Info header -->
    <Message severity="info" :closable="false">
      <i class="pi pi-info-circle mr-2" />
      Las especialidades seleccionadas derivaran automaticamente al agente humano cuando un
      paciente las elija.
    </Message>

    <!-- Currently selected (always visible as tags) -->
    <div v-if="selectedCount > 0">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Especialidades con handoff ({{ selectedCount }})
      </label>
      <div class="flex flex-wrap gap-2">
        <Tag
          v-for="name in model.human_handoff_specialties"
          :key="name"
          :value="name"
          severity="warn"
          class="cursor-pointer"
          @click="removeSpecialty(name)"
        >
          <template #default>
            {{ name }}
            <i class="pi pi-times ml-1 text-xs" />
          </template>
        </Tag>
      </div>
    </div>

    <!-- Not editing message -->
    <Message v-if="!canFetch" severity="warn" :closable="false">
      <i class="pi pi-exclamation-triangle mr-2" />
      Guarde la institucion primero para poder cargar especialidades desde HCWeb.
    </Message>

    <!-- Fetch button + specialty list -->
    <template v-if="canFetch">
      <div class="flex items-center gap-3">
        <Button
          :label="loaded ? 'Recargar Especialidades' : 'Cargar Especialidades desde HCWeb'"
          :icon="loaded ? 'pi pi-refresh' : 'pi pi-download'"
          :loading="loading"
          severity="secondary"
          @click="fetchSpecialties"
        />
        <span v-if="loaded" class="text-sm text-muted-foreground">
          {{ availableSpecialties.length }} especialidades encontradas
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-4">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <!-- Error -->
      <Message v-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Specialty checklist -->
      <div v-if="loaded && !loading && availableSpecialties.length > 0" class="space-y-3">
        <!-- Search filter -->
        <div class="field">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar especialidad..."
              class="w-full"
            />
          </span>
        </div>

        <!-- Checkbox list -->
        <div class="max-h-80 overflow-y-auto border rounded-md p-3 space-y-2">
          <div
            v-for="specialty in filteredSpecialties"
            :key="specialty.id"
            class="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            @click="toggleSpecialty(specialty.name)"
          >
            <Checkbox
              :modelValue="isSelected(specialty.name)"
              :binary="true"
              :inputId="`spec_${specialty.id}`"
              @click.stop
              @update:modelValue="toggleSpecialty(specialty.name)"
            />
            <label :for="`spec_${specialty.id}`" class="text-sm cursor-pointer select-none">
              {{ specialty.name }}
            </label>
          </div>
          <div
            v-if="filteredSpecialties.length === 0"
            class="text-sm text-muted-foreground text-center py-2"
          >
            No se encontraron especialidades con ese filtro.
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
