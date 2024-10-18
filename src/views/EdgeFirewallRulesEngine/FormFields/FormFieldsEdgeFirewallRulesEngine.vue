<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldDropdownIcon from '@/templates/form-fields-inputs/fieldDropdownIcon.vue'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import PrimeMenu from 'primevue/menu'
  import { useFieldArray } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()

  defineOptions({
    name: 'edge-firewall-rules-engine-form-fields'
  })

  const props = defineProps({
    edgeFirewallFunctionsOptions: {
      type: Array,
      required: true
    },
    wafRulesOptions: {
      type: Array,
      required: true
    },
    enabledModules: {
      type: Object,
      required: true
    },
    listNetworkListService: {
      type: Function,
      required: true
    }
  })

  const YEAR_IN_SECONDS = 31536000
  const DEFAULT_CRITERIA_OPTION = {
    variable: '',
    operator: '',
    conditional: 'if',
    argument: ''
  }
  const SSL_VERIFICATION_STATUS_OPTIONS = [
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Certificate Verification Error', value: 'CERTIFICATE_VERIFICATION_ERROR' },
    { label: 'Missing Client Certificate', value: 'MISSING_CLIENT_CERTIFICATE' }
  ]

  const conditionalMenuRef = ref({})
  const criteriaMenuRef = ref({})
  const { push: pushCriteria, remove: removeCriteria, fields: criteria } = useFieldArray('criteria')

  const getOperatorsOptionsByCriteriaVariable = ({ criteriaIndex, criteriaInnerRowIndex }) => {
    const criteriaVariable = criteria.value[criteriaIndex].value[criteriaInnerRowIndex].variable

    switch (criteriaVariable) {
      case 'header_accept':
      case 'header_accept_encoding':
      case 'header_accept_language':
      case 'header_cookie':
      case 'header_origin':
      case 'header_referer':
      case 'header_user_agent':
        return [
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' }
        ]
      case 'network':
        return [
          { label: 'matches', value: 'is_in_list' },
          { label: 'does not match', value: 'is_not_in_list' }
        ]
      case 'request_method':
      case 'scheme':
      case 'ssl_verification_status':
      case 'client_certificate_validation':
        return [
          { label: 'is equal', value: 'is_equal' },
          { label: 'is not equal', value: 'is_not_equal' }
        ]
      case 'host':
        return [
          { label: 'is equal', value: 'is_equal' },
          { label: 'is not equal', value: 'is_not_equal' },
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' }
        ]
      case 'request_args':
        return [
          { label: 'is equal', value: 'is_equal' },
          { label: 'is not equal', value: 'is_not_equal' },
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' },
          { label: 'exists', value: 'exists' },
          { label: 'does not exist', value: 'does_not_exist' }
        ]
      case 'request_uri':
        return [
          { label: 'is equal', value: 'is_equal' },
          { label: 'is not equal', value: 'is_not_equal' },
          { label: 'starts with', value: 'starts_with' },
          { label: 'does not start with', value: 'does_not_starts_with' },
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' }
        ]
      default:
        break
    }
  }

  /**
   * Adds a new criteria with a default IF operator.
   */
  const addNewCriteria = () => {
    pushCriteria([DEFAULT_CRITERIA_OPTION])
  }

  /**
   * Adds a conditional AND/OR operator to the criteria at the specified index.
   * @param {number} index - The index of the criteria to add the operator to.
   * @param {("and"|"or")} operator - The operator to add to the criteria at the specified index.
   */
  const addConditional = ({ index, operator }) => {
    criteria.value[index].value.push({ ...DEFAULT_CRITERIA_OPTION, conditional: operator })
  }

  /**
   * Remove a specific conditional from the criteria array.
   * @param {number} criteriaIndex - The index of the criteria from which the conditional will be removed.
   * @param {number} conditionalIndex - The index of the conditional to be removed.
   */
  const removeCriteriaInnerRow = (criteriaIndex, conditionalIndex) => {
    criteria.value[criteriaIndex].value.splice(conditionalIndex, 1)
  }

  /**
   * @param {Object} positions
   * @param {number} positions.criteriaIndex - The index of the criteria from which the conditional will be removed.
   * @param {number} positions.conditionalIndex - The index of the conditional to be removed.
   * @returns {boolean}
   */
  const showArgumentBySelectedOperator = ({ criteriaIndex, criteriaInnerRowIndex }) => {
    const criteriaRow = criteria.value[criteriaIndex].value[criteriaInnerRowIndex]
    return (
      criteriaRow.operator !== 'exists' &&
      criteriaRow.operator !== 'does_not_exist' &&
      criteriaRow.variable !== 'ssl_verification_status' &&
      criteriaRow.variable !== 'network'
    )
  }
  const showSSLStatusDropdownField = ({ criteriaIndex, criteriaInnerRowIndex }) => {
    const criteriaVariable = criteria.value[criteriaIndex].value[criteriaInnerRowIndex].variable

    return criteriaVariable === 'ssl_verification_status'
  }
  const showNetworkListDropdownField = ({ criteriaIndex, criteriaInnerRowIndex }) => {
    const criteriaVariable = criteria.value[criteriaIndex].value[criteriaInnerRowIndex].variable
    const isCriteriaNetworkSelected = criteriaVariable === 'network'
    const hasNetworkOptionsToSelect = networkListOptions.value.length

    if (isCriteriaNetworkSelected && !hasNetworkOptionsToSelect) {
      setNetworkListOptions()
    }

    return isCriteriaNetworkSelected
  }

  const generateCriteriaVariableOptions = () => {
    const edgeFirewallModules = props.enabledModules
    const hasNetworkProtectionLayerModuleEnabled = edgeFirewallModules.networkProtectionLayer
    const hasWebApplicationFirewallModuleEnabled = edgeFirewallModules.webApplicationFirewall

    const criteriaVariableOptions = [
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled ? 'Header Accept' : 'Header Accept - requires WAF'
        }`,
        value: 'header_accept',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled
            ? 'Header Accept Encoding'
            : 'Header Accept Encoding - requires WAF'
        }`,
        value: 'header_accept_encoding',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled
            ? 'Header Accept Language'
            : 'Header Accept Language - requires WAF'
        }`,
        value: 'header_accept_language',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled ? 'Header Cookie' : 'Header Cookie - requires WAF'
        }`,
        value: 'header_cookie',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled ? 'Header Origin' : 'Header Origin - requires WAF'
        }`,
        value: 'header_origin',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled
            ? 'Header Referer'
            : 'Header Referer - requires WAF'
        }`,
        value: 'header_referer',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled
            ? 'Header User Agent'
            : 'Header User Agent - requires WAF'
        }`,
        value: 'header_user_agent',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      { label: 'Host', value: 'host', disabled: false },
      {
        label: `${
          hasNetworkProtectionLayerModuleEnabled
            ? 'Network'
            : 'Network - required Network Layer Protection'
        }`,
        value: 'network',
        disabled: !hasNetworkProtectionLayerModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled ? 'Request Args' : 'Request Args - required WAF'
        }`,
        value: 'request_args',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      {
        label: `${
          hasWebApplicationFirewallModuleEnabled
            ? 'Request Method'
            : 'Request Method - required WAF'
        }`,
        value: 'request_method',
        disabled: !hasWebApplicationFirewallModuleEnabled
      },
      { label: 'Request Uri', value: 'request_uri', disabled: false },
      { label: 'Scheme', value: 'scheme', disabled: false },
      { label: 'Ssl Verification Status', value: 'ssl_verification_status', disabled: false },
      {
        label: 'Client Certificate Validation',
        value: 'client_certificate_validation',
        disabled: false
      }
    ]

    return criteriaVariableOptions
  }

  /**
   * Checks if a criteria can be deleted.
   * @param {number} index - The index of the criteria.
   * @returns {boolean}
   */
  const isNotFirstCriteria = (index) => {
    return criteria.value.length > 1 && index < criteria.value.length - 1
  }

  /**
   * Checks if is the last criteria divider.
   * @param {number} criteriaIndex
   * @returns {boolean}
   */
  const isLastCriteriaSectionDivider = (criteriaIndex) => {
    return criteriaIndex !== criteria.value.length - 1
  }

  /**
   * Toggle the visibility of the conditional menu.
   * @param {Event} event - The event that triggered the function.
   * @param {number} index - The index of the criteria.
   * @param {number} conditionalIndex - The index of the conditional inside a criteria.
   */
  const toggleConditionalMenu = (event, index, conditionalIndex) => {
    conditionalMenuRef.value[`${index}${conditionalIndex}`].toggle(event)
  }

  /**
   * Toggle the visibility of the criteria menu.
   * @param {Event} event
   * @param {number} criteriaIndex
   */
  const toggleCriteriaMenu = ({ event, criteriaIndex }) => {
    criteriaMenuRef.value[criteriaIndex].toggle(event)
  }

  /**
   * @param {number} criteriaIndex
   * @param {number} [criteriaInnerRowIndex]
   * @returns {Array} options for the criteria menu available commands.
   */
  const criteriaMenuOptions = (criteriaIndex, criteriaInnerRowIndex = null) => {
    return [
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => {
          if (criteriaInnerRowIndex === null) {
            removeCriteria(criteriaIndex)
          } else {
            removeCriteriaInnerRow(criteriaIndex, criteriaInnerRowIndex)
          }
        }
      }
    ]
  }

  const maximumConditionalsByCriteriaReached = (criteriaIndex) => {
    const MAXIMUM_ALLOWED = 10
    return criteria.value[criteriaIndex].value.length >= MAXIMUM_ALLOWED
  }

  const maximumCriteriaReached = computed(() => {
    const MAXIMUM_ALLOWED = 5
    return criteria.value.length >= MAXIMUM_ALLOWED
  })

  // Behaviors - extract to another form fields
  const {
    push: pushBehavior,
    remove: removeBehavior,
    fields: behaviors
  } = useFieldArray('behaviors')
  const behaviorsMenuRef = ref({})

  const behaviorsOptions = computed(() => {
    const edgeFirewallModules = props.enabledModules
    const hasEdgeFunctionsModuleEnabled = edgeFirewallModules.edgeFunctions
    const hasWebApplicationFirewallModuleEnabled = edgeFirewallModules.webApplicationFirewall
    const currentBehaviors = behaviors.value.map((item) => item.value.name)
    const wafBehaviorIsAlreadySelected = currentBehaviors.includes('set_waf_ruleset_and_waf_mode')
    const runFunctionBehaviorIsAlreadySelected = currentBehaviors.includes('run_function')

    return [
      { value: 'deny', label: 'Deny (403 Forbidden)', disabled: false },
      { value: 'drop', label: 'Drop (Close Without Response)', disabled: false },
      { value: 'set_rate_limit', label: 'Set Rate Limit', disabled: false },
      {
        value: 'set_waf_ruleset_and_waf_mode',
        label: `${
          hasWebApplicationFirewallModuleEnabled
            ? 'Set WAF Rule Set'
            : 'Set WAF Rule Set - requires WAF'
        }`,
        disabled: wafBehaviorIsAlreadySelected || !hasWebApplicationFirewallModuleEnabled
      },
      {
        value: 'run_function',
        label: `${
          hasEdgeFunctionsModuleEnabled ? 'Run Function' : 'Run Function - required Edge Functions '
        }`,
        disabled: runFunctionBehaviorIsAlreadySelected || !hasEdgeFunctionsModuleEnabled
      },
      { value: 'set_custom_response', label: 'Set Custom Response', disabled: false }
    ]
  })

  const toggleBehaviorMenu = (event, behaviorItemIndex) => {
    behaviorsMenuRef.value[behaviorItemIndex].toggle(event)
  }

  const behaviorMenuOptions = (behaviorItemIndex) => {
    return [
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => {
          removeBehavior(behaviorItemIndex)
        }
      }
    ]
  }

  const generateBehaviorLabelSection = (behaviorItem) => {
    return behaviorItem.isFirst ? 'Then' : 'And'
  }

  const handleAddBehavior = () => {
    const EMPTY_DEFAULT_BEHAVIOR = { name: '' }
    pushBehavior(EMPTY_DEFAULT_BEHAVIOR)
  }

  const removeBehaviorsFromIndex = (startIndex) => {
    const endIndex = behaviors.value.length - 1
    for (let index = endIndex; index > startIndex; index--) {
      removeBehavior(index)
    }
  }

  const updateAndGenerateAvailableBehaviorsOptions = ({ selectedBehavior, behaviorItemIndex }) => {
    switch (selectedBehavior) {
      case 'deny':
      case 'drop':
      case 'set_rate_limit':
      case 'set_custom_response':
        removeBehaviorsFromIndex(behaviorItemIndex)
        break
      default:
        break
    }
  }

  const isRunFunctionBehavior = (behaviorItemIndex) => {
    return behaviors.value[behaviorItemIndex].value.name === 'run_function'
  }

  const isWafBehavior = (behaviorItemIndex) => {
    return behaviors.value[behaviorItemIndex].value.name === 'set_waf_ruleset_and_waf_mode'
  }
  const isRateLimitBehavior = (behaviorItemIndex) => {
    return behaviors.value[behaviorItemIndex].value.name === 'set_rate_limit'
  }
  const isCustomResponseBehavior = (behaviorItemIndex) => {
    return behaviors.value[behaviorItemIndex].value.name === 'set_custom_response'
  }

  const isRateLimitBySeconds = (behaviorItemIndex) => {
    return behaviors.value[behaviorItemIndex].value.type === 'second'
  }

  const disableAddBehaviorButtonComputed = computed(() => {
    const behaviorHasNotBeenLoaded = !behaviors || !behaviors.value
    if (behaviorHasNotBeenLoaded) {
      return true
    }
    if (behaviors.value.length === 0) {
      return true
    }

    const lastBehavior = behaviors.value[behaviors.value.length - 1]
    if (!lastBehavior.value.name) {
      return true
    }
    const optionsThatEnableAddBehaviors = ['run_function', 'set_waf_ruleset_and_waf_mode']

    return !optionsThatEnableAddBehaviors.includes(lastBehavior.value.name)
  })

  const networkListOptions = ref([])
  const loadingNetworkList = ref(false)
  const setNetworkListOptions = async () => {
    try {
      loadingNetworkList.value = true
      const result = await props.listNetworkListService()
      networkListOptions.value = result
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loadingNetworkList.value = false
    }
  }

  const clearCriteriaArgument = ({
    selectedCriteriaVariable,
    criteriaIndex,
    criteriaInnerRowIndex
  }) => {
    criteria.value[criteriaIndex].value[criteriaInnerRowIndex].variable = selectedCriteriaVariable
    criteria.value[criteriaIndex].value[criteriaInnerRowIndex].argument = ''
  }
