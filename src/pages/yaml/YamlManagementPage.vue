<template>
  <div class="p-4">
    <YamlPageHeader
      v-model="selectedType"
      @create="navigateToCreate"
      @export="exportTemplates"
      @import="importTemplates"
    />

    <YamlFilters />

    <YamlStats />

    <YamlDataTable
      @refresh="refreshData"
      @fetch-analytics="fetchCurrentAnalytics"
      @edit="editItem"
      @edit-new-tab="editItemInNewTab"
      @preview="previewItem"
      @test="testItem"
      @versions="viewVersions"
    />

    <!-- Hidden file input for import -->
    <input 
      ref="fileInput" 
      type="file" 
      accept=".zip,.yaml,.yml" 
      @change="handleFileImport"
      style="display: none"
    />

    <!-- Test Dialog (YamlTestDialog manages its own Dialog) -->
    <YamlTestDialog
      v-if="showTestDialog && testPromptKey"
      :visible="showTestDialog"
      :templateKey="testPromptKey"
      :templateType="templateType"
      @close="showTestDialog = false"
    />

    <!-- Preview Dialog -->
    <Dialog v-model:open="showPreviewDialog">
      <DialogContent class="max-w-[80vw] sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Vista Previa del Template</DialogTitle>
          <DialogDescription class="sr-only">Preview del template seleccionado</DialogDescription>
        </DialogHeader>
        <YamlPreview
          v-if="showPreviewDialog && previewTemplate"
          :template="previewTemplate"
          @close="showPreviewDialog = false"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { useYamlStore } from '@/stores/yaml.store'
import { useAuthStore } from '@/stores/auth.store'
import { useDebounceFn } from '@vueuse/core'

// Components
import YamlPageHeader from './components/YamlPageHeader.vue'
import YamlFilters from './components/YamlFilters.vue'
import YamlStats from './components/YamlStats.vue'
import YamlDataTable from './components/YamlDataTable.vue'
import YamlTestDialog from './components/YamlTestDialog.vue'
import YamlPreview from './components/YamlPreview.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

// Types
import type { YamlTask, YamlFormatter, TemplateType } from '@/types/yaml.types'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const yamlStore = useYamlStore()
const authStore = useAuthStore()

// Local state
const selectedType = ref<TemplateType>((route.query.type as TemplateType) || 'prompt')
const fileInput = ref<HTMLInputElement>()
const showTestDialog = ref(false)
const testPromptKey = ref('')
const showPreviewDialog = ref(false)
const previewPromptKey = ref('')
const previewTemplate = ref<any>(null)

// Store state
const {
  prompts,
  tasks,
  formatters,
  templateType,
  filters
} = storeToRefs(yamlStore)

// Computed
const isTask = computed(() => templateType.value === 'task')
const isFormatter = computed(() => templateType.value === 'formatter')

// Sync selectedType with store and URL
watch(selectedType, async (newType) => {
  // Update URL query param
  router.replace({
    query: { ...route.query, type: newType }
  })

  // Reset filters
  yamlStore.setFilters({
    domain: null,
    source: null,
    active: null,
    search: '',
    tags: []
  })

  // Update store
  yamlStore.setTemplateType(newType)

  // Wait for tick
  await nextTick()

  // Load data
  refreshData()
  fetchCurrentAnalytics()
}, { immediate: false }) // Handled in onMounted initially

// Navigation functions
function navigateToCreate() {
  const queryType = isFormatter.value ? 'formatter' : (isTask.value ? 'task' : 'prompt')
  router.push(`/yaml-management/new?type=${queryType}`)
}

function editItem(key: string) {
  const queryType = isFormatter.value ? 'formatter' : (isTask.value ? 'task' : 'prompt')
  router.push(`/yaml-management/edit/${key}?type=${queryType}`)
}

function editItemInNewTab(key: string) {
  const queryType = isFormatter.value ? 'formatter' : (isTask.value ? 'task' : 'prompt')
  window.open(`/yaml-management/edit/${key}?type=${queryType}`, '_blank')
}

function viewVersions(key: string) {
  router.push(`/yaml-management/versions/${key}`)
}

// Dialog Logic
function testItem(key: string) {
  testPromptKey.value = key
  showTestDialog.value = true
}

async function previewItem(key: string) {
  previewPromptKey.value = key

  if (isFormatter.value) {
    const formatter = formatters.value.find((f: YamlFormatter) => f.key === key)
    if (formatter) {
      previewTemplate.value = {
        formatters: [{
          key: formatter.key,
          name: formatter.name,
          description: formatter.description,
          version: formatter.version,
          response_type: formatter.response_type,
          body_template: formatter.body_template,
          buttons: formatter.buttons,
          metadata: formatter.metadata
        }]
      }
      showPreviewDialog.value = true
    }
  } else if (isTask.value) {
    const task = tasks.value.find((t: YamlTask) => t.key === key)
    if (task) {
      previewTemplate.value = {
        tasks: [{
          key: task.key,
          name: task.name,
          description: task.description,
          version: task.version,
          template: task.template,
          metadata: task.metadata
        }]
      }
      showPreviewDialog.value = true
    }
  } else {
    const prompt = prompts.value.find(p => p.key === key)
    if (prompt) {
      previewTemplate.value = {
        prompts: [{
          key: prompt.key,
          name: prompt.name,
          description: prompt.description,
          version: prompt.version,
          template: prompt.template,
          metadata: prompt.metadata
        }]
      }
      showPreviewDialog.value = true
    }
  }
}

// Data operations
async function refreshData() {
  if (isFormatter.value) {
    await yamlStore.fetchFormatters()
  } else if (isTask.value) {
    await yamlStore.fetchTasks()
  } else {
    await yamlStore.fetchPrompts()
  }
}

async function fetchCurrentAnalytics() {
  if (isFormatter.value) {
    await yamlStore.fetchFormatterAnalytics()
  } else if (isTask.value) {
    await yamlStore.fetchTaskAnalytics()
  } else {
    await yamlStore.fetchAnalytics()
  }
}

// Filter operations with debounce
const debouncedFetchData = useDebounceFn(() => {
  refreshData()
}, 300)

watch(
  () => [filters.value.domain, filters.value.source, filters.value.active, filters.value.search],
  () => {
    debouncedFetchData()
  },
  { deep: true }
)

// Export/Import operations
function exportTemplates() {
  toast.add({
    severity: 'info',
    summary: 'Exportación',
    detail: 'Funcionalidad de exportación en desarrollo',
    life: 3000
  })
}

function importTemplates() {
  fileInput.value?.click()
}

function handleFileImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  toast.add({
    severity: 'info',
    summary: 'Importación',
    detail: 'Funcionalidad de importación en desarrollo',
    life: 3000
  })
}

// Lifecycle
onMounted(async () => {
  // Check if user is admin
  if (!authStore.isAdminOrOwner) {
    router.push('/unauthorized')
    return
  }

  // Set initial type from URL query
  const queryType = route.query.type as TemplateType
  if (queryType === 'task' || queryType === 'formatter') {
    selectedType.value = queryType
    yamlStore.setTemplateType(queryType)
  }

  // Load initial data
  await Promise.all([
    refreshData(),
    fetchCurrentAnalytics()
  ])
})
</script>

