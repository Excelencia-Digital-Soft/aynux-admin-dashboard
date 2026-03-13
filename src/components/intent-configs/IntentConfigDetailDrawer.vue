<script setup lang="ts">
/**
 * IntentConfigDetailDrawer - Side drawer for editing selected graph nodes
 *
 * Adapts panel content based on selected node type:
 * - supervisor → RouterPanel (routing configs grouped by type) + Respuestas tab
 * - action → ActionNodePanel (awaiting types + routing configs) + Respuestas tab
 * - formatter → Description only (no tabs)
 * - terminal → No panel (START/END, no tabs)
 *
 * Also handles response config CRUD and inheritance override flows.
 */
import { ref, computed, watch } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import RouterPanel from './panels/RouterPanel.vue'
import ActionNodePanel from './panels/ActionNodePanel.vue'
import NodeResponseConfigsPanel from './panels/NodeResponseConfigsPanel.vue'
import RoutingConfigCreateForm from './panels/RoutingConfigCreateForm.vue'
import ResponseConfigFormDialog from '@/components/response-configs/ResponseConfigFormDialog.vue'
import ConfigDiffDialog from '@/components/response-configs/ConfigDiffDialog.vue'

import { responseConfigsApi } from '@/api/responseConfigs.api'
import { useAuthStore } from '@/stores/auth.store'

import type { SelectedNodeInfo } from './types'
import type { RoutingConfigCreate } from '@/types/routingConfigs.types'
import type {
  ResponseConfig,
  ResponseConfigFormData,
  ResponseParam,
  ValidationWarning
} from '@/types/responseConfigs.types'
import { DEFAULT_RESPONSE_CONFIG_FORM } from '@/types/responseConfigs.types'

// Props
interface AvailableNode {
  id: string
  displayName: string
}

interface Props {
  visible: boolean
  selectedNode: SelectedNodeInfo | null
  domainKey: string
  showCreateForm: boolean
  availableNodes: AvailableNode[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'toggleRoutingConfig', configId: string, enabled: boolean): void
  (e: 'toggleAwaitingConfig', configId: string, enabled: boolean): void
  (e: 'updateRoutingConfig', configId: string, updates: Record<string, unknown>): void
  (e: 'createRoutingConfig', data: RoutingConfigCreate): void
  (e: 'deleteRoutingConfig', configId: string): void
  (e: 'update:showCreateForm', value: boolean): void
  (e: 'highlightDependency', routingConfigId: string | null): void
}>()

const authStore = useAuthStore()

// --- Response config dialog state ---
const showResponseDialog = ref(false)
const editingResponseConfig = ref<ResponseConfig | null>(null)
const responseFormData = ref<ResponseConfigFormData>({ ...DEFAULT_RESPONSE_CONFIG_FORM })
const responseSaving = ref(false)
const availableParams = ref<ResponseParam[]>([])
const responseSaveWarnings = ref<ValidationWarning[]>([])
const responseRefreshKey = ref(0)

const isEditingResponse = computed(() => editingResponseConfig.value !== null)
const responseDialogTitle = computed(() =>
  isEditingResponse.value ? 'Editar Respuesta' : 'Crear Respuesta'
)
const responseSubmitLabel = computed(() =>
  isEditingResponse.value ? 'Guardar cambios' : 'Crear respuesta'
)

// --- Config diff dialog state ---
const showDiffDialog = ref(false)
const diffIntentKey = ref('')
const diffSystemConfig = ref<ResponseConfig | null>(null)
const diffOverrideConfig = ref<ResponseConfig | null>(null)

// --- Delete override confirmation ---
const showDeleteOverrideConfirm = ref(false)
const pendingDeleteConfig = ref<ResponseConfig | null>(null)

// Show tabs for nodes with routing configs OR response keys
const showTabs = computed(() => {
  if (!props.selectedNode) return false
  const type = props.selectedNode.nodeType
  if (type !== 'supervisor' && type !== 'action') return false
  return props.selectedNode.routingConfigs.length > 0 || props.selectedNode.data.responseKeys.length > 0
})

const drawerTitle = computed(() => {
  if (!props.selectedNode) return 'Detalles'

  switch (props.selectedNode.nodeType) {
    case 'supervisor':
      return 'Distribuidor de Mensajes'
    case 'action':
      return props.selectedNode.data.displayName
    case 'formatter':
      return 'Response Formatter'
    case 'terminal':
      return props.selectedNode.data.displayName
    default:
      return 'Detalles'
  }
})

