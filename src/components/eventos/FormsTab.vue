<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEventosStore } from '@/stores/eventos.store'
import { useEventosConfig } from '@/composables/useEventosConfig'
import type { FormField } from '@/types/eventosConfig.types'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Plus, X, List, Tag, FileEdit } from 'lucide-vue-next'
import PromptTemplateEditor from './PromptTemplateEditor.vue'

const props = defineProps<{ organizationId: string }>()

const store = useEventosStore()
const { forms, updateForm, openFormDialog, closeFormDialog, seedDefaults } = useEventosConfig()

// Edit form
const editForm = ref({
  display_name: '',
  instruction_text: '',
  fields: [] as FormField[],
  notification_tag: '',
  is_active: true
})

watch(() => store.showFormDialog, (open) => {
  if (open && store.editingForm) {
    const f = store.editingForm
    editForm.value = {
      display_name: f.display_name,
      instruction_text: f.instruction_text || '',
      fields: f.fields ? f.fields.map(fld => ({ ...fld })) : [],
      notification_tag: f.notification_tag || '',
      is_active: f.is_active
    }
  }
})

async function handleSave() {
  if (!store.editingForm) return
  await updateForm(store.editingForm.id, {
    display_name: editForm.value.display_name,
    instruction_text: editForm.value.instruction_text || null,
    fields: editForm.value.fields.length > 0 ? editForm.value.fields : null,
    notification_tag: editForm.value.notification_tag || null,
    is_active: editForm.value.is_active
  })
}

function addField() {
  editForm.value.fields.push({ name: '', label: '', type: 'text', required: false })
}

function removeField(idx: number) {
  editForm.value.fields.splice(idx, 1)
}

const fieldTypeOptions = ['text', 'number', 'email', 'phone', 'date', 'select', 'textarea']

function getFormTypeLabel(formType: string): string {
  const labels: Record<string, string> = {
    corporate_budget: 'Presupuesto Empresarial',
    wedding_budget: 'Presupuesto Casamiento',
    quince_budget: 'Presupuesto Quince',
    graduation_budget: 'Presupuesto Egresados',
    social_budget: 'Presupuesto Social',
    kids_budget: 'Presupuesto Infantil',
    travel_budget: 'Presupuesto Viaje'
  }
  return labels[formType] || formType
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card
      v-for="form in forms"
      :key="form.id"
      class="glass-card cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
      @click="openFormDialog(form)"
    >
      <CardContent class="p-4">
        <div class="flex items-start justify-between mb-3">
          <Badge variant="outline" class="font-mono text-xs">{{ form.form_type }}</Badge>
          <Switch
            :checked="form.is_active"
            @click.stop
            @update:checked="(v: boolean) => updateForm(form.id, { is_active: v })"
          />
        </div>
        <h3 class="font-semibold text-sm mb-1">{{ form.display_name }}</h3>
        <p class="text-xs text-muted-foreground line-clamp-2">
          {{ form.instruction_text || 'Sin instrucciones' }}
        </p>
        <div class="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <List class="w-3.5 h-3.5" />
          <span>{{ form.fields?.length || 0 }} campos</span>
          <span v-if="form.notification_tag" class="ml-auto flex items-center gap-1">
            <Tag class="w-3 h-3" />
            {{ form.notification_tag }}
          </span>
        </div>
      </CardContent>
    </Card>

    <div v-if="forms.length === 0" class="col-span-full flex flex-col items-center justify-center text-muted-foreground py-12">
      <FileEdit class="w-10 h-10 mb-3" />
      <p class="mb-4">No hay formularios configurados</p>
      <Button variant="outline" @click="seedDefaults(props.organizationId)">
        Cargar datos por defecto
      </Button>
    </div>
  </div>

  <!-- Edit Form Dialog -->
  <Dialog v-model:open="store.showFormDialog">
    <DialogContent class="glass-dialog max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Editar Formulario</DialogTitle>
        <DialogDescription>
          {{ store.editingForm ? getFormTypeLabel(store.editingForm.form_type) : '' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- Compact metadata grid -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-sm font-medium mb-1 block">Nombre visible</label>
            <Input v-model="editForm.display_name" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Tag de notificacion</label>
            <Input v-model="editForm.notification_tag" placeholder="Ej: budget_request" />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Switch v-model:checked="editForm.is_active" />
          <label class="text-sm font-medium">Activo</label>
        </div>

        <!-- Main Tabs: Plantilla / Campos -->
        <Tabs default-value="template" class="w-full">
          <TabsList class="w-full">
            <TabsTrigger value="template" class="flex-1">Plantilla</TabsTrigger>
            <TabsTrigger value="fields" class="flex-1">
              Campos
              <Badge v-if="editForm.fields.length > 0" variant="secondary" class="ml-1.5 text-[10px] px-1.5">
                {{ editForm.fields.length }}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" class="mt-3">
            <PromptTemplateEditor
              v-model="editForm.instruction_text"
              :fields="editForm.fields"
            />
          </TabsContent>

          <TabsContent value="fields" class="mt-3">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Campos del formulario</h4>
                <Button variant="outline" size="sm" @click="addField">
                  <Plus class="w-3.5 h-3.5 mr-1" />
                  Agregar Campo
                </Button>
              </div>

              <div v-if="editForm.fields.length > 0" class="space-y-3">
                <div
                  v-for="(field, idx) in editForm.fields"
                  :key="idx"
                  class="flex items-center gap-2 p-2 border rounded-md"
                >
                  <Input v-model="field.name" placeholder="name" class="flex-1" />
                  <Input v-model="field.label" placeholder="Label" class="flex-1" />
                  <Select v-model="field.type">
                    <SelectTrigger class="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="t in fieldTypeOptions" :key="t" :value="t">{{ t }}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div class="flex items-center gap-1.5">
                    <Checkbox
                      :checked="field.required"
                      @update:checked="(v: boolean) => field.required = v"
                    />
                    <span class="text-xs">Req</span>
                  </div>
                  <Button variant="ghost" size="icon" @click="removeField(idx)">
                    <X class="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p v-else class="text-sm text-muted-foreground">Sin campos configurados</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeFormDialog">Cancelar</Button>
        <Button @click="handleSave">Guardar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
