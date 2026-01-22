<script setup lang="ts">
import { onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

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
  <Dialog
    :visible="store.showRuleDialog"
    :header="dialogTitle"
    :modal="true"
    :style="{ width: '600px' }"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Basic Info Section -->
      <BypassRuleBasicInfo v-model:formData="formData" />

      <Divider />

      <!-- Rule Type Section -->
      <BypassRuleCondition v-model:formData="formData" :rule-type-options="ruleTypeOptions" />

      <Divider />

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

      <Divider />

      <!-- Isolation Section -->
      <BypassRuleIsolation v-model:formData="formData" />

      <!-- Validation Message -->
      <Message v-if="!canSave && formData.rule_name" severity="warn" :closable="false">
        Completa todos los campos requeridos segun el tipo de regla seleccionado.
      </Message>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" :disabled="isLoading" @click="handleClose" />
      <Button
        :label="isEditing ? 'Guardar' : 'Crear'"
        icon="pi pi-check"
        :disabled="!canSave"
        :loading="isLoading"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>
