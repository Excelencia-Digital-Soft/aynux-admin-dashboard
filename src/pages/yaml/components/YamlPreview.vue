<template>
  <div class="yaml-preview max-h-[80vh] overflow-y-auto">
    <!-- Template Structure -->
    <Card class="mb-4">
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-4">
          <Code class="h-4 w-4" />
          <span class="font-semibold text-sm">Estructura del Template</span>
        </div>

        <div v-if="template.prompts && template.prompts.length > 0">
          <div v-for="(prompt, index) in template.prompts" :key="index" class="p-4 border rounded-lg bg-card mb-4">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-medium text-foreground m-0">{{ prompt.name || prompt.key }}</h4>
              <Badge variant="secondary">{{ prompt.version }}</Badge>
            </div>

            <div v-if="prompt.description" class="text-muted-foreground text-sm mb-2">
              {{ prompt.description }}
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-sm">Template:</span>
                <Button
                  variant="secondary"
                  size="sm"
                  @click="showRenderedPreview = !showRenderedPreview"
                >
                  <component :is="showRenderedPreview ? EyeOff : Eye" class="mr-2 h-3.5 w-3.5" />
                  {{ showRenderedPreview ? 'Ocultar preview' : 'Mostrar preview' }}
                </Button>
              </div>

              <pre v-if="!showRenderedPreview" class="bg-muted/50 border rounded p-4 font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{{ prompt.template }}</pre>

              <!-- Rendered Preview -->
              <div v-else class="bg-muted/30 p-4 rounded">
                <div class="flex justify-between items-center mb-4">
                  <span class="font-medium text-sm">Preview con variables de prueba:</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="editTestVariables"
                  >
                    <Pencil class="mr-2 h-3.5 w-3.5" />
                    Editar variables
                  </Button>
                </div>
                <pre class="bg-muted/50 border rounded p-4 font-mono text-sm whitespace-pre-wrap text-foreground">{{ renderTemplate(prompt.template) }}</pre>
              </div>
            </div>

            <!-- Metadata -->
            <div v-if="prompt.metadata" class="mt-3 bg-muted/30 p-4 rounded">
              <h5 class="font-medium text-foreground text-sm m-0 mb-2">Metadatos</h5>
              <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 mb-4">
                <div>
                  <span class="font-medium text-sm">Modelo:</span>
                  <Badge class="ml-2">{{ prompt.metadata.model }}</Badge>
                </div>
                <div>
                  <span class="font-medium text-sm">Temperature:</span>
                  <span class="ml-2 text-sm">{{ prompt.metadata.temperature }}</span>
                </div>
                <div>
                  <span class="font-medium text-sm">Max Tokens:</span>
                  <span class="ml-2 text-sm">{{ prompt.metadata.max_tokens }}</span>
                </div>
              </div>

              <!-- Variables -->
              <div v-if="prompt.metadata.variables">
                <div v-if="prompt.metadata.variables.required && prompt.metadata.variables.required.length > 0">
                  <span class="font-medium text-sm">Variables requeridas:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <Badge
                      v-for="variable in prompt.metadata.variables.required"
                      :key="variable"
                      variant="destructive"
                    >
                      {{ variable }}
                    </Badge>
                  </div>
                </div>

                <div v-if="prompt.metadata.variables.optional && prompt.metadata.variables.optional.length > 0" class="mt-2">
                  <span class="font-medium text-sm">Variables opcionales:</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <Badge
                      v-for="variable in prompt.metadata.variables.optional"
                      :key="variable"
                      variant="info"
                    >
                      {{ variable }}
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- Tags -->
              <div v-if="prompt.metadata.tags && prompt.metadata.tags.length > 0" class="mt-2">
                <span class="font-medium text-sm">Tags:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <Badge
                    v-for="tag in prompt.metadata.tags"
                    :key="tag"
                    variant="secondary"
                  >
                    {{ tag }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-muted-foreground">
          No se encontraron prompts en este template
        </div>
      </CardContent>
    </Card>

    <!-- Test Variables Dialog -->
    <Dialog v-model:open="showTestVariablesDialog">
      <DialogContent class="sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>Variables de Prueba</DialogTitle>
          <DialogDescription class="sr-only">Editar variables de prueba para preview del template</DialogDescription>
        </DialogHeader>

        <div class="max-h-[60vh] overflow-y-auto space-y-4 py-4">
          <div
            v-for="variable in allVariables"
            :key="variable.name"
          >
            <label :for="variable.name" class="block text-sm font-medium text-foreground mb-1">
              {{ variable.name }}
              <span v-if="variable.required" class="text-destructive">*</span>
            </label>
            <Input
              :id="variable.name"
              v-model="testVariables[variable.name]"
              :placeholder="`Ejemplo: ${getVariableExample(variable.name)}`"
              class="w-full"
            />
            <small v-if="variable.example" class="text-muted-foreground text-xs">
              Ejemplo: {{ variable.example }}
            </small>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" @click="showTestVariablesDialog = false">
            Cancelar
          </Button>
          <Button @click="applyTestVariables">
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { Code, Eye, EyeOff, Pencil } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

interface Props {
  template: any
  variables?: Record<string, any>
  onClose?: () => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const toast = useToast()

// Component state
const showRenderedPreview = ref(false)
const showTestVariablesDialog = ref(false)
const testVariables = ref<Record<string, any>>(props.variables || {})

// Computed
const allVariables = computed(() => {
  const variables: Array<{ name: string; required: boolean; example?: string }> = []

  if (props.template.prompts) {
    props.template.prompts.forEach((prompt: any) => {
      if (prompt.metadata?.variables) {
        if (prompt.metadata.variables.required) {
          prompt.metadata.variables.required.forEach((varName: string) => {
            if (!variables.find(v => v.name === varName)) {
              variables.push({
                name: varName,
                required: true,
                example: getVariableExample(varName)
              })
            }
          })
        }

        if (prompt.metadata.variables.optional) {
          prompt.metadata.variables.optional.forEach((varName: string) => {
            if (!variables.find(v => v.name === varName)) {
              variables.push({
                name: varName,
                required: false,
                example: getVariableExample(varName)
              })
            }
          })
        }
      }
    })
  }

  return variables
})

// Methods
function renderTemplate(template: string): string {
  let rendered = template

  Object.entries(testVariables.value).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    rendered = rendered.replace(regex, String(value))
  })

  allVariables.value.forEach(variable => {
    if (!testVariables.value[variable.name]) {
      const regex = new RegExp(`\\{${variable.name}\\}`, 'g')
      const placeholder = variable.required ? `[${variable.name}]` : `[${variable.name}?]`
      rendered = rendered.replace(regex, placeholder)
    }
  })

  return rendered
}

