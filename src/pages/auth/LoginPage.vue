<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const { login, loginError, clearError } = useAuth()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

onMounted(() => {
  clearError()
})

async function handleLogin() {
  if (!email.value || !password.value) {
    return
  }

  isLoading.value = true
  try {
    await login(email.value, password.value)
  } finally {
    isLoading.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-6">
          <img
            src="@/assets/full-aynux.png"
            alt="Aynux"
            class="h-20 object-contain"
          />
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Panel de Administracion</h1>
        <p class="text-gray-500 mt-2">Ingresa tus credenciales para continuar</p>
      </div>

      <!-- Error Message -->
      <Alert v-if="loginError" variant="destructive" class="mb-4">
        <AlertDescription>{{ loginError }}</AlertDescription>
      </Alert>

      <!-- Login Form -->
      <form class="space-y-6" @submit.prevent="handleLogin">
        <div class="flex flex-col gap-2">
          <Label for="email" class="text-gray-700">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            :disabled="isLoading"
            @keydown="handleKeydown"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="password" class="text-gray-700">Password</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Tu password"
              class="pr-10"
              :disabled="isLoading"
              @keydown="handleKeydown"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabindex="-1"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
            </button>
          </div>
        </div>

        <Button
          type="submit"
          class="w-full"
          :loading="isLoading"
          :disabled="!email || !password"
        >
          <i class="pi pi-sign-in mr-2" />
          Iniciar Sesion
        </Button>
      </form>

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-gray-100 text-center">
        <p class="text-sm text-gray-500">
          Sistema de administracion multi-tenant
        </p>
        <p class="text-xs text-gray-400 mt-1">
          <span class="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-cyan-500">Aynux</span> &copy; {{ new Date().getFullYear() }}
        </p>
      </div>
    </div>
  </div>
</template>
