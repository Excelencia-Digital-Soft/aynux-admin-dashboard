<script setup lang="ts">
import { ref } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useBypassRules } from '@/composables/useBypassRules'
import { useAuthStore } from '@/stores/auth.store'
import BypassRulesList from '@/components/bypass/BypassRulesList.vue'
import BypassRuleForm from '@/components/bypass/BypassRuleForm.vue'
import BypassTestDialog from '@/components/bypass/BypassTestDialog.vue'
import AgentFlowGraph from '@/components/agentFlow/AgentFlowGraph.vue'
import type { BypassRule } from '@/types/bypassRules.types'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

const store = useBypassRulesStore()
const authStore = useAuthStore()
const { deleteRule, openRuleDialog, openTestDialog, closeDeleteDialog, isLoading } =
  useBypassRules()

const activeTab = ref('rules')

function handleEdit(rule: BypassRule) {
  openRuleDialog(rule)
}

function handleDelete(rule: BypassRule) {
  store.openDeleteDialog(rule)
}

async function confirmDelete() {
  if (store.deletingRule) {
    await deleteRule(store.deletingRule.id)
  }
}

function cancelDelete() {
  closeDeleteDialog()
}
</script>

<template>
  <div class="bypass-rules-page">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Reglas de Bypass</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Administra las reglas de enrutamiento para conversaciones de WhatsApp
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="openTestDialog">
          <i class="pi pi-play mr-2" />
          Probar Enrutamiento
        </Button>
        <Button @click="openRuleDialog(null)">
          <i class="pi pi-plus mr-2" />
          Nueva Regla
        </Button>
      </div>
    </div>

    <!-- Content with Tabs -->
    <Card class="glass-card">
      <CardContent class="pt-6">
        <Tabs v-model="activeTab" default-value="rules">
          <TabsList>
            <TabsTrigger value="rules">
              <i class="pi pi-list mr-2" />
              Reglas
            </TabsTrigger>
            <TabsTrigger value="visualization">
              <i class="pi pi-sitemap mr-2" />
              Visualizacion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" class="mt-4">
            <BypassRulesList @edit="handleEdit" @delete="handleDelete" />
          </TabsContent>

          <TabsContent value="visualization" class="mt-4">
            <AgentFlowGraph
              :organization-id="authStore.currentOrgId ?? undefined"
              height="600px"
              :show-minimap="true"
              :show-controls="true"
              :show-legend="true"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <!-- Form Dialog -->
    <BypassRuleForm />

    <!-- Test Dialog -->
    <BypassTestDialog />

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="store.showDeleteDialog" @update:open="(v: boolean) => { if (!v) cancelDelete() }">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Regla</AlertDialogTitle>
          <AlertDialogDescription>
            Esta seguro de eliminar la regla "{{ store.deletingRule?.rule_name }}"?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert variant="destructive" class="mt-2">
          <AlertDescription>
            Esta accion no se puede deshacer. Las conversaciones ya no seran enrutadas por esta regla.
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLoading" @click="cancelDelete">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isLoading"
            @click="confirmDelete"
          >
            <i v-if="isLoading" class="pi pi-spinner pi-spin mr-2" />
            <i v-else class="pi pi-trash mr-2" />
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
