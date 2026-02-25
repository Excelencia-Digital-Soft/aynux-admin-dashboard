<script setup lang="ts">
/**
 * HumanHandoffTab - Configure which specialties trigger human handoff.
 *
 * Fetches specialties from HCWeb via backend proxy, displays as a checklist.
 * Selected specialties are persisted in settings.workflow.human_handoff_specialties.
 */

import { ref, computed } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  <div class="space-y-4">
    <!-- Info header -->
    <Alert>
      <AlertDescription>
        <i class="pi pi-info-circle mr-2" />
        Las especialidades seleccionadas derivaran automaticamente al agente humano cuando un
        paciente las elija.
      </AlertDescription>
    </Alert>

    <!-- Currently selected -->
    <div v-if="selectedCount > 0">
      <label class="block text-sm font-medium text-foreground mb-2">
        Especialidades con handoff ({{ selectedCount }})
      </label>
      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="name in model.human_handoff_specialties"
          :key="name"
          variant="warning"
          class="cursor-pointer"
          @click="removeSpecialty(name)"
        >
          {{ name }}
          <i class="pi pi-times ml-1 text-xs" />
        </Badge>
      </div>
    </div>

    <!-- Not editing message -->
    <Alert v-if="!canFetch" variant="warning">
      <AlertDescription>
        <i class="pi pi-exclamation-triangle mr-2" />
        Guarde la institucion primero para poder cargar especialidades desde HCWeb.
      </AlertDescription>
    </Alert>

    <!-- Fetch button + specialty list -->
    <template v-if="canFetch">
      <div class="flex items-center gap-3">
        <Button
          variant="secondary"
          :disabled="loading"
          @click="fetchSpecialties"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner mr-2' : (loaded ? 'pi pi-refresh mr-2' : 'pi pi-download mr-2')" />
          {{ loaded ? 'Recargar Especialidades' : 'Cargar Especialidades desde HCWeb' }}
        </Button>
        <span v-if="loaded" class="text-sm text-muted-foreground">
          {{ availableSpecialties.length }} especialidades encontradas
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-4">
        <i class="pi pi-spin pi-spinner text-2xl text-primary" />
      </div>

      <!-- Error -->
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- Specialty checklist -->
      <div v-if="loaded && !loading && availableSpecialties.length > 0" class="space-y-3">
        <!-- Search filter -->
        <div class="relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar especialidad..."
            class="pl-9"
          />
        </div>

        <!-- Checkbox list -->
        <div class="max-h-80 overflow-y-auto border rounded-md p-3 space-y-2">
          <div
            v-for="specialty in filteredSpecialties"
            :key="specialty.id"
            class="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted cursor-pointer"
            @click="toggleSpecialty(specialty.name)"
          >
            <Checkbox
              :checked="isSelected(specialty.name)"
              @click.stop
              @update:checked="toggleSpecialty(specialty.name)"
            />
            <label class="text-sm cursor-pointer select-none text-foreground">
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
