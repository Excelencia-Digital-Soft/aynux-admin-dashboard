import { useConfirm as usePrimeConfirm } from 'primevue/useconfirm'

export interface ConfirmOptions {
  message: string
  header?: string
  icon?: string
  acceptLabel?: string
  rejectLabel?: string
  acceptClass?: string
  rejectClass?: string
}

export function useConfirm() {
  const confirm = usePrimeConfirm()

  function confirmAction(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirm.require({
        message: options.message,
        header: options.header || 'Confirmación',
        icon: options.icon || 'pi pi-exclamation-triangle',
        acceptLabel: options.acceptLabel || 'Sí',
        rejectLabel: options.rejectLabel || 'No',
        acceptClass: options.acceptClass || 'p-button-danger',
        rejectClass: options.rejectClass || 'p-button-secondary',
        accept: () => resolve(true),
        reject: () => resolve(false)
      })
    })
  }

  function confirmDelete(message: string): Promise<boolean> {
    return confirmAction({
      message,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar'
    })
  }

  function confirmDiscard(message: string): Promise<boolean> {
    return confirmAction({
      message,
      header: 'Cambios sin Guardar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Descartar',
      rejectLabel: 'Cancelar',
      acceptClass: 'p-button-warning'
    })
  }

  function confirmRollback(message: string): Promise<boolean> {
    return confirmAction({
      message,
      header: 'Confirmar Rollback',
      icon: 'pi pi-history',
      acceptLabel: 'Revertir',
      rejectLabel: 'Cancelar',
      acceptClass: 'p-button-warning'
    })
  }

  return {
    confirmAction,
    confirmDelete,
    confirmDiscard,
    confirmRollback
  }
}
