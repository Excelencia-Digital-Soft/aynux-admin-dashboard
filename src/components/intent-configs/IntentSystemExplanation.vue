<template>
  <Dialog
    :visible="modelValue"
    @update:visible="$emit('update:modelValue', $event)"
    header="¿Cómo funciona el Sistema de Intents?"
    :modal="true"
    :style="{ width: '900px', maxWidth: '95vw' }"
    :breakpoints="{ '960px': '90vw', '640px': '100vw' }"
    class="help-dialog"
  >
    <div class="help-content">
      <!-- Section 1: Flow Diagram -->
      <section class="help-section">
        <h3><i class="pi pi-share-alt"></i> Flujo de un Mensaje</h3>
        <div class="flow-diagram">
          <div class="flow-step">
            <div class="flow-box input">
              <i class="pi pi-user"></i>
              <span class="flow-title">Usuario</span>
              <span class="flow-subtitle">envía mensaje</span>
            </div>
          </div>
          <i class="pi pi-arrow-down flow-arrow"></i>
          <div class="flow-step">
            <div class="flow-box process">
              <i class="pi pi-bolt"></i>
              <span class="flow-title">Intent Detection</span>
              <span class="flow-subtitle">LLM clasifica el mensaje</span>
              <Tag severity="primary" class="flow-tag">Tab: Intents</Tag>
            </div>
          </div>
          <i class="pi pi-arrow-down flow-arrow"></i>
          <div class="flow-step">
            <div class="flow-box process">
              <i class="pi pi-link"></i>
              <span class="flow-title">Intent Mapping</span>
              <span class="flow-subtitle">Mapea intent → agente</span>
              <Tag severity="success" class="flow-tag">Tab: Agent Mappings</Tag>
            </div>
          </div>
          <i class="pi pi-arrow-down flow-arrow"></i>
          <div class="flow-step">
            <div class="flow-box output">
              <i class="pi pi-android"></i>
              <span class="flow-title">Target Agent</span>
              <span class="flow-subtitle">Procesa y responde</span>
              <Tag severity="info" class="flow-tag">Tab: Respuestas</Tag>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Tabs Table -->
      <section class="help-section">
        <h3><i class="pi pi-list"></i> Los 7 Tabs Explicados</h3>
        <div class="tabs-table-container">
          <table class="tabs-table">
            <thead>
              <tr>
                <th>Tab</th>
                <th>Propósito</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tab in tabsInfo" :key="tab.index">
                <td>
                  <div class="tab-name">
                    <i :class="tab.icon"></i>
                    <span>{{ tab.name }}</span>
                  </div>
                </td>
                <td>{{ tab.purpose }}</td>
                <td>
                  <Tag :severity="tab.scope === 'dominio' ? 'info' : 'warning'">
                    {{ tab.scope === 'dominio' ? 'Por dominio' : 'Por organización' }}
                  </Tag>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Section 3: Practical Example -->
      <section class="help-section">
        <h3><i class="pi pi-lightbulb"></i> Ejemplo Práctico</h3>
        <div class="example-card">
          <div class="example-message">
            <i class="pi pi-user"></i>
            <span class="message-text">"Tengo un problema con mi factura"</span>
          </div>
          <div class="example-steps">
            <div v-for="step in exampleSteps" :key="step.number" class="example-step">
              <span class="step-number">{{ step.number }}</span>
              <div class="step-content">
                <strong>{{ step.title }}</strong>
                <span class="step-description">{{ step.description }}</span>
                <Tag v-if="step.tag" :severity="step.tagSeverity" class="step-tag">
                  {{ step.tag }}
                </Tag>
              </div>
            </div>
          </div>
          <div class="agent-response">
            <i class="pi pi-android"></i>
            <span>"¿Cuál es el número de factura?"</span>
          </div>
        </div>
      </section>

      <!-- Section 4: Key Difference -->
      <section class="help-section">
        <h3><i class="pi pi-info-circle"></i> Diferencia Clave</h3>
        <div class="difference-grid">
          <div class="difference-card domain">
            <div class="card-header">
              <i class="pi pi-globe"></i>
              <h4>Tabs 0-1 (Por Dominio)</h4>
            </div>
            <p>Configuran <strong>qué puede detectar</strong> el sistema y <strong>cómo responde</strong></p>
            <ul>
              <li><i class="pi pi-tags"></i> Intents de Detección</li>
              <li><i class="pi pi-comment"></i> Configuración de Respuestas</li>
            </ul>
          </div>
          <div class="difference-card org">
            <div class="card-header">
              <i class="pi pi-building"></i>
              <h4>Tabs 2-6 (Por Organización)</h4>
            </div>
            <p>Configuran <strong>hacia dónde se routea</strong> y el <strong>comportamiento del routing</strong></p>
            <ul>
              <li><i class="pi pi-link"></i> Agent Mappings</li>
              <li><i class="pi pi-sitemap"></i> Flow Agents</li>
              <li><i class="pi pi-tag"></i> Keywords</li>
              <li><i class="pi pi-share-alt"></i> Visualización</li>
              <li><i class="pi pi-play"></i> Testing</li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <Button label="Entendido" icon="pi pi-check" @click="$emit('update:modelValue', false)" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const tabsInfo = [
  {
    index: 0,
    name: 'Intents de Detección',
    icon: 'pi pi-tags',
    purpose: 'Define qué intents puede detectar el LLM para un dominio',
    scope: 'dominio'
  },
  {
    index: 1,
    name: 'Config de Respuestas',
    icon: 'pi pi-comment',
    purpose: 'Templates/prompts para cada intent',
    scope: 'dominio'
  },
  {
    index: 2,
    name: 'Agent Mappings',
    icon: 'pi pi-link',
    purpose: 'intent → agent (ej: "saludo" → greeting_agent)',
    scope: 'org'
  },
  {
    index: 3,
    name: 'Flow Agents',
    icon: 'pi pi-sitemap',
    purpose: 'Agentes con conversación multi-turn (mantienen contexto)',
    scope: 'org'
  },
  {
    index: 4,
    name: 'Keywords',
    icon: 'pi pi-tag',
    purpose: 'Fallback cuando el LLM falla (ej: "factura" → invoice_agent)',
    scope: 'org'
  },
  {
    index: 5,
    name: 'Visualización',
    icon: 'pi pi-share-alt',
    purpose: 'Diagrama visual del flujo de intents a agentes',
    scope: 'org'
  },
  {
    index: 6,
    name: 'Testing',
    icon: 'pi pi-play',
    purpose: 'Probar detección de intent con mensajes reales',
    scope: 'org'
  }
]