function getVariableExample(variableName: string): string {
  const examples: Record<string, string> = {
    'name': 'Juan Perez',
    'email': 'juan.perez@ejemplo.com',
    'company': 'Empresa S.A.',
    'product': 'Producto X',
    'objective': 'Ayudar al cliente a resolver su problema',
    'context': 'El cliente esta llamando sobre un problema tecnico',
    'tone': 'profesional y amigable',
    'language': 'español',
    'topic': 'Soporte tecnico',
    'question': 'Como puedo ayudarle hoy?',
    'answer': 'Aqui esta la respuesta que busca',
    'date': new Date().toLocaleDateString('es-ES'),
    'time': new Date().toLocaleTimeString('es-ES'),
    'location': 'Buenos Aires, Argentina',
    'phone': '+54 11 1234-5678',
    'address': 'Calle Falsa 123',
    'order_id': 'ORD-12345',
    'customer_id': 'CUST-67890',
    'amount': '$1,234.56',
    'currency': 'ARS',
    'status': 'activo'
  }

  return examples[variableName.toLowerCase()] || 'valor de ejemplo'
}

function editTestVariables() {
  allVariables.value.forEach(variable => {
    if (!testVariables.value[variable.name]) {
      testVariables.value[variable.name] = getVariableExample(variable.name)
    }
  })

  showTestVariablesDialog.value = true
}

function applyTestVariables() {
  showTestVariablesDialog.value = false

  toast.add({
    severity: 'success',
    summary: 'Variables actualizadas',
    detail: 'Las variables de prueba han sido aplicadas',
    life: 3000
  })
}
</script>
