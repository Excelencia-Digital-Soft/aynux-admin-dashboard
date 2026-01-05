import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import AynuxPreset from './theme/aynux-preset'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import router from './router'

// Styles
import 'primeicons/primeicons.css'
import './assets/main.css'

const app = createApp(App)

// Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

// Vue Router
app.use(router)

// PrimeVue with Aynux custom theme (based on Lara)
app.use(PrimeVue, {
  theme: {
    preset: AynuxPreset,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities'
      }
    }
  }
})

// PrimeVue services
app.use(ToastService)
app.use(ConfirmationService)

// PrimeVue directives
app.directive('tooltip', Tooltip)

app.mount('#app')
