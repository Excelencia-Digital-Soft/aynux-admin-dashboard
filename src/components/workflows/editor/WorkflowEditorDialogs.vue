<script setup lang="ts">
import type { NodeDefinition, NodeInstanceCreate } from '@/types/workflow-node.types'
import type { WorkflowCreate } from '@/types/workflow-definition.types'
import type { TenantInstitutionConfig } from '@/types/tenantInstitutionConfig.types'
import type { SimulationContext } from '@/composables/useWorkflowSimulation'
import { useWorkflowStore } from '@/stores/workflow.store'

import WorkflowNodePaletteDialog from './WorkflowNodePaletteDialog.vue'
import NewWorkflowDialog from './NewWorkflowDialog.vue'
import AddNodeDialog from './AddNodeDialog.vue'
import WorkflowSimulationContext from '@/components/workflows/WorkflowSimulationContext.vue'
import NodeDefinitionsDialog from './NodeDefinitionsDialog.vue'
import InstitutionInfoDialog from './InstitutionInfoDialog.vue'
import CopyWorkflowDialog from './CopyWorkflowDialog.vue'
import WorkflowExecuteDialog from './WorkflowExecuteDialog.vue'

const workflowStore = useWorkflowStore()

const props = defineProps<{
  // Node Palette
  showNodePaletteDialog: boolean
  nodeDefinitionsByCategory: Record<string, NodeDefinition[]>

  // New Workflow
  showWorkflowDialog: boolean
  newWorkflow: WorkflowCreate
  institutions: TenantInstitutionConfig[]
  isLoadingInstitutions: boolean

  // Add Node
  showNodeDialog: boolean
  selectedDefinition: NodeDefinition | null
  newNode: NodeInstanceCreate

  // Simulation Context
  showSimulationContextDialog: boolean
  simulationContext: SimulationContext

  // Node Definitions
  showNodeDefinitionsDialog: boolean

  // Institution Info
  showInstitutionInfoDialog: boolean
  selectedInstitution: TenantInstitutionConfig | null

  // Copy Workflow
  showCopyWorkflowDialog: boolean
  selectedInstitutionId: string | null

  // Execute Dialog
  showExecuteDialog: boolean
  isExecuting: boolean
  institutionConfigId?: string
}>()

const emit = defineEmits<{
  (e: 'update:showNodePaletteDialog', value: boolean): void
  (e: 'update:showWorkflowDialog', value: boolean): void
  (e: 'update:showNodeDialog', value: boolean): void
  (e: 'update:showSimulationContextDialog', value: boolean): void
  (e: 'update:showNodeDefinitionsDialog', value: boolean): void
  (e: 'update:showInstitutionInfoDialog', value: boolean): void
  (e: 'update:showCopyWorkflowDialog', value: boolean): void
  (e: 'update:showExecuteDialog', value: boolean): void
  (e: 'addNodeFromPalette', definition: NodeDefinition): void
  (e: 'createWorkflow'): void
  (e: 'cancelWorkflow'): void
  (e: 'addNode'): void
  (e: 'cancelAddNode'): void
  (e: 'updateSimulationContext', context: Partial<SimulationContext>): void
  (e: 'copied', result: { newWorkflowId: string }): void
  (e: 'execute', payload: { test_input: string; domain_key: string }): void
}>()

async function onDefinitionsUpdated() {
  await workflowStore.loadNodeDefinitions()
}
</script>

<template>
  <!-- Node Palette Dialog -->
  <WorkflowNodePaletteDialog
    :visible="showNodePaletteDialog"
    @update:visible="emit('update:showNodePaletteDialog', $event)"
    :nodeDefinitionsByCategory="nodeDefinitionsByCategory"
    @addNode="emit('addNodeFromPalette', $event)"
  />

  <!-- New Workflow Dialog -->
  <NewWorkflowDialog
    :visible="showWorkflowDialog"
    @update:visible="emit('update:showWorkflowDialog', $event)"
    :loading="false"
    :workflow="newWorkflow"
    :institutions="institutions"
    :isLoadingInstitutions="isLoadingInstitutions"
    @save="emit('createWorkflow')"
    @cancel="emit('cancelWorkflow')"
  />

  <!-- Add Node Dialog -->
  <AddNodeDialog
    :visible="showNodeDialog"
    @update:visible="emit('update:showNodeDialog', $event)"
    :definition="selectedDefinition"
    :newNode="newNode"
    @add="emit('addNode')"
    @cancel="emit('cancelAddNode')"
  />

  <!-- Simulation Context Dialog -->
  <WorkflowSimulationContext
    :visible="showSimulationContextDialog"
    @update:visible="emit('update:showSimulationContextDialog', $event)"
    :context="simulationContext"
    @update:context="emit('updateSimulationContext', $event)"
  />

  <!-- Node Definitions Dialog -->
  <NodeDefinitionsDialog
    :visible="showNodeDefinitionsDialog"
    @update:visible="emit('update:showNodeDefinitionsDialog', $event)"
    @definitionsUpdated="onDefinitionsUpdated"
  />

  <!-- Institution Info Dialog -->
  <InstitutionInfoDialog
    :visible="showInstitutionInfoDialog"
    @update:visible="emit('update:showInstitutionInfoDialog', $event)"
    :institution="selectedInstitution"
  />

  <!-- Copy Workflow Dialog -->
  <CopyWorkflowDialog
    :visible="showCopyWorkflowDialog"
    @update:visible="emit('update:showCopyWorkflowDialog', $event)"
    :currentInstitutionId="selectedInstitutionId"
    @copied="emit('copied', $event)"
  />

  <!-- Execute Dialog -->
  <WorkflowExecuteDialog
    :visible="showExecuteDialog"
    @update:visible="emit('update:showExecuteDialog', $event)"
    :is-executing="isExecuting"
    :institution-config-id="institutionConfigId"
    @execute="emit('execute', $event)"
  />
</template>
