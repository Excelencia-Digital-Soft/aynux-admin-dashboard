<template>
  <div class="unauthorized-page">
    <div class="unauthorized-container">
      <div class="icon-container">
        <i class="pi pi-lock"></i>
      </div>
      
      <h1>Acceso No Autorizado</h1>
      
      <p>
        Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
        Esta área está restringida a administradores del sistema.
      </p>
      
      <div class="actions">
        <Button 
          @click="goBack" 
          icon="pi pi-arrow-left" 
          label="Volver"
          severity="secondary"
        />
        <Button
          @click="goHome"
          icon="pi pi-home"
          label="Ir al Inicio"
          severity="primary"
        />
      </div>
      
      <div class="help-section">
        <h3>¿Necesitas acceso?</h3>
        <p>
          Si crees que deberías tener acceso a esta funcionalidad, 
          contacta con el administrador del sistema.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

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

<style scoped>
.unauthorized-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface-100) 0%, var(--surface-50) 100%);
  padding: 2rem;
}

.unauthorized-container {
  text-align: center;
  max-width: 500px;
  background: var(--surface-card);
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.icon-container {
  font-size: 4rem;
  color: var(--red-500);
  margin-bottom: 1.5rem;
}

h1 {
  color: var(--text-color);
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

p {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.help-section {
  border-top: 1px solid var(--surface-border);
  padding-top: 2rem;
}

.help-section h3 {
  color: var(--text-color);
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.help-section p {
  margin-bottom: 0;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .unauthorized-container {
    padding: 2rem;
  }
  
  .icon-container {
    font-size: 3rem;
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions button {
    width: 100%;
  }
}
</style>