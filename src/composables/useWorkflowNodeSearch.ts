/**
 * Composable for Workflow node search functionality
 *
 * Provides search and navigation to workflow nodes.
 */

import { ref, computed, watch } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { useWorkflowStore } from '@/stores/workflow.store'
import type { NodeInstance } from '@/types/workflow.types'

export interface SearchResult {
  id: string
  label: string
  instanceKey: string
  nodeType: string
  icon: string
  isEntryPoint: boolean
}

export function useWorkflowNodeSearch() {
  const store = useWorkflowStore()
  const { setCenter, getNodes } = useVueFlow()

  // State
  const query = ref('')
  const isSearchOpen = ref(false)
  const highlightedNodeId = ref<string | null>(null)

  // Computed - search results
  const results = computed((): SearchResult[] => {
    const q = query.value.toLowerCase().trim()
    if (!q) return []

    return store.nodeInstances
      .filter((node) => {
        const labelMatch = node.display_label.toLowerCase().includes(q)
        const keyMatch = node.instance_key.toLowerCase().includes(q)
        const typeMatch = node.node_type?.toLowerCase().includes(q)
        return labelMatch || keyMatch || typeMatch
      })
      .map((node) => ({
        id: node.id,
        label: node.display_label,
        instanceKey: node.instance_key,
        nodeType: node.node_type || 'unknown',
        icon: node.icon || getIconForType(node.node_type || ''),
        isEntryPoint: node.is_entry_point
      }))
      .slice(0, 10) // Limit to 10 results
  })

  // Get all nodes for listing
  const allNodes = computed((): SearchResult[] => {
    return store.nodeInstances.map((node) => ({
      id: node.id,
      label: node.display_label,
      instanceKey: node.instance_key,
      nodeType: node.node_type || 'unknown',
      icon: node.icon || getIconForType(node.node_type || ''),
      isEntryPoint: node.is_entry_point
    }))
  })

  /**
   * Get icon class for node type
   */
  function getIconForType(nodeType: string): string {
    const icons: Record<string, string> = {
      conversation: 'pi pi-comments',
      routing: 'pi pi-sitemap',
      integration: 'pi pi-cloud',
      utility: 'pi pi-cog'
    }
    return icons[nodeType] || 'pi pi-circle'
  }

  /**
   * Get color for node type
   */
  function getColorForType(nodeType: string): string {
    const colors: Record<string, string> = {
      conversation: '#3b82f6',
      routing: '#8b5cf6',
      integration: '#10b981',
      utility: '#64748b'
    }
    return colors[nodeType] || '#64748b'
  }

  /**
   * Focus on a specific node
   */
  function focusOnNode(nodeId: string) {
    const vfNodes = getNodes.value
    const node = vfNodes.find((n) => n.id === nodeId)

    if (node) {
      // Center view on node with animation
      setCenter(node.position.x + 90, node.position.y + 30, {
        zoom: 1.2,
        duration: 400
      })

      // Select the node in store
      store.selectNode(nodeId)

      // Highlight the node temporarily
      highlightNode(nodeId)
    }

    // Close search
    closeSearch()
  }

  /**
   * Highlight a node temporarily
   */
  function highlightNode(nodeId: string) {
    highlightedNodeId.value = nodeId

    // Remove highlight after 2 seconds
    setTimeout(() => {
      if (highlightedNodeId.value === nodeId) {
        highlightedNodeId.value = null
      }
    }, 2000)
  }

  /**
   * Open search panel
   */
  function openSearch() {
    isSearchOpen.value = true
    query.value = ''
  }

  /**
   * Close search panel
   */
  function closeSearch() {
    isSearchOpen.value = false
    query.value = ''
  }

  /**
   * Toggle search panel
   */
  function toggleSearch() {
    if (isSearchOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }

  /**
   * Clear search query
   */
  function clearQuery() {
    query.value = ''
  }

  // Watch for escape key to close search
  watch(isSearchOpen, (open) => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeSearch()
        }
      }
      window.addEventListener('keydown', handleEscape)

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleEscape)
      }
    }
  })

  return {
    // State
    query,
    isSearchOpen,
    highlightedNodeId,

    // Computed
    results,
    allNodes,

    // Actions
    focusOnNode,
    highlightNode,
    openSearch,
    closeSearch,
    toggleSearch,
    clearQuery,

    // Utilities
    getIconForType,
    getColorForType
  }
}

export default useWorkflowNodeSearch
