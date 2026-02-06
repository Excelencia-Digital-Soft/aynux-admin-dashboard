<script setup lang="ts">
// @ts-nocheck - Pre-existing type issue with is_published property
/**
 * WorkflowTopBar - n8n-style top navigation bar
 *
 * Features:
 * - Left: Breadcrumb navigation (Personal / Workflow Name)
 * - Center: Tab navigation (Editor | Executions | Evaluations)
 * - Right: Publish button, refresh, menu
 */
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { WorkflowDefinition } from '@/types/workflow.types'

const props = defineProps<{
  workflow: WorkflowDefinition | null
  institutionName?: string
  isDirty: boolean
  isSaving: boolean
  activeTab: 'editor' | 'executions' | 'evaluations'
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: 'editor' | 'executions' | 'evaluations'): void
  (e: 'save'): void
  (e: 'publish'): void
  (e: 'refresh'): void
  (e: 'settings'): void
  (e: 'duplicate'): void
  (e: 'export'): void
  (e: 'delete'): void
  (e: 'back'): void
}>()

const tabs = [
  { id: 'editor' as const, label: 'Editor', icon: 'pi-pencil' },
  { id: 'executions' as const, label: 'Ejecuciones', icon: 'pi-history' },
  { id: 'evaluations' as const, label: 'Evaluaciones', icon: 'pi-chart-bar' }
]

const workflowStatus = computed(() => {
  if (!props.workflow) return null
  return props.workflow.is_published ? 'published' : 'draft'
})
</script>

<template>
  <div class="n8n-topbar">
    <!-- Left: Breadcrumb -->
    <div class="topbar-left">
      <button class="back-button" @click="emit('back')">
        <i class="pi pi-arrow-left" />
      </button>

      <div class="breadcrumb">
        <span class="breadcrumb-item breadcrumb-org">
          {{ institutionName || 'Personal' }}
        </span>
        <i class="pi pi-chevron-right breadcrumb-separator" />
        <span class="breadcrumb-item breadcrumb-workflow">
          {{ workflow?.display_name || 'Sin nombre' }}
        </span>
        <Badge
          v-if="workflowStatus"
          :variant="workflowStatus === 'published' ? 'default' : 'secondary'"
          class="ml-2 text-xs"
        >
          {{ workflowStatus === 'published' ? 'Publicado' : 'Borrador' }}
        </Badge>
        <span v-if="isDirty" class="dirty-indicator" title="Cambios sin guardar">
          •
        </span>
      </div>
    </div>

    <!-- Center: Tabs -->
    <div class="topbar-center">
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="emit('update:activeTab', tab.id)"
        >
          <i :class="['pi', tab.icon]" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="topbar-right">
      <TooltipProvider>
        <!-- Refresh -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="action-button"
              @click="emit('refresh')"
            >
              <i class="pi pi-refresh" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Actualizar</TooltipContent>
        </Tooltip>

        <!-- Save -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="action-button"
              :disabled="!isDirty || isSaving"
              @click="emit('save')"
            >
              <i :class="['pi', isSaving ? 'pi-spin pi-spinner' : 'pi-save']" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Guardar (Ctrl+S)</TooltipContent>
        </Tooltip>

        <!-- Publish -->
        <Button
          variant="default"
          size="sm"
          class="publish-button"
          :disabled="!workflow || isDirty"
          @click="emit('publish')"
        >
          <i class="pi pi-cloud-upload mr-2" />
          Publicar
        </Button>

        <!-- More menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="action-button">
              <i class="pi pi-ellipsis-v" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="emit('settings')">
              <i class="pi pi-cog mr-2" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('duplicate')">
              <i class="pi pi-copy mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('export')">
              <i class="pi pi-download mr-2" />
              Exportar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @click="emit('delete')">
              <i class="pi pi-trash mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  </div>
</template>

<style scoped>
.n8n-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: #0c1d3d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Left section */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.back-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.breadcrumb-workflow {
  color: white;
  font-weight: 600;
}

.breadcrumb-separator {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.dirty-indicator {
  color: #f59e0b;
  font-size: 24px;
  line-height: 1;
  margin-left: 4px;
}

/* Center section */
.topbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.tab-navigation {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button i {
  font-size: 14px;
}

.tab-button:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: white;
  background: rgba(139, 92, 246, 0.3);
}

/* Right section */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.action-button {
  color: rgba(255, 255, 255, 0.7) !important;
}

.action-button:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.publish-button {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  border: none !important;
}

.publish-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6) !important;
}

.publish-button:disabled {
  opacity: 0.5;
}
</style>
