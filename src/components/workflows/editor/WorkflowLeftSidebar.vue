<script setup lang="ts">
/**
 * WorkflowLeftSidebar - n8n-style left navigation sidebar
 *
 * Features:
 * - 50px width
 * - Vertical icon navigation
 * - Top: Home, Search, Projects, Chat
 * - Bottom: Settings, Help
 */
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

defineProps<{
  activeItem?: string
}>()

const emit = defineEmits<{
  (e: 'navigate', item: string): void
}>()

const topItems = [
  { id: 'home', icon: 'pi-home', label: 'Inicio', route: '/admin' },
  { id: 'workflows', icon: 'pi-sitemap', label: 'Workflows', active: true },
  { id: 'search', icon: 'pi-search', label: 'Buscar' },
  { id: 'agents', icon: 'pi-android', label: 'Agentes', route: '/admin/agents' }
]

const bottomItems = [
  { id: 'settings', icon: 'pi-cog', label: 'Configuración' },
  { id: 'help', icon: 'pi-question-circle', label: 'Ayuda' }
]
</script>

<template>
  <div class="n8n-left-sidebar">
    <TooltipProvider>
      <!-- Top navigation items -->
      <div class="sidebar-top">
        <Tooltip v-for="item in topItems" :key="item.id">
          <TooltipTrigger as-child>
            <button
              class="sidebar-item"
              :class="{ active: item.active || activeItem === item.id }"
              @click="emit('navigate', item.id)"
            >
              <i :class="['pi', item.icon]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ item.label }}
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- Bottom navigation items -->
      <div class="sidebar-bottom">
        <Tooltip v-for="item in bottomItems" :key="item.id">
          <TooltipTrigger as-child>
            <button
              class="sidebar-item"
              :class="{ active: activeItem === item.id }"
              @click="emit('navigate', item.id)"
            >
              <i :class="['pi', item.icon]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ item.label }}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>

<style scoped>
.n8n-left-sidebar {
  width: 50px;
  height: 100%;
  background: #061222;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 0;
}

.sidebar-top,
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sidebar-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-item i {
  font-size: 18px;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-item.active {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  width: 3px;
  height: 24px;
  background: #8b5cf6;
  border-radius: 0 4px 4px 0;
}
</style>
