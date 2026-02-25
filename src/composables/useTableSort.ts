import { ref, computed, type Ref, type ComputedRef } from 'vue'

export function useTableSort<T>(
  source: Ref<T[]> | ComputedRef<T[]>,
  defaultField: string = 'intent_key'
) {
  const sortField = ref<string>(defaultField)
  const sortOrder = ref<1 | -1>(1)

  function toggleSort(field: string) {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 1 ? -1 : 1
    } else {
      sortField.value = field
      sortOrder.value = 1
    }
  }

  const sortedData = computed(() => {
    const arr = [...source.value]
    const field = sortField.value as keyof T
    return arr.sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return (Number(aVal) - Number(bVal)) * sortOrder.value
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * sortOrder.value
      }
      return String(aVal).localeCompare(String(bVal)) * sortOrder.value
    })
  })

  return { sortField, sortOrder, toggleSort, sortedData }
}
