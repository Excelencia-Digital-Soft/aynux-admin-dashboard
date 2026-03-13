<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useEventosConfig } from '@/composables/useEventosConfig'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Save } from 'lucide-vue-next'

interface CompanyForm {
  company_name: string
  address: string
  phone: string
  email: string
  website: string
  google_maps_link: string
  calendar_link: string
  payment_hours: string
  additional_info: string
}

// Friendly labels for known static_page keys (fallback: formatted key name)
const KNOWN_LABELS: Record<string, string> = {
  pagos_info: 'Informacion de pagos',
  menus_especiales: 'Menus especiales',
  devolucion_info: 'Devolucion / Baja',
  egresados_inscription_2026: 'Inscripcion Egresados 2026',
  egresados_inscription_2027: 'Inscripcion Egresados 2027',
  lead_saved: 'Confirmacion de consulta',
  form_ack: 'Acuse de recibo (formulario)',
  fallback_text: 'Respuesta cuando no entiende'
}

function formatPageKey(key: string): string {
  return KNOWN_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const props = defineProps<{ organizationId: string }>()
const { companyInfo, fetchCompanyInfo, updateCompanyInfo, isLoading } = useEventosConfig()

const form = ref<CompanyForm>({
  company_name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  google_maps_link: '',
  calendar_link: '',
  payment_hours: '',
  additional_info: ''
})

// Static pages (bot messages)
const staticPages = ref<Record<string, string>>({})

// Dynamic key-value pairs for business_hours
const hoursEntries = ref<{ key: string; value: string }[]>([])

// Dynamic key-value pairs for social_media
const socialEntries = ref<{ key: string; value: string }[]>([])

function syncFormFromStore() {
  const info = companyInfo.value
  if (info) {
    form.value = {
      company_name: info.company_name ?? '',
      address: info.address ?? '',
      phone: info.phone ?? '',
      email: info.email ?? '',
      website: info.website ?? '',
      google_maps_link: info.google_maps_link ?? '',
      calendar_link: info.calendar_link ?? '',
      payment_hours: info.payment_hours ?? '',
      additional_info: info.additional_info ?? ''
    }
    // Sync hours entries
    const hours = info.business_hours || {}
    hoursEntries.value = Object.entries(hours).map(([key, value]) => ({ key, value }))
    if (hoursEntries.value.length === 0) {
      hoursEntries.value = [{ key: 'lunes_viernes', value: '' }, { key: 'sabados', value: '' }]
    }
    // Sync social entries
    const social = info.social_media || {}
    socialEntries.value = Object.entries(social).map(([key, value]) => ({ key, value }))
    if (socialEntries.value.length === 0) {
      socialEntries.value = [{ key: 'instagram', value: '' }, { key: 'facebook', value: '' }]
    }
    // Sync static pages (driven by DB keys)
    const pages = info.static_pages || {}
    staticPages.value = { ...pages }
  } else {
    hoursEntries.value = [{ key: 'lunes_viernes', value: '' }, { key: 'sabados', value: '' }]
    socialEntries.value = [{ key: 'instagram', value: '' }, { key: 'facebook', value: '' }]
    staticPages.value = {}
  }
}

watch(companyInfo, syncFormFromStore)

onMounted(() => {
  syncFormFromStore()
})

function addHoursEntry() {
  hoursEntries.value.push({ key: '', value: '' })
}

function removeHoursEntry(index: number) {
  hoursEntries.value.splice(index, 1)
}

function addSocialEntry() {
  socialEntries.value.push({ key: '', value: '' })
}

function removeSocialEntry(index: number) {
  socialEntries.value.splice(index, 1)
}

async function handleSave() {
  // Build business_hours from entries
  const hours: Record<string, string> = {}
  for (const entry of hoursEntries.value) {
    if (entry.key.trim()) {
      hours[entry.key.trim()] = entry.value.trim()
    }
  }

  // Build social_media from entries
  const social: Record<string, string> = {}
  for (const entry of socialEntries.value) {
    if (entry.key.trim()) {
      social[entry.key.trim()] = entry.value.trim()
    }
  }

  // Build static_pages from entries (only non-empty values)
  const pages: Record<string, string> = {}
  for (const [key, value] of Object.entries(staticPages.value)) {
    if (value.trim()) {
      pages[key] = value.trim()
    }
  }

  await updateCompanyInfo(props.organizationId, {
    company_name: form.value.company_name || null,
    address: form.value.address || null,
    phone: form.value.phone || null,
    email: form.value.email || null,
    website: form.value.website || null,
    google_maps_link: form.value.google_maps_link || null,
    calendar_link: form.value.calendar_link || null,
    payment_hours: form.value.payment_hours || null,
    additional_info: form.value.additional_info || null,
    business_hours: Object.keys(hours).length > 0 ? hours : null,
    social_media: Object.keys(social).length > 0 ? social : null,
    static_pages: Object.keys(pages).length > 0 ? pages : null
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Datos Generales -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-id-card text-sm" />
          Datos Generales
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Nombre de la empresa</Label>
            <Input v-model="form.company_name" placeholder="Ej: Mi Empresa S.A." />
          </div>
          <div class="space-y-2">
            <Label>Telefono</Label>
            <Input v-model="form.phone" placeholder="Ej: +54 11 1234-5678" />
          </div>
          <div class="space-y-2">
            <Label>Email</Label>
            <Input v-model="form.email" type="email" placeholder="info@miempresa.com" />
          </div>
          <div class="space-y-2">
            <Label>Sitio web</Label>
            <Input v-model="form.website" placeholder="https://www.miempresa.com" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Ubicacion -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-map-marker text-sm" />
          Ubicacion
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label>Direccion</Label>
          <Input v-model="form.address" placeholder="Ej: Av. Ejemplo 123, Ciudad" />
        </div>
        <div class="space-y-2">
          <Label>Link de Google Maps</Label>
          <Input v-model="form.google_maps_link" placeholder="https://maps.google.com/..." />
        </div>
      </CardContent>
    </Card>

    <!-- Horarios -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-clock text-sm" />
          Horarios
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label class="mb-2 block">Horarios de atencion</Label>
          <div class="space-y-2">
            <div v-for="(entry, index) in hoursEntries" :key="index" class="flex items-center gap-2">
              <Input
                v-model="entry.key"
                placeholder="Ej: lunes_viernes"
                class="w-1/3"
              />
              <Input
                v-model="entry.value"
                placeholder="Ej: 9:00 a 19:00"
                class="flex-1"
              />
              <Button variant="ghost" size="icon" @click="removeHoursEntry(index)">
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" class="mt-2" @click="addHoursEntry">
            <Plus class="h-4 w-4 mr-1" />
            Agregar horario
          </Button>
        </div>
        <div class="space-y-2">
          <Label>Horario de cobranza</Label>
          <Input v-model="form.payment_hours" placeholder="Ej: Lunes a Viernes de 9 a 16hs" />
        </div>
      </CardContent>
    </Card>

    <!-- Agenda -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-calendar text-sm" />
          Agenda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <Label>Link de agenda (Calendly, etc.)</Label>
          <Input v-model="form.calendar_link" placeholder="https://calendly.com/..." />
        </div>
      </CardContent>
    </Card>

    <!-- Redes Sociales -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-share-alt text-sm" />
          Redes Sociales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div v-for="(entry, index) in socialEntries" :key="index" class="flex items-center gap-2">
            <Input
              v-model="entry.key"
              placeholder="Ej: instagram"
              class="w-1/3"
            />
            <Input
              v-model="entry.value"
              placeholder="Ej: https://instagram.com/miempresa"
              class="flex-1"
            />
            <Button variant="ghost" size="icon" @click="removeSocialEntry(index)">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" class="mt-2" @click="addSocialEntry">
          <Plus class="h-4 w-4 mr-1" />
          Agregar red social
        </Button>
      </CardContent>
    </Card>

    <!-- Info Adicional -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-info-circle text-sm" />
          Informacion Adicional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          v-model="form.additional_info"
          placeholder="Notas adicionales que se mostraran en el chat..."
          :rows="4"
        />
      </CardContent>
    </Card>

    <!-- Mensajes del Bot -->
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center gap-2">
          <i class="pi pi-comment text-sm" />
          Mensajes del Bot
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="Object.keys(staticPages).length === 0" class="text-sm text-muted-foreground">
          No hay mensajes configurados en la base de datos.
        </div>
        <div v-for="key in Object.keys(staticPages)" :key="key" class="space-y-2">
          <Label>{{ formatPageKey(key) }}</Label>
          <Textarea
            v-model="staticPages[key]"
            :placeholder="`Texto para: ${formatPageKey(key)}`"
            :rows="3"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Save Button -->
    <div class="flex justify-end">
      <Button @click="handleSave" :disabled="isLoading">
        <Save class="h-4 w-4 mr-2" />
        Guardar cambios
      </Button>
    </div>
  </div>
</template>