// Reset tab when node changes
const activeTab = ref('reglas')
watch(
  () => props.selectedNode?.nodeId,
  () => {
    activeTab.value = 'reglas'
  }
)

// Fetch available params when domain changes
watch(
  () => props.domainKey,
  async (dk) => {
    if (dk) {
      try {
        availableParams.value = await responseConfigsApi.getAvailableParams(dk)
      } catch {
        availableParams.value = []
      }
    }
  },
  { immediate: true }
)

function handleOpenChange(open: boolean) {
  emit('update:visible', open)
  if (!open) {
    emit('close')
  }
}

function handleToggleRouting(configId: string, enabled: boolean) {
  emit('toggleRoutingConfig', configId, enabled)
}

function handleToggleAwaiting(configId: string, enabled: boolean) {
  emit('toggleAwaitingConfig', configId, enabled)
}

function handleUpdateRouting(configId: string, updates: Record<string, unknown>) {
  emit('updateRoutingConfig', configId, updates)
}

function handleAddConfig() {
  emit('update:showCreateForm', true)
}

function handleCancelCreate() {
  emit('update:showCreateForm', false)
}

function handleSaveCreate(data: RoutingConfigCreate) {
  emit('createRoutingConfig', data)
}

function handleDeleteRouting(configId: string) {
  emit('deleteRoutingConfig', configId)
}

// --- Response config dialog handlers ---
function handleEditResponse(config: ResponseConfig) {
  responseSaveWarnings.value = []
  editingResponseConfig.value = config
  responseFormData.value = {
    intent_key: config.intent_key,
    display_name: config.display_name || '',
    description: config.description || '',
    task_description: config.task_description,
    fallback_template_key: config.fallback_template_key,
    response_type: config.response_type,
    template_text: config.template_text || '',
    buttons: config.buttons ? [...config.buttons] : [],
    priority: config.priority,
    is_critical: config.is_critical,
    is_enabled: config.is_enabled
  }
  showResponseDialog.value = true
}

function handleCreateResponse(intentKey: string) {
  responseSaveWarnings.value = []
  editingResponseConfig.value = null
  responseFormData.value = {
    ...DEFAULT_RESPONSE_CONFIG_FORM,
    intent_key: intentKey
  }
  showResponseDialog.value = true
}

/**
 * Create Override: pre-populate form with the SYSTEM_ORG config values
 * but save as a new config for the current org.
 */
function handleCreateOverride(_intentKey: string, systemConfig: ResponseConfig) {
  responseSaveWarnings.value = []
  editingResponseConfig.value = null // null = create mode
  responseFormData.value = {
    intent_key: systemConfig.intent_key,
    display_name: systemConfig.display_name || '',
    description: systemConfig.description || '',
    task_description: systemConfig.task_description,
    fallback_template_key: systemConfig.fallback_template_key,
    response_type: systemConfig.response_type,
    template_text: systemConfig.template_text || '',
    buttons: systemConfig.buttons ? [...systemConfig.buttons] : [],
    priority: systemConfig.priority,
    is_critical: systemConfig.is_critical,
    is_enabled: systemConfig.is_enabled
  }
  showResponseDialog.value = true
}

/**
 * Delete Override: show confirmation dialog, then delete the org's config.
 * The SYSTEM_ORG fallback will automatically take over.
 */
function handleDeleteOverride(config: ResponseConfig) {
  pendingDeleteConfig.value = config
  showDeleteOverrideConfirm.value = true
}

async function confirmDeleteOverride() {
  const config = pendingDeleteConfig.value
  if (!config) return

  try {
    await responseConfigsApi.deleteConfig(config.id)
    responseRefreshKey.value++
  } catch (error) {
    console.error('Failed to delete override:', error)
  } finally {
    showDeleteOverrideConfirm.value = false
    pendingDeleteConfig.value = null
  }
}

/**
 * View Diff: open the ConfigDiffDialog
 */
function handleViewDiff(intentKey: string, systemConfig: ResponseConfig, overrideConfig: ResponseConfig) {
  diffIntentKey.value = intentKey
  diffSystemConfig.value = systemConfig
  diffOverrideConfig.value = overrideConfig
  showDiffDialog.value = true
}

