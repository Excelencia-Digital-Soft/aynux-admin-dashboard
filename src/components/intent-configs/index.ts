/**
 * Intent Configs Components - LangGraph Topology Editor
 *
 * Main exports for the graph topology visualization system.
 */

// Main component
export { default as IntentConfigGraph } from './IntentConfigGraph.vue'

// Canvas component
export { default as IntentConfigGraphCanvas } from './IntentConfigGraphCanvas.vue'

// Detail drawer
export { default as IntentConfigDetailDrawer } from './IntentConfigDetailDrawer.vue'

// Node components
export { default as RouterNode } from './nodes/RouterNode.vue'
export { default as ActionNode } from './nodes/ActionNode.vue'
export { default as FormatterNode } from './nodes/FormatterNode.vue'
export { default as StartEndNode } from './nodes/StartEndNode.vue'

// Panel components
export { default as RouterPanel } from './panels/RouterPanel.vue'
export { default as ActionNodePanel } from './panels/ActionNodePanel.vue'
export { default as DetectionPatternsSection } from './panels/DetectionPatternsSection.vue'
export { default as IntentPatternBlock } from './panels/IntentPatternBlock.vue'

// Test panel (kept from legacy)
export { default as IntentTestPanel } from './IntentTestPanel.vue'

// Composables
export { useIntentConfigGraph } from './composables/useIntentConfigGraph'
export { useNodeDetectionPatterns } from './composables/useNodeDetectionPatterns'

// Layout utils
export { layoutTopology } from './utils/graphLayout'

// Types
export type {
  TopologyNodeType,
  TopologyNodeData,
  TopologyFlowNode,
  TopologyFlowEdge,
  SelectedNodeInfo,
  DomainConfig
} from './types'

export { DOMAIN_CONFIGS, getDomainConfig } from './types'
