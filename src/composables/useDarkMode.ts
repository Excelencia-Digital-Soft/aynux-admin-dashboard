import { ref, onMounted } from 'vue'

// Global state - shared across all components using this composable
const isDark = ref(false)
const isInitialized = ref(false)

/**
 * Dark mode composable for Aynux Admin
 * Provides toggle functionality with localStorage persistence
 * and system preference detection
 */
export function useDarkMode() {
  onMounted(() => {
    if (!isInitialized.value) {
      initializeDarkMode()
      isInitialized.value = true
    }
  })

  function initializeDarkMode() {
    // Check localStorage first
    const saved = localStorage.getItem('aynux-dark-mode')

    if (saved !== null) {
      isDark.value = saved === 'true'
    } else {
      // Fall back to system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    updateDarkModeClass()

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only apply if user hasn't set a preference
      if (localStorage.getItem('aynux-dark-mode') === null) {
        isDark.value = e.matches
        updateDarkModeClass()
      }
    })
  }

  function toggleDarkMode() {
    isDark.value = !isDark.value
    localStorage.setItem('aynux-dark-mode', String(isDark.value))
    updateDarkModeClass()
  }

  function setDarkMode(value: boolean) {
    isDark.value = value
    localStorage.setItem('aynux-dark-mode', String(value))
    updateDarkModeClass()
  }

  function updateDarkModeClass() {
    if (isDark.value) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }

  return {
    isDark,
    toggleDarkMode,
    setDarkMode
  }
}