function handleCancelResponseDialog() {
  showResponseDialog.value = false
  editingResponseConfig.value = null
}

async function handleSaveResponse() {
  const orgId = authStore.currentOrgId
  if (!orgId) return

  responseSaving.value = true
  responseSaveWarnings.value = []
  try {
    let result: ResponseConfig
    if (isEditingResponse.value && editingResponseConfig.value) {
      result = await responseConfigsApi.updateConfig(editingResponseConfig.value.id, {
        is_critical: responseFormData.value.is_critical,
        task_description: responseFormData.value.task_description,
        fallback_template_key: responseFormData.value.fallback_template_key,
        response_type: responseFormData.value.response_type,
        template_text: responseFormData.value.template_text || null,
        display_name: responseFormData.value.display_name || null,
        description: responseFormData.value.description || null,
        priority: responseFormData.value.priority,
        buttons: responseFormData.value.buttons.length > 0 ? responseFormData.value.buttons : null,
        is_enabled: responseFormData.value.is_enabled
      })
    } else {
      result = await responseConfigsApi.createConfig({
        organization_id: orgId,
        domain_key: props.domainKey,
        intent_key: responseFormData.value.intent_key,
        is_critical: responseFormData.value.is_critical,
        task_description: responseFormData.value.task_description,
        fallback_template_key: responseFormData.value.fallback_template_key,
        response_type: responseFormData.value.response_type,
        template_text: responseFormData.value.template_text || null,
        display_name: responseFormData.value.display_name || null,
        description: responseFormData.value.description || null,
        priority: responseFormData.value.priority,
        buttons: responseFormData.value.buttons.length > 0 ? responseFormData.value.buttons : null,
        is_enabled: responseFormData.value.is_enabled
      })
    }

    const warnings = result.warnings ?? []
    responseSaveWarnings.value = warnings

    if (warnings.length === 0) {
      showResponseDialog.value = false
      editingResponseConfig.value = null
    }
    // Trigger refetch in the panel by bumping the key
    responseRefreshKey.value++
  } catch (error) {
    console.error('Failed to save response config:', error)
  } finally {
    responseSaving.value = false
  }
}
</script>