const exampleSteps = [
  {
    number: 1,
    title: 'LLM detecta intent:',
    description: '"excelencia_facturacion"',
    tag: 'conf: 0.92',
    tagSeverity: 'success' as const
  },
  {
    number: 2,
    title: 'Agent Mapping:',
    description: '"excelencia_facturacion" → "excelencia_invoice_agent"',
    tag: null,
    tagSeverity: null
  },
  {
    number: 3,
    title: 'Flow Agent?',
    description: 'Sí → mantiene contexto para preguntas de seguimiento',
    tag: 'FLOW',
    tagSeverity: 'warning' as const
  },
  {
    number: 4,
    title: 'Response Config:',
    description: 'usa template configurado para facturación',
    tag: null,
    tagSeverity: null
  },
  {
    number: 5,
    title: 'Agente responde:',
    description: 'Genera respuesta usando el template',
    tag: null,
    tagSeverity: null
  }
]
</script>

<style scoped>
.help-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.help-section {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1.25rem;
}

.help-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--primary-color);
}

/* Flow Diagram */
.flow-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.flow-step {
  width: 100%;
  max-width: 280px;
}

.flow-arrow {
  color: var(--text-color-secondary);
  font-size: 1.25rem;
}

.flow-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  gap: 0.25rem;
}

.flow-box i:first-child {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.flow-box.input {
  background: linear-gradient(135deg, var(--blue-100), var(--blue-50));
  border: 2px solid var(--blue-300);
}

.flow-box.process {
  background: linear-gradient(135deg, var(--green-100), var(--green-50));
  border: 2px solid var(--green-300);
}

.flow-box.output {
  background: linear-gradient(135deg, var(--purple-100), var(--purple-50));
  border: 2px solid var(--purple-300);
}

.flow-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.flow-subtitle {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.flow-tag {
  margin-top: 0.25rem;
  font-size: 0.7rem;
}

/* Tabs Table */
.tabs-table-container {
  overflow-x: auto;
}

.tabs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.tabs-table th,
.tabs-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--surface-border);
}

.tabs-table th {
  background: var(--surface-section);
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.tabs-table tbody tr:hover {
  background: var(--surface-hover);
}

.tab-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.tab-name i {
  color: var(--primary-color);
}

/* Example Card */
.example-card {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--surface-border);
}

.example-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--blue-50);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.example-message i {
  font-size: 1.25rem;
  color: var(--blue-500);
}

.message-text {
  font-style: italic;
  color: var(--text-color);
}

.example-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.example-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.step-content strong {
  color: var(--text-color);
}

.step-description {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.step-tag {
  font-size: 0.7rem;
}

.agent-response {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--green-50);
  border-radius: 8px;
  border-left: 4px solid var(--green-500);
}

.agent-response i {
  font-size: 1.25rem;
  color: var(--green-600);
}

.agent-response span {
  font-style: italic;
  color: var(--green-700);
}

/* Difference Grid */
.difference-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .difference-grid {
    grid-template-columns: 1fr;
  }
}

.difference-card {
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
}

.difference-card.domain {
  background: var(--blue-50);
  border-color: var(--blue-200);
}

.difference-card.org {
  background: var(--orange-50);
  border-color: var(--orange-200);
}

.difference-card .card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.difference-card .card-header i {
  font-size: 1.25rem;
}

.difference-card.domain .card-header i {
  color: var(--blue-500);
}

.difference-card.org .card-header i {
  color: var(--orange-500);
}

.difference-card h4 {
  margin: 0;
  font-size: 0.95rem;
}

.difference-card p {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.difference-card ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.difference-card li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.difference-card li i {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

/* Dark mode adjustments */
:global(.dark-mode) .flow-box.input {
  background: linear-gradient(135deg, var(--blue-900), var(--blue-800));
  border-color: var(--blue-600);
}

:global(.dark-mode) .flow-box.process {
  background: linear-gradient(135deg, var(--green-900), var(--green-800));
  border-color: var(--green-600);
}

:global(.dark-mode) .flow-box.output {
  background: linear-gradient(135deg, var(--purple-900), var(--purple-800));
  border-color: var(--purple-600);
}

:global(.dark-mode) .example-message {
  background: var(--blue-900);
}

:global(.dark-mode) .agent-response {
  background: var(--green-900);
}

:global(.dark-mode) .difference-card.domain {
  background: var(--blue-900);
  border-color: var(--blue-700);
}

:global(.dark-mode) .difference-card.org {
  background: var(--orange-900);
  border-color: var(--orange-700);
}
</style>
