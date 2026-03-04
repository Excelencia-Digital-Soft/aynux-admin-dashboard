<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Lock, ArrowLeft, Home } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}

function goHome() {
  router.push('/chat-visualizer')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 to-background p-8">
    <Card class="max-w-[500px] w-full text-center">
      <CardContent class="p-8 space-y-6">
        <div class="text-red-500">
          <Lock class="h-16 w-16 mx-auto" />
        </div>

        <h1 class="text-2xl font-semibold text-foreground">Acceso No Autorizado</h1>

        <p class="text-muted-foreground leading-relaxed">
          Lo sentimos, no tienes los permisos necesarios para acceder a esta pagina.
          Esta area esta restringida a administradores del sistema.
        </p>

        <div class="flex gap-3 justify-center flex-wrap">
          <Button variant="secondary" @click="goBack">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button @click="goHome">
            <Home class="mr-2 h-4 w-4" />
            Ir al Inicio
          </Button>
        </div>

        <Separator />

        <div>
          <h3 class="text-lg font-medium text-foreground mb-1">Necesitas acceso?</h3>
          <p class="text-sm text-muted-foreground mb-0">
            Si crees que deberias tener acceso a esta funcionalidad,
            contacta con el administrador del sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