<template>
  <Sheet :open="visible" @update:open="handleOpenChange">
    <SheetContent side="right" class="w-[420px] sm:max-w-[420px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{{ drawerTitle }}</SheetTitle>
        <SheetDescription class="sr-only">
          Panel de configuracion del nodo seleccionado
        </SheetDescription>
      </SheetHeader>

      <div v-if="selectedNode" class="flex flex-col gap-3 p-2">
        <!-- Create Form Mode -->
        <RoutingConfigCreateForm
          v-if="showCreateForm"
          :domain-key="domainKey"
          :target-node="selectedNode.nodeId"
          :available-nodes="availableNodes"
          @save="handleSaveCreate"
          @cancel="handleCancelCreate"
        />

        <!-- Normal View -->
        <template v-else>
          <!-- Nodes with tabs (supervisor/action with routing configs) -->
          <Tabs v-if="showTabs" v-model="activeTab" class="w-full">
            <TabsList class="w-full">
              <TabsTrigger value="reglas" class="flex-1">Reglas</TabsTrigger>
              <TabsTrigger value="respuestas" class="flex-1">Respuestas</TabsTrigger>
            </TabsList>

            <TabsContent value="reglas" class="mt-3">
              <!-- Router Supervisor -->
              <RouterPanel
                v-if="selectedNode.nodeType === 'supervisor'"
                :routing-configs="selectedNode.routingConfigs"
                :domain-key="domainKey"
                :available-nodes="availableNodes"
                @toggle-config="handleToggleRouting"
                @update-config="handleUpdateRouting"
                @add-config="handleAddConfig"
                @delete-config="handleDeleteRouting"
                @highlight-dependency="(id: string | null) => emit('highlightDependency', id)"
              />

              <!-- Action Node -->
              <ActionNodePanel
                v-else-if="selectedNode.nodeType === 'action'"
                :data="selectedNode.data"
                :routing-configs="selectedNode.routingConfigs"
                :awaiting-type-configs="selectedNode.awaitingTypeConfigs"
                :domain-key="domainKey"
                @toggle-routing-config="handleToggleRouting"
                @toggle-awaiting-config="handleToggleAwaiting"
                @update-routing-config="handleUpdateRouting"
                @add-config="handleAddConfig"
                @delete-routing-config="handleDeleteRouting"
                @highlight-dependency="(id: string | null) => emit('highlightDependency', id)"
              />
            </TabsContent>

            <TabsContent value="respuestas" class="mt-3">
              <NodeResponseConfigsPanel
                :key="responseRefreshKey"
                :response-keys="selectedNode.data.responseKeys"
                :domain-key="domainKey"
                @edit-response="handleEditResponse"
                @create-response="handleCreateResponse"
                @create-override="handleCreateOverride"
                @delete-override="handleDeleteOverride"
                @view-diff="handleViewDiff"
              />
            </TabsContent>
          </Tabs>

          <!-- Nodes without tabs (supervisor/action with no configs, formatter, terminal) -->
          <template v-else>
            <!-- Router Supervisor (no routing configs) -->
            <RouterPanel
              v-if="selectedNode.nodeType === 'supervisor'"
              :routing-configs="selectedNode.routingConfigs"
              :domain-key="domainKey"
              :available-nodes="availableNodes"
              @toggle-config="handleToggleRouting"
              @update-config="handleUpdateRouting"
              @add-config="handleAddConfig"
              @delete-config="handleDeleteRouting"
            />

            <!-- Action Node (no routing configs) -->
            <ActionNodePanel
              v-else-if="selectedNode.nodeType === 'action'"
              :data="selectedNode.data"
              :routing-configs="selectedNode.routingConfigs"
              :awaiting-type-configs="selectedNode.awaitingTypeConfigs"
              :domain-key="domainKey"
              @toggle-routing-config="handleToggleRouting"
              @toggle-awaiting-config="handleToggleAwaiting"
              @update-routing-config="handleUpdateRouting"
              @add-config="handleAddConfig"
              @delete-routing-config="handleDeleteRouting"
            />

            <!-- Formatter -->
            <div v-else-if="selectedNode.nodeType === 'formatter'" class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i :class="['pi', selectedNode.data.icon]" :style="{ color: selectedNode.data.color }" />
                <h3 class="m-0 text-base font-semibold text-foreground">{{ selectedNode.data.displayName }}</h3>
              </div>
              <p class="m-0 text-xs text-muted-foreground leading-relaxed">{{ selectedNode.data.description }}</p>
            </div>

            <!-- Terminal (START/END) -->
            <div v-else class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <i :class="['pi', selectedNode.data.icon]" :style="{ color: selectedNode.data.color }" />
                <h3 class="m-0 text-base font-semibold text-foreground">{{ selectedNode.data.displayName }}</h3>
              </div>
              <p class="m-0 text-xs text-muted-foreground leading-relaxed">{{ selectedNode.data.description }}</p>
            </div>
          </template>
        </template>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-center">
        <i class="pi pi-info-circle text-4xl mb-4 opacity-50" />
        <p class="m-0 max-w-[250px]">Selecciona un paso del flujo para ver su configuracion</p>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Response Config Edit/Create Dialog -->
  <ResponseConfigFormDialog
    :open="showResponseDialog"
    :saving="responseSaving"
    :form-data="responseFormData"
    :available-params="availableParams"
    :save-warnings="responseSaveWarnings"
    :is-editing="isEditingResponse"
    :dialog-title="responseDialogTitle"
    :submit-label="responseSubmitLabel"
    @update:open="showResponseDialog = $event"
    @save="handleSaveResponse"
    @cancel="handleCancelResponseDialog"
    @dismiss-warnings="handleCancelResponseDialog"
  />

  <!-- Config Diff Dialog -->
  <ConfigDiffDialog
    :open="showDiffDialog"
    :intent-key="diffIntentKey"
    :system-config="diffSystemConfig"
    :override-config="diffOverrideConfig"
    @update:open="showDiffDialog = $event"
  />

  <!-- Delete Override Confirmation -->
  <AlertDialog :open="showDeleteOverrideConfirm" @update:open="showDeleteOverrideConfirm = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Revertir al sistema</AlertDialogTitle>
        <AlertDialogDescription>
          Se eliminara el override para
          <strong>{{ pendingDeleteConfig?.intent_key }}</strong>.
          La configuracion volvera a usar el valor por defecto del sistema.
          Esta accion no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="confirmDeleteOverride"
        >
          Revertir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
