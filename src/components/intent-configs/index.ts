/**
 * Intent Configs Components - Graph-based intent configuration editor
 *
 * Main exports for the intent configuration system.
 */

// Main component
export { default as IntentConfigGraph } from './IntentConfigGraph.vue'

// Canvas component
export { default as IntentConfigGraphCanvas } from './IntentConfigGraphCanvas.vue'

// Detail drawer
export { default as IntentConfigDetailDrawer } from './IntentConfigDetailDrawer.vue'

// Node components
export { default as DomainNode } from './nodes/DomainNode.vue'
export { default as IntentNode } from './nodes/IntentNode.vue'
export { default as AgentNode } from './nodes/AgentNode.vue'
export { default as KeywordGroupNode } from './nodes/KeywordGroupNode.vue'

// Panel components
export { default as DomainPanel } from './panels/DomainPanel.vue'
export { default as IntentPanel } from './panels/IntentPanel.vue'
export { default as AgentPanel } from './panels/AgentPanel.vue'
export { default as KeywordPanel } from './panels/KeywordPanel.vue'

// Test panel (kept from legacy)
export { default as IntentTestPanel } from './IntentTestPanel.vue'

// Composables
export { useIntentConfigGraph } from './composables/useIntentConfigGraph'

// Utils
export { generateGraph, getConnectedPath, formatAgentName } from './utils/graphLayout'

// Types
export type {
  GraphNodeType,
  DomainNodeData,
  IntentNodeData,
  AgentNodeData,
  KeywordGroupNodeData,
  GraphNodeData,
  IntentConfigGraphNode,
  IntentConfigGraphEdge,
  SelectedNodeInfo,
  GraphFilters,
  IntentConfigGraphState,
  DomainConfig,
  StatusConfig
} from './types'

export {
  DOMAIN_CONFIGS,
  LAYOUT_CONFIG,
  STATUS_CONFIGS,
  getDomainConfig,
  getStatusConfig
} from './types'
