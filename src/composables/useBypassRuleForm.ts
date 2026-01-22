import { ref, computed, watch } from 'vue'
import { useBypassRulesStore } from '@/stores/bypassRules.store'
import { useBypassRules } from '@/composables/useBypassRules'
import { useDomains } from '@/composables/useDomains'
import { agentCatalogApi } from '@/api/agentCatalog.api'
import { pharmacyApi, type Pharmacy } from '@/api/pharmacy.api'
import { medicalApi, type Institution } from '@/api/medical.api'
import type {
  BypassRuleCreateRequest,
  BypassRuleUpdateRequest,
  BypassRuleType
} from '@/types/bypassRules.types'

export function useBypassRuleForm() {
  const store = useBypassRulesStore()
  const { createRule, updateRule, isLoading, closeRuleDialog } = useBypassRules()
  const { fetchDomains, getDomainOptions, isLoading: loadingDomains } = useDomains()

  // Available agents
  const availableAgents = ref<string[]>([])
  const loadingAgents = ref(false)

  // Available pharmacies
  const availablePharmacies = ref<Pharmacy[]>([])
  const loadingPharmacies = ref(false)

  // Available institutions
  const availableInstitutions = ref<Institution[]>([])
  const loadingInstitutions = ref(false)

  // Form state
  const formData = ref({
    rule_name: '',
    description: '',
    rule_type: 'phone_number' as BypassRuleType,
    pattern: '',
    phone_numbers: [] as string[],
    phone_number_id: '',
    target_agent: '',
    target_domain: undefined as string | undefined,
    pharmacy_id: undefined as string | undefined,
    institution_id: undefined as string | undefined,
    priority: 100,
    enabled: true,
    isolated_history: false
  })

  // For phone number list input
  // newPhoneNumber moved to BypassRuleCondition component

  // Options
  const ruleTypeOptions = [
    { label: 'Patron de Telefono', value: 'phone_number' },
    { label: 'Lista de Telefonos', value: 'phone_number_list' },
    { label: 'WhatsApp Phone ID', value: 'whatsapp_phone_number_id' }
  ]

  // Domain options
  const domainOptions = computed(() => getDomainOptions(true))

  // Show pharmacy selector
  const showPharmacySelector = computed(() => formData.value.target_domain === 'pharmacy')

  // Show institution selector
  const showInstitutionSelector = computed(() => formData.value.target_domain === 'medical_appointments')

  const isEditing = computed(() => store.editingRule !== null)
  const dialogTitle = computed(() =>
    isEditing.value ? 'Editar Regla de Bypass' : 'Nueva Regla de Bypass'
  )

  const canSave = computed(() => {
    // Base validation
    if (!formData.value.rule_name.trim()) return false
    if (!formData.value.target_agent) return false

    // Pharmacy validation
    if (formData.value.target_domain === 'pharmacy' && !formData.value.pharmacy_id) {
      return false
    }

    // Institution validation
    if (formData.value.target_domain === 'medical_appointments' && !formData.value.institution_id) {
      return false
    }

    // Type-specific validation
    switch (formData.value.rule_type) {
      case 'phone_number':
        return !!formData.value.pattern?.trim()
      case 'phone_number_list':
        return formData.value.phone_numbers.length > 0
      case 'whatsapp_phone_number_id':
        return !!formData.value.phone_number_id?.trim()
      default:
        return false
    }
  })

  // Watch for editing rule changes
  watch(
    () => store.editingRule,
    (rule) => {
      if (rule) {
        formData.value = {
          rule_name: rule.rule_name,
          description: rule.description || '',
          rule_type: rule.rule_type,
          pattern: rule.pattern || '',
          phone_numbers: rule.phone_numbers ? [...rule.phone_numbers] : [],
          phone_number_id: rule.phone_number_id || '',
          target_agent: rule.target_agent,
          target_domain: rule.target_domain || undefined,
          pharmacy_id: rule.pharmacy_id || undefined,
          institution_id: rule.institution_id || undefined,
          priority: rule.priority,
          enabled: rule.enabled,
          isolated_history: rule.isolated_history ?? false
        }
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  // Clear pharmacy/institution IDs when domain changes
  watch(
    () => formData.value.target_domain,
    (newDomain) => {
      if (newDomain !== 'pharmacy') {
        formData.value.pharmacy_id = undefined
      }
      if (newDomain !== 'medical_appointments') {
        formData.value.institution_id = undefined
      }
    }
  )

  function resetForm() {
    formData.value = {
      rule_name: '',
      description: '',
      rule_type: 'phone_number',
      pattern: '',
      phone_numbers: [],
      phone_number_id: '',
      target_agent: '',
      target_domain: undefined,
      pharmacy_id: undefined,
      institution_id: undefined,
      priority: 100,
      enabled: true,
      isolated_history: false
    }
  }

  // addPhoneNumber and removePhoneNumber moved to BypassRuleCondition component

  async function fetchAgents() {
    loadingAgents.value = true
    try {
      availableAgents.value = await agentCatalogApi.getEnabledKeys()
    } catch (error) {
      console.error('Error fetching agents:', error)
      availableAgents.value = []
    } finally {
      loadingAgents.value = false
    }
  }

  async function fetchPharmacies() {
    loadingPharmacies.value = true
    try {
      availablePharmacies.value = await pharmacyApi.getPharmacies()
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
      availablePharmacies.value = []
    } finally {
      loadingPharmacies.value = false
    }
  }

  async function fetchInstitutions() {
    loadingInstitutions.value = true
    try {
      availableInstitutions.value = await medicalApi.getInstitutions()
    } catch (error) {
      console.error('Error fetching institutions:', error)
      availableInstitutions.value = []
    } finally {
      loadingInstitutions.value = false
    }
  }

  async function loadDependencies() {
    await Promise.all([
        fetchAgents(),
        fetchDomains(),
        fetchPharmacies(),
        fetchInstitutions()
    ])
  }

  async function handleSubmit() {
    if (!canSave.value) return

    const pharmacyId =
      formData.value.target_domain === 'pharmacy' ? formData.value.pharmacy_id : null

    const institutionId =
      formData.value.target_domain === 'medical_appointments' ? formData.value.institution_id : null

    const baseData = {
      rule_name: formData.value.rule_name,
      description: formData.value.description || undefined,
      rule_type: formData.value.rule_type,
      target_agent: formData.value.target_agent,
      target_domain: formData.value.target_domain,
      pharmacy_id: pharmacyId,
      institution_id: institutionId,
      priority: formData.value.priority,
      enabled: formData.value.enabled,
      isolated_history: formData.value.isolated_history
    }

    let typeFields = {}
    switch (formData.value.rule_type) {
      case 'phone_number':
        typeFields = { pattern: formData.value.pattern }
        break
      case 'phone_number_list':
        typeFields = { phone_numbers: formData.value.phone_numbers }
        break
      case 'whatsapp_phone_number_id':
        typeFields = { phone_number_id: formData.value.phone_number_id }
        break
    }

    if (isEditing.value && store.editingRule) {
      const updateData: BypassRuleUpdateRequest = { ...baseData, ...typeFields }
      await updateRule(store.editingRule.id, updateData)
    } else {
      const createData: BypassRuleCreateRequest = { ...baseData, ...typeFields }
      await createRule(createData)
    }
  }

  function handleClose() {
    resetForm()
    closeRuleDialog()
  }

  return {
    store,
    formData,
    availableAgents,
    loadingAgents,
    availablePharmacies,
    loadingPharmacies,
    availableInstitutions,
    loadingInstitutions,
    ruleTypeOptions,
    domainOptions,
    showPharmacySelector,
    showInstitutionSelector,
    isEditing,
    dialogTitle,
    canSave,
    isLoading,
    loadDependencies,
    handleSubmit,
    handleClose
  }
}