</script>
<template>
  <FormHorizontal
    title="General"
    description="Create a rule to handle the conditional execution of behaviors through logical operators."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          data-testid="edge-firewall-rule-form__name"
          :value="name"
          placeholder="My rule"
          description="Give a unique and descriptive name to identify the rule."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Description"
          name="description"
          data-testid="edge-firewall-rule-form__description"
          :value="description"
          description="Add a short description or comment to the rule."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Criteria"
    description="Set the conditions to execute the rule. Add a variable, the comparison operator and, if prompted, an argument."
  >
    <template #inputs>
      <div
        class="flex flex-col"
        v-for="(criteriaItem, criteriaIndex) in criteria"
        :key="criteriaIndex"
      >
        <div
          v-for="(criteriaRow, criteriaInnerRowIndex) in criteriaItem.value"
          :key="criteriaInnerRowIndex"
        >
          <div class="flex items-center gap-2">
            <Divider
              align="left"
              type="dashed"
              class="capitalize"
            >
              {{ criteriaRow.conditional }}
            </Divider>

            <PrimeButton
              v-if="criteriaInnerRowIndex !== 0"
              icon="pi pi-ellipsis-h"
              size="small"
              outlined
              @click="(event) => toggleConditionalMenu(event, criteriaIndex, criteriaInnerRowIndex)"
            />
            <PrimeMenu
              :ref="(el) => (conditionalMenuRef[`${criteriaIndex}${criteriaInnerRowIndex}`] = el)"
              id="drawer_overlay_menu"
              :model="criteriaMenuOptions(criteriaIndex, criteriaInnerRowIndex)"
              :popup="true"
            />
          </div>

          <div class="flex items-top gap-x-2 items-top mt-2 mb-4 flex-col sm:flex-row">
            <div class="flex flex-col h-fit sm:max-w-lg w-full gap-2">
              <FieldDropdownIcon
                :data-testid="`edge-firewall-rules-form__variable[${criteriaInnerRowIndex}]`"
                :value="criteria[criteriaIndex].value[criteriaInnerRowIndex].variable"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].variable`"
                :options="generateCriteriaVariableOptions()"
                @onChange="
                  (selectedCriteriaVariable) =>
                    clearCriteriaArgument({
                      selectedCriteriaVariable,
                      criteriaIndex,
                      criteriaInnerRowIndex
                    })
                "
                optionLabel="label"
                optionValue="value"
                optionDisabled="disabled"
                class="w-full"
                icon="pi pi-dollar"
              />
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldDropdown
                :options="
                  getOperatorsOptionsByCriteriaVariable({
                    criteriaIndex,
                    criteriaInnerRowIndex
                  })
                "
                optionLabel="label"
                optionValue="value"
                class="w-full"
                :data-testid="`edge-firewall-rules-form__operator[${criteriaInnerRowIndex}]`"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].operator`"
                :value="criteria[criteriaIndex].value[criteriaInnerRowIndex].operator"
                :disabled="!criteria[criteriaIndex].value[criteriaInnerRowIndex].variable"
              />
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                v-if="showArgumentBySelectedOperator({ criteriaIndex, criteriaInnerRowIndex })"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].argument`"
                :value="criteria[criteriaIndex].value[criteriaInnerRowIndex].argument"
                inputClass="w-full"
                :disabled="!criteria[criteriaIndex].value[criteriaInnerRowIndex].operator"
                :data-testid="`edge-firewall-rules-form__argument[${criteriaIndex}][${criteriaInnerRowIndex}]`"
              />
              <FieldDropdown
                v-if="showSSLStatusDropdownField({ criteriaIndex, criteriaInnerRowIndex })"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].argument`"
                :options="SSL_VERIFICATION_STATUS_OPTIONS"
                placeholder="Select an SSL Status"
                optionLabel="label"
                optionValue="value"
                v-bind:value="criteria[criteriaIndex].value[criteriaInnerRowIndex].argument"
                class="w-full"
                :disabled="!criteria[criteriaIndex].value[criteriaInnerRowIndex].operator"
              />
              <FieldDropdown
                v-if="showNetworkListDropdownField({ criteriaIndex, criteriaInnerRowIndex })"
                :data-testid="`edge-firewall-rules-form__network-list[${criteriaInnerRowIndex}]`"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].argument`"
                :options="networkListOptions"
                :loading="loadingNetworkList"
                placeholder="Select a Network"
                optionLabel="name"
                optionValue="stringId"
                v-bind:value="criteria[criteriaIndex].value[criteriaInnerRowIndex].argument"
                inputClass="w-full"
                :filter="true"
                :disabled="!criteria[criteriaIndex].value[criteriaInnerRowIndex].operator"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 mb-8">
          <PrimeButton
            icon="pi pi-plus-circle"
            label="And"
            size="small"
            outlined
            :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
            @click="addConditional({ index: criteriaIndex, operator: 'and' })"
          />
          <PrimeButton
            icon="pi pi-plus-circle"
            label="Or"
            size="small"
            outlined
            :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
            @click="addConditional({ index: criteriaIndex, operator: 'or' })"
          />
        </div>

        <div class="flex items-center gap-2">
          <Divider
            v-if="isLastCriteriaSectionDivider(criteriaIndex)"
            align="left"
            type="solid"
            class="capitalize"
          >
            And
          </Divider>
          <Divider
            v-else
            align="left"
            type="solid"
          />

          <PrimeButton
            v-if="isNotFirstCriteria(criteriaIndex)"
            icon="pi pi-ellipsis-h"
            size="small"
            outlined
            @click="(event) => toggleCriteriaMenu({ event, criteriaIndex: criteriaIndex + 1 })"
          />
          <PrimeMenu
            :ref="(el) => (criteriaMenuRef[criteriaIndex + 1] = el)"
            id="drawer_overlay_menu"
            :model="criteriaMenuOptions(criteriaIndex + 1)"
            :popup="true"
          />
        </div>
      </div>

      <div>
        <PrimeButton
          :disabled="maximumCriteriaReached"
          icon="pi pi-plus-circle"
          label="Add Criteria"
          size="small"
          outlined
          @click="addNewCriteria"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Behaviors"
    description="Set the behaviors the rule should perform if the conditions defined in the criteria are met. Select a behavior and fill in all required information. Some behaviors can't be added together or in some conditions."
    :isDrawer="true"
  >
    <template #inputs>
      <div
        class="flex flex-col gap-2"
        v-for="(behaviorItem, behaviorItemIndex) in behaviors"
        :key="behaviorItem.key"
      >
        <div class="flex items-center gap-2">
          <Divider
            align="left"
            type="dashed"
          >
            {{ generateBehaviorLabelSection(behaviorItem) }}
          </Divider>

          <PrimeButton
            v-if="behaviorItemIndex !== 0"
            icon="pi pi-ellipsis-h"
            size="small"
            outlined
            @click="(event) => toggleBehaviorMenu(event, behaviorItemIndex)"
          />

          <PrimeMenu
            :ref="(el) => (behaviorsMenuRef[behaviorItemIndex] = el)"
            id="drawer_behavior_overlay_menu"
            :model="behaviorMenuOptions(behaviorItemIndex)"
            :popup="true"
          />
        </div>

        <div class="flex gap-3 mt-6 mb-8 max-sm:flex-wrap">
          <div class="w-1/2 max-sm:w-full">
            <FieldDropdown
              :data-testid="`edge-firewall-rules-form__behaviors[${behaviorItemIndex}]-dropdown`"
              :enableWorkaroundLabelToDisabledOptions="true"
              :key="`${behaviorItem.key}-name`"
              :name="`behaviors[${behaviorItemIndex}].name`"
              :options="behaviorsOptions"
              placeholder="Select a behavior"
              optionLabel="label"
              optionValue="value"
              optionDisabled="disabled"
              v-bind:value="behaviors[behaviorItemIndex].value.name"
              @onChange="
                (selectedBehavior) =>
                  updateAndGenerateAvailableBehaviorsOptions({
                    selectedBehavior,
                    behaviorItemIndex
                  })
              "
            />
          </div>
          <div class="w-1/2 max-sm:w-full">
            <template v-if="isRunFunctionBehavior(behaviorItemIndex)">
              <FieldDropdown
                :data-testid="`edge-firewall-rule-form__behaviors[${behaviorItemIndex}]-function`"
                :key="`${behaviorItem.key}-run-function`"
                :name="`behaviors[${behaviorItemIndex}].functionId`"
                :options="props.edgeFirewallFunctionsOptions"
                placeholder="Select an function"
                optionLabel="name"
                optionValue="id"
                v-bind:value="behaviors[behaviorItemIndex].value.functionId"
                class="w-full mb-3"
              />
            </template>

            <template v-if="isWafBehavior(behaviorItemIndex)">
              <FieldDropdown
                :data-testid="`edge-firewall-rule-form__behaviors[${behaviorItemIndex}]__waf`"
                :key="`${behaviorItem.key}-waf_id`"
                :name="`behaviors[${behaviorItemIndex}].waf_id`"
                :options="wafRulesOptions"
                :filter="true"
                placeholder="Select a waf rule"
                optionLabel="name"
                optionValue="id"
                v-bind:value="behaviors[behaviorItemIndex].value.waf_id"
                class="w-full mb-3"
              />
              <FieldDropdown
                :data-testid="`edge-firewall-rule-form__behaviors[${behaviorItemIndex}]__waf-mode`"
                :key="`${behaviorItem.key}-mode`"
                :name="`behaviors[${behaviorItemIndex}].mode`"
                :options="[
                  {
                    label: 'Learning',
                    value: 'learning'
                  },
                  {
                    label: 'Blocking',
                    value: 'blocking'
                  }
                ]"
                placeholder="Select a waf mode"
                optionLabel="label"
                optionValue="value"
                v-bind:value="behaviors[behaviorItemIndex].value.mode"
                class="w-full"
              />
            </template>

            <template v-if="isRateLimitBehavior(behaviorItemIndex)">
              <FieldDropdown
                :key="`${behaviorItem.key}-type`"
                placeholder="Select rate limit type"
                :name="`behaviors[${behaviorItemIndex}].type`"
                :options="[
                  { label: 'Req/s', value: 'second' },
                  { label: 'Req/min', value: 'minute' }
                ]"
                optionLabel="label"
                optionValue="value"
                optionDisabled="disabled"
                v-bind:value="behaviors[behaviorItemIndex].value.type"
                class="w-full mb-3"
              />

              <FieldNumber
                id="`behaviors[${behaviorItemIndex}].average_rate_limit`"
                :key="`${behaviorItem.key}-averageRateLimit`"
                placeholder="Average Rate limit"
                inputClass="w-full mb-3"
                :value="behaviors[behaviorItemIndex].value.average_rate_limit"
                :name="`behaviors[${behaviorItemIndex}].average_rate_limit`"
                :min="0"
                :max="YEAR_IN_SECONDS"
                :step="1"
              />

              <FieldDropdown
                :key="`${behaviorItem.key}-limitBy`"
                placeholder="Select limit by"
                :name="`behaviors[${behaviorItemIndex}].limit_by`"
                :options="[
                  { label: 'Client IP address', value: 'client_ip' },
                  { label: 'Global', value: 'global' }
                ]"
                optionLabel="label"
                optionValue="value"
                optionDisabled="disabled"
                v-bind:value="behaviors[behaviorItemIndex].value.limit_by"
                class="w-full mb-3"
              />

              <template v-if="isRateLimitBySeconds(behaviorItemIndex)">
                <FieldNumber
                  id="`behaviors[${behaviorItemIndex}].maximum_burst_size`"
                  :key="`${behaviorItem.key}-maximumBurstSize`"
                  placeholder="Maximum Burst Size"
                  inputClass="w-full mb-3"
                  :value="behaviors[behaviorItemIndex].value.maximum_burst_size"
                  :name="`behaviors[${behaviorItemIndex}].maximum_burst_size`"
                  :min="0"
                  :step="1"
                />
              </template>
            </template>

            <template v-if="isCustomResponseBehavior(behaviorItemIndex)">
              <FieldNumber
                id="`behaviors[${behaviorItemIndex}].status_code`"
                :key="`${behaviorItem.key}-status_code`"
                placeholder="Status code"
                inputClass="w-full mb-3"
                :value="behaviors[behaviorItemIndex].value.status_code"
                :name="`behaviors[${behaviorItemIndex}].status_code`"
                :min="200"
                :max="499"
              />

              <FieldText
                id="`behaviors[${behaviorItemIndex}].content_type`"
                :key="`${behaviorItem.key}-content_type`"
                placeholder="Content Type"
                class="w-full mb-3"
                :value="behaviors[behaviorItemIndex].value.content_type"
                :name="`behaviors[${behaviorItemIndex}].content_type`"
              />
              <FieldText
                id="`behaviors[${behaviorItemIndex}].content_body`"
                :key="`${behaviorItem.key}-content_body`"
                placeholder="Content Body"
                class="w-full mb-3"
                :value="behaviors[behaviorItemIndex].value.content_body"
                :name="`behaviors[${behaviorItemIndex}].content_body`"
              />
            </template>
          </div>
        </div>
      </div>
      <Divider type="solid" />
      <div>
        <PrimeButton
          :disabled="disableAddBehaviorButtonComputed"
          icon="pi pi-plus-circle"
          label="Add Behavior"
          size="small"
          outlined
          @click="handleAddBehavior"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Status"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex w-full gap-3 items-start">
        <FieldSwitchBlock
          nameField="active"
          name="active"
          auto
          :isCard="false"
          title="Active"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
