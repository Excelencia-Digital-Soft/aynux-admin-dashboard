import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: [
      // PrimeVue components that cause 504 errors
      'primevue/message',
      'primevue/fileupload',
      'primevue/progressbar',
      'primevue/dialog',
      'primevue/datatable',
      'primevue/column',
      'primevue/tabs',
      'primevue/tablist',
      'primevue/tab',
      'primevue/tabpanels',
      'primevue/tabpanel',
      'primevue/card',
      'primevue/button',
      'primevue/inputtext',
      'primevue/textarea',
      'primevue/select',
      'primevue/tag',
      'primevue/paginator',
      'primevue/skeleton',
      'primevue/progressspinner',
      'primevue/radiobutton',
      'primevue/checkbox',
      'primevue/toast',
      'primevue/confirmdialog',
      'primevue/tooltip',
      'primevue/badge',
      'primevue/avatar',
      'primevue/menu',
      'primevue/menubar',
      'primevue/breadcrumb',
      'primevue/splitbutton',
      'primevue/inputnumber',
      'primevue/datepicker',
      'primevue/select',
      'primevue/toggleswitch',
      'primevue/autocomplete',
      'primevue/popover',
      'primevue/drawer',
      'primevue/multiselect',
      // Third-party libraries
      'marked',
      'dayjs',
      'axios',
      'uuid',
      'chart.js',
      'vue-chartjs'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'primevue': ['primevue'],
          'chart': ['chart.js', 'vue-chartjs'],
          'vue-flow': ['@vue-flow/core', '@vue-flow/background', '@vue-flow/controls', '@vue-flow/minimap'],
          // Utility chunks
          'utils': ['axios', 'dayjs', 'marked', 'uuid']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
