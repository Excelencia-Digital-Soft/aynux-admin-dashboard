<script setup lang="ts">
/**
 * WorkflowSelector - Selector for picking a workflow from all institutions
 *
 * Shows a single workflow dropdown with institution_name per workflow.
 * No institution pre-selection required.
 * Migrated from PrimeVue to shadcn-vue with glassmorphism.
 */
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { WorkflowDefinition } from '@/types/workflow-definition.types'

defineProps<{
  workflows: WorkflowDefinition[]
  selectedWorkflowId: string | null
  currentWorkflow: WorkflowDefinition | null
  stats: {
    totalNodes: number
    totalTransitions: number
  }
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedWorkflowId', value: string | null): void
  (e: 'selectWorkflow'): void
  (e: 'newWorkflow'): void
}>()

function handleWorkflowChange(value: string) {
  emit('update:selectedWorkflowId', value)
  emit('selectWorkflow')
}
</script>

<template>
  <Card class="glass-card mb-6">
    <CardContent class="pt-6">
      <div class="flex items-center gap-4">
        <!-- Workflow Selector -->
        <div class="flex-auto">
          <Label class="mb-1 block text-gray-700 dark:text-gray-300">Workflow</Label>
          <div class="flex items-center gap-2">
            <Select
              :model-value="selectedWorkflowId ?? undefined"
              :disabled="isLoading"
              @update:model-value="handleWorkflowChange"
            >
              <SelectTrigger class="flex-1">
                <SelectValue
                  :placeholder="isLoading ? 'Cargando...' : 'Selecciona un workflow'"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="wf in workflows"
                  :key="wf.id"
                  :value="wf.id"
                >
                  <span class="flex items-center gap-2">
                    <Badge
                      :variant="wf.is_draft ? 'secondary' : 'default'"
                      class="text-xs"
                    >
                      {{ wf.workflow_type }}
                    </Badge>
                    <span>{{ wf.display_name }}</span>
                    <Badge v-if="wf.institution_name" variant="outline" class="text-xs">
                      {{ wf.institution_name }}
                    </Badge>
                    <Badge v-if="wf.is_draft" variant="outline" class="ml-auto text-xs opacity-60">
                      Draft
                    </Badge>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    class="flex-shrink-0"
                    @click="emit('newWorkflow')"
                  >
                    <i class="pi pi-plus" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nuevo workflow</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="currentWorkflow" class="flex gap-4 text-sm">
          <div class="text-center">
            <div class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ stats.totalNodes }}</div>
            <div class="text-gray-500 dark:text-gray-400">Nodos</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ stats.totalTransitions }}</div>
            <div class="text-gray-500 dark:text-gray-400">Transiciones</div>
          </div>
          <div class="text-center">
            <Badge :variant="currentWorkflow.is_draft ? 'secondary' : 'default'">
              {{ currentWorkflow.is_draft ? 'Borrador' : 'Publicado' }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
