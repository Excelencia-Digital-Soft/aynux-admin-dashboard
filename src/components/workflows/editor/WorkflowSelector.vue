<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'
import type { WorkflowDefinition } from '@/types/workflow.types'

defineProps<{
  institutions: TenantInstitutionConfig[]
  workflows: WorkflowDefinition[]
  selectedInstitutionId: string | null
  selectedWorkflowId: string | null
  selectedInstitution: TenantInstitutionConfig | null
  currentWorkflow: WorkflowDefinition | null
  stats: {
    totalNodes: number
    totalTransitions: number
  }
  isLoadingInstitutions: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedInstitutionId', value: string | null): void
  (e: 'update:selectedWorkflowId', value: string | null): void
  (e: 'selectInstitution'): void
  (e: 'selectWorkflow'): void
  (e: 'showInstitutionInfo'): void
}>()
</script>

<template>
  <Card class="mb-6">
    <template #content>
      <div class="flex items-center gap-4">
        <!-- Institution Selector -->
        <div class="flex-auto">
          <label class="block text-sm font-medium text-gray-700 mb-1">Institución Médica</label>
          <div class="flex items-center gap-2">
            <Select
              :modelValue="selectedInstitutionId"
              @update:modelValue="(v) => emit('update:selectedInstitutionId', v)"
              :options="institutions"
              optionLabel="institution_name"
              optionValue="id"
              placeholder="Selecciona institución"
              class="flex-1"
              :loading="isLoadingInstitutions"
              @change="emit('selectInstitution')"
            />
            <Button
              v-if="selectedInstitution"
              icon="pi pi-info-circle"
              severity="secondary"
              text
              rounded
              @click="emit('showInstitutionInfo')"
              v-tooltip.top="'Ver información de institución'"
              class="flex-shrink-0"
            />
          </div>
        </div>

        <!-- Workflow Selector -->
        <div class="flex-auto">
          <label class="block text-sm font-medium text-gray-700 mb-1 ml-4">Workflow</label>
          <Select
            :modelValue="selectedWorkflowId"
            @update:modelValue="(v) => emit('update:selectedWorkflowId', v)"
            :options="workflows"
            optionLabel="display_name"
            optionValue="id"
            placeholder="Selecciona un workflow"
            class="w-full"
            :disabled="!selectedInstitutionId"
            showClear
            @change="emit('selectWorkflow')"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <Tag
                  :value="option.workflow_type"
                  :severity="option.is_draft ? 'warn' : 'success'"
                  class="text-xs"
                />
                <span>{{ option.display_name }}</span>
                <Tag v-if="option.is_draft" value="Draft" severity="secondary" class="text-xs ml-auto" />
              </div>
            </template>
          </Select>
        </div>

        <div v-if="currentWorkflow" class="flex gap-4 text-sm">
          <div class="text-center">
            <div class="text-xl font-bold text-gray-800">{{ stats.totalNodes }}</div>
            <div class="text-gray-500">Nodos</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-800">{{ stats.totalTransitions }}</div>
            <div class="text-gray-500">Transiciones</div>
          </div>
          <div class="text-center">
            <Tag :value="currentWorkflow.is_draft ? 'Borrador' : 'Publicado'" :severity="currentWorkflow.is_draft ? 'warn' : 'success'" />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
