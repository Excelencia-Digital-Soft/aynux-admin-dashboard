<script setup lang="ts">
/**
 * IconPicker - Visual icon selector for PrimeIcons
 *
 * Displays a grid of available PrimeIcons for selection.
 * Used in node definition editor for selecting node icons.
 */
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  modelValue?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'pi-circle',
  placeholder: 'Seleccionar icono'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')

// Common PrimeIcons used for workflow nodes
const icons = [
  // Communication & Messages
  'pi-comments', 'pi-comment', 'pi-envelope', 'pi-send', 'pi-bell',
  'pi-phone', 'pi-mobile', 'pi-whatsapp', 'pi-telegram',
  // Navigation & Flow
  'pi-arrow-right', 'pi-arrow-left', 'pi-arrows-h', 'pi-arrows-v',
  'pi-directions', 'pi-directions-alt', 'pi-map', 'pi-map-marker',
  // Actions & Controls
  'pi-play', 'pi-pause', 'pi-stop', 'pi-forward', 'pi-replay',
  'pi-check', 'pi-times', 'pi-plus', 'pi-minus', 'pi-sync',
  // Data & Objects
  'pi-database', 'pi-server', 'pi-cloud', 'pi-file', 'pi-folder',
  'pi-calendar', 'pi-clock', 'pi-list', 'pi-table', 'pi-chart-bar',
  // Users & People
  'pi-user', 'pi-users', 'pi-user-plus', 'pi-user-edit', 'pi-id-card',
  // Medical & Health
  'pi-heart', 'pi-heart-fill', 'pi-prime', 'pi-asterisk',
  // Business & Commerce
  'pi-shopping-cart', 'pi-shopping-bag', 'pi-wallet', 'pi-credit-card', 'pi-dollar',
  'pi-building', 'pi-briefcase', 'pi-receipt',
  // Settings & Tools
  'pi-cog', 'pi-wrench', 'pi-sliders-h', 'pi-sliders-v', 'pi-key',
  'pi-lock', 'pi-unlock', 'pi-shield', 'pi-eye', 'pi-eye-slash',
  // Indicators & Status
  'pi-info-circle', 'pi-exclamation-circle', 'pi-exclamation-triangle', 'pi-question-circle',
  'pi-check-circle', 'pi-times-circle', 'pi-ban',
  // Shapes & Symbols
  'pi-circle', 'pi-circle-fill', 'pi-star', 'pi-star-fill', 'pi-bolt',
  'pi-flag', 'pi-flag-fill', 'pi-bookmark', 'pi-bookmark-fill', 'pi-tag',
  // Technology
  'pi-code', 'pi-terminal', 'pi-sitemap', 'pi-link', 'pi-external-link',
  'pi-qrcode', 'pi-wifi', 'pi-bluetooth', 'pi-microchip',
  // Misc
  'pi-home', 'pi-globe', 'pi-sun', 'pi-moon', 'pi-filter',
  'pi-search', 'pi-sort', 'pi-trash', 'pi-pencil', 'pi-copy'
]

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons
  const query = searchQuery.value.toLowerCase()
  return icons.filter(icon => icon.toLowerCase().includes(query))
})

function selectIcon(icon: string) {
  emit('update:modelValue', icon)
  isOpen.value = false
}
</script>

<template>
  <div class="icon-picker">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button variant="outline" class="w-full justify-start">
          <i :class="`pi ${modelValue}`" class="mr-2" />
          {{ modelValue || placeholder }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-3" align="start">
        <Input
          v-model="searchQuery"
          placeholder="Buscar icono..."
          class="mb-3"
        />
        <div class="icon-grid">
          <button
            v-for="icon in filteredIcons"
            :key="icon"
            type="button"
            class="icon-item"
            :class="{ 'icon-selected': icon === modelValue }"
            :title="icon"
            @click="selectIcon(icon)"
          >
            <i :class="`pi ${icon}`" />
          </button>
        </div>
        <div v-if="filteredIcons.length === 0" class="text-center text-muted-foreground py-4">
          No se encontraron iconos
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
  max-height: 240px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
  color: hsl(var(--foreground));
}

.icon-item:hover {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}

.icon-item.icon-selected {
  background: hsl(var(--primary) / 0.1);
  border-color: hsl(var(--primary));
  color: hsl(var(--primary));
}

.icon-item i {
  font-size: 1rem;
}
</style>
