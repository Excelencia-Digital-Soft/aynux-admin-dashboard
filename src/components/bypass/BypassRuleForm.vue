<script setup lang="ts">
import { onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useBypassRuleForm } from '@/composables/useBypassRuleForm'
import BypassRuleBasicInfo from './form/BypassRuleBasicInfo.vue'
import BypassRuleCondition from './form/BypassRuleCondition.vue'
import BypassRuleTarget from './form/BypassRuleTarget.vue'
import BypassRuleIsolation from './form/BypassRuleIsolation.vue'

const {
  store,
  formData,
  availableAgents,
  loadingAgents,
  availablePharmacies,
  loadingPharmacies,
  availableInstitutions,
  loadingInstitutions,
  ruleTypeOptions,
  domainOptions,
  showPharmacySelector,
  showInstitutionSelector,
  isEditing,
  dialogTitle,
  canSave,
  isLoading,
  loadDependencies,
  handleSubmit,
  handleClose
} = useBypassRuleForm()

onMounted(() => {
  loadDependencies()
})
</script>

<template>
  <Dialog :open="store.showRuleDialog" @update:open="(v: boolean) => { if (!v) handleClose() }">
    <DialogContent class="glass-dialog sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription class="sr-only">
          Formulario para {{ isEditing ? 'editar' : 'crear' }} una regla de bypass
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- Basic Info Section -->
        <BypassRuleBasicInfo v-model:formData="formData" />

        <Separator />

        <!-- Rule Type Section -->
        <BypassRuleCondition v-model:formData="formData" :rule-type-options="ruleTypeOptions" />

        <Separator />

        <!-- Target Section -->
        <BypassRuleTarget
          v-model:formData="formData"
          :available-agents="availableAgents"
          :loading-agents="loadingAgents"
          :domain-options="domainOptions"
          :available-pharmacies="availablePharmacies"
          :loading-pharmacies="loadingPharmacies"
          :available-institutions="availableInstitutions"
          :loading-institutions="loadingInstitutions"
          :show-pharmacy-selector="showPharmacySelector"
          :show-institution-selector="showInstitutionSelector"
        />

        <Separator />

        <!-- Isolation Section -->
        <BypassRuleIsolation v-model:formData="formData" />

        <!-- Validation Message -->
        <Alert v-if="!canSave && formData.rule_name" variant="destructive">
          <AlertDescription>
            Completa todos los campos requeridos segun el tipo de regla seleccionado.
          </AlertDescription>
        </Alert>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="isLoading" @click="handleClose">
          Cancelar
        </Button>
        <Button :disabled="!canSave" @click="handleSubmit">
          <i v-if="isLoading" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-check mr-2" />
          {{ isEditing ? 'Guardar' : 'Crear' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
