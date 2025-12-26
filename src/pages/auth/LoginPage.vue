<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const { login, loginError, clearError, isAuthenticated } = useAuth()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

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
    <div class="bg-white rounded-2xl shadow-2xl p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
          <i class="pi pi-lock text-3xl text-primary-600" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Aynux Admin</h1>
        <p class="text-gray-500 mt-2">Ingresa tus credenciales para continuar</p>
      </div>

      <!-- Error Message -->
      <Message v-if="loginError" severity="error" class="mb-4" :closable="false">
        {{ loginError }}
      </Message>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="flex flex-col gap-2">
          <label for="email" class="text-sm font-medium text-gray-700">Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            class="w-full"
            :disabled="isLoading"
            @keydown="handleKeydown"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="text-sm font-medium text-gray-700">Password</label>
          <Password
            id="password"
            v-model="password"
            placeholder="Tu password"
            :feedback="false"
            toggleMask
            class="w-full"
            inputClass="w-full"
            :disabled="isLoading"
            @keydown="handleKeydown"
          />
        </div>

        <Button
          type="submit"
          label="Iniciar Sesion"
          icon="pi pi-sign-in"
          :loading="isLoading"
          class="w-full"
          :disabled="!email || !password"
        />
      </form>

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t text-center">
        <p class="text-sm text-gray-500">
          Sistema de administracion multi-tenant
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Aynux &copy; 2024
        </p>
      </div>
    </div>
  </div>
</template>
