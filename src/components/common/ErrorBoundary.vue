<script setup lang="ts">
/**
 * ErrorBoundary - Vue 3 error boundary component
 *
 * Catches errors from child components and displays a fallback UI.
 * Prevents the entire application from crashing due to component errors.
 *
 * Usage:
 *   <ErrorBoundary name="WorkflowCanvas">
 *     <WorkflowCanvas />
 *   </ErrorBoundary>
 */
import { ref, onErrorCaptured } from 'vue'
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  /** Name for identifying the boundary in logs */
  name?: string
  /** Whether to show the retry button */
  showRetry?: boolean
  /** Custom fallback message */
  fallbackMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: 'Component',
  showRetry: true,
  fallbackMessage: '',
})

const emit = defineEmits<{
  (e: 'error', error: Error, info: string): void
}>()

const hasError = ref(false)
const errorMessage = ref('')
const errorInfo = ref('')

/**
 * Capture errors from child components
 */
onErrorCaptured((error: Error, instance, info: string) => {
  hasError.value = true
  errorMessage.value = error.message || 'Error desconocido'
  errorInfo.value = info

  // Log the full error for debugging
  console.error(`[ErrorBoundary:${props.name}] Caught error:`, {
    error,
    component: instance?.$options?.name,
    info,
  })

  // Emit for parent handling
  emit('error', error, info)

  // Return false to prevent the error from propagating
  return false
})

/**
 * Reset the error state to retry rendering
 */
function retry() {
  hasError.value = false
  errorMessage.value = ''
  errorInfo.value = ''
}
</script>

<template>
  <div class="h-full w-full">
    <!-- Error State -->
    <div v-if="hasError" class="flex items-center justify-center min-h-[100px] p-4">
      <Alert variant="destructive" class="max-w-lg">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>
          <div class="flex flex-col gap-2">
            <span class="font-medium">
              {{ fallbackMessage || `Error en ${name}` }}
            </span>
            <span class="text-sm opacity-80">
              {{ errorMessage }}
            </span>
            <Button
              v-if="showRetry"
              variant="outline"
              size="sm"
              class="mt-2 w-fit"
              @click="retry"
            >
              <RefreshCw class="mr-2 h-3 w-3" />
              Reintentar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>

    <!-- Normal Content -->
    <slot v-else />
  </div>
</template>
