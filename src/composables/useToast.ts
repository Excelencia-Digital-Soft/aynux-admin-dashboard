import { useToast as usePrimeToast } from 'primevue/usetoast'

export function useToast() {
  const toast = usePrimeToast()

  function success(message: string, title = 'Exito'): void {
    toast.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000
    })
  }

  function error(message: string, title = 'Error'): void {
    toast.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 5000
    })
  }

  function warn(message: string, title = 'Advertencia'): void {
    toast.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 4000
    })
  }

  function info(message: string, title = 'Informacion'): void {
    toast.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 3000
    })
  }

  function clear(): void {
    toast.removeAllGroups()
  }

  return {
    success,
    error,
    warn,
    info,
    clear
  }
}
