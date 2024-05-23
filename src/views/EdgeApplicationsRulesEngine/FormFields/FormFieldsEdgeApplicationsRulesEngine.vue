<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField, useFieldArray } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'
  import InlineMessage from 'primevue/inlinemessage'
  import Divider from 'primevue/divider'
  import AutoComplete from 'primevue/autocomplete'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  import { computed, ref, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    isEnableApplicationAccelerator: {
      type: Boolean,
      required: true
    },
    isDeliveryProtocolHttps: {
      type: Boolean,
      required: true
    },
    isImageOptimization: {
      required: true,
      type: Boolean
    },
    listEdgeApplicationFunctionsService: {
      type: Function,
      required: true
    },
    listCacheSettingsService: {
      required: true,
      type: Function
    },
    listOriginsService: {
      required: true,
      type: Function
    },
    edgeApplicationId: {
      type: String,
      required: true
    },
    initialPhase: {
      type: String
    },
    selectedRulesEngineToEdit: {
      type: Object,
      required: false,
      default: () => {}
    },
    hideApplicationAcceleratorInDescription: {
      type: Boolean
    },
    isEdgeFunctionEnabled: {
      type: Boolean
    }
  })

  const isEditDrawer = computed(() => !!props.selectedRulesEngineToEdit)

  const checkPhaseIsDefaultValue = computed(() => phase.value === 'default')

  const toast = useToast()
  const criteriaOperatorOptions = ref([
    { label: 'is equal', value: 'is_equal' },
    { label: 'is not equal', value: 'is_not_equal' },
    { label: 'starts with', value: 'starts_with' },
    { label: 'does not start with', value: 'does_not_start_with' },
    { label: 'matches', value: 'matches' },
    { label: 'does not match', value: 'does_not_match' },
    { label: 'exists', value: 'exists' },
    { label: 'does not exist', value: 'does_not_exist' }
  ])

  const showLabelApplicationAccelerator = computed(() => {
    if (props.hideApplicationAcceleratorInDescription) return ''

    return ' - Requires Application Accelerator'
  })

  const showLabelHttps = computed(() => {
    if (props.isDeliveryProtocolHttps) {
      return ''
    }

    return '- Requires Delivery Protocol with HTTPS'
  })

  const showLabelImageOptimization = computed(() => {
    if (props.isImageOptimization) return ''
    return ' - Requires Image Processor'
  })

  const showLabelEdgeFunction = computed(() => {
    return props.isEdgeFunctionEnabled ? '' : '- Requires Edge Functions'
  })

  const behaviorsRequestOptions = ref([
    {
      label: `Add Request Cookie ${showLabelApplicationAccelerator.value}`,
      value: 'add_request_cookie',
      requires: true
    },
    { label: 'Add Request Header', value: 'add_request_header', requires: false },
    {
      label: `Bypass Cache ${showLabelApplicationAccelerator.value}`,
      value: 'bypass_cache_phase',
      requires: true
    },
    {
      label: `Capture Match Groups ${showLabelApplicationAccelerator.value}`,
      value: 'capture_match_groups',
      requires: true
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Deny (403 Forbidden)', value: 'deny', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: `Filter Request Cookie ${showLabelApplicationAccelerator.value}`,
      value: 'filter_request_cookie',
      requires: true
    },
    { label: 'Filter Request Header', value: 'filter_request_header', requires: false },
    {
      label: `Forward Cookies ${showLabelApplicationAccelerator.value}`,
      value: 'forward_cookies',
      requires: true
    },
    { label: 'No Content (204)', value: 'no_content', requires: false },
    {
      label: `Optimize Images ${showLabelImageOptimization.value}`,
      value: 'optimize_images',
      requires: true
    },
    {
      label: `Redirect HTTP to HTTPS ${showLabelHttps.value}`,
      value: 'redirect_http_to_https',
      requires: true
    },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    {
      label: `Rewrite Request ${showLabelApplicationAccelerator.value}`,
      value: 'rewrite_request',
      requires: true
    },
    { label: `Run Function ${showLabelEdgeFunction.value}`, value: 'run_function', requires: true },
    { label: 'Set Cache Policy', value: 'set_cache_policy', requires: false },
    { label: 'Set Origin', value: 'set_origin', requires: false }
  ])

  const behaviorsResponseOptions = ref([
    {
      label: `Add Response Cookie ${showLabelApplicationAccelerator.value}`,
      value: 'add_response_cookie',
      requires: true
    },
    { label: 'Add Response Header', value: 'add_response_header', requires: false },
    {
      label: `Capture Match Groups ${showLabelApplicationAccelerator.value}`,
      value: 'capture_match_groups',
      requires: true
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: `Filter Response Cookie ${showLabelApplicationAccelerator.value}`,
      value: 'filter_response_cookie',
      requires: true
    },
    { label: 'Filter Response Header', value: 'filter_response_header', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    { label: `Run Function ${showLabelEdgeFunction.value}`, value: 'run_function', requires: true }
  ])

  const behaviorsDefaultOptions = ref([
    { label: 'Deny (403 Forbidden)', value: 'deny', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    { label: 'Set Origin', value: 'set_origin', requires: false },
    { label: 'Run Function', value: 'run_function', requires: false },
    { label: 'No Content (204)', value: 'no_content', requires: false }
  ])

  const { value: name } = useField('name')
  const { push: pushCriteria, remove: removeCriteria, fields: criteria } = useFieldArray('criteria')
  const {
    push: pushBehavior,
    remove: removeBehavior,
    update: updateBehavior,
    fields: behaviors
  } = useFieldArray('behaviors')
  const { value: phase } = useField('phase')
  const { value: description } = useField('description')
  useField('isActive')

  const DEFAULT_OPERATOR = {
    variable: '${uri}',
    operator: 'is_equal',
    conditional: 'if',
    input_value: ''
  }

  const DEFAULT_BEHAVIOR = {
    name: `deliver`,
    target: {}
  }

  const conditionalMenuRef = ref({})
  const criteriaMenuRef = ref({})

  /**
   * Remove a specific conditional from the criteria array.
   * @param {number} criteriaIndex - The index of the criteria from which the conditional will be removed.
   * @param {number} conditionalIndex - The index of the conditional to be removed.
   */
  const removeConditional = (criteriaIndex, conditionalIndex) => {
    criteria.value[criteriaIndex].value.splice(conditionalIndex, 1)
  }

  /**
   * Toggle the visibility of the conditional menu.
   * @param {Event} event - The event that triggered the function.
   * @param {number} index - The index of the criteria.
   * @param {number} conditionalIndex - The index of the conditional.
   */
  const toggleConditionalMenu = (event, index, conditionalIndex) => {
    conditionalMenuRef.value[`${index}${conditionalIndex}`].toggle(event)
  }

  /**
   * Toggle the visibility of the criteria menu.
   * @param {Event} event - The event that triggered the function.
   * @param {number} index - The index of the criteria.
   */
  const toggleCriteriaMenu = (event, index) => {
    criteriaMenuRef.value[index].toggle(event)
  }

  /**
   * Generate the options for the criteria menu.
   * @param {number} criteriaIndex - The index of the criteria.
   * @param {number} [conditionalIndex] - The index of the conditional.
   * @returns {Array} An array of options for the criteria menu.
   */
  const criteriaMenuOptions = (criteriaIndex, conditionalIndex = null) => {
    return [
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => {
          if (conditionalIndex === null) {
            removeCriteria(criteriaIndex)
          } else {
            removeConditional(criteriaIndex, conditionalIndex)
          }
        }
      }
    ]
  }

  const behaviorsMenuRef = ref({})

  /**
   * Toggle the visibility of the behavior menu.
   * @param {Event} event - The event that triggered the function.
   * @param {number} index - The index of the behavior.
   */
  const toggleBehaviorMenu = (event, index) => {
    behaviorsMenuRef.value[index].toggle(event)
  }

  /**
   * Generate the options for the behavior menu.
   * @param {number} index - The index of the behavior.
   * @returns {Array} An array of options for the behavior menu.
   */
  const behaviorMenuOptions = (index) => {
    return [
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => {
          removeBehavior(index)
        }
      }
    ]
  }

  /**
   * Adds a conditional AND/OR operator to the criteria at the specified index.
   * @param {number} index - The index of the criteria to add the operator to.
   * @param {("and"|"or")} operator - The operator to add to the criteria at the specified index.
   */
  const addNewConditional = ({ index, operator }) => {
    criteria.value[index].value.push({ ...DEFAULT_OPERATOR, conditional: operator })
  }

  /**
   * Adds a new criteria with a default IF operator.
   */
  const addNewCriteria = () => {
    pushCriteria([DEFAULT_OPERATOR])
  }

  /**
   * Sets the default behavior options for the last behavior in the behaviors array.
   */
  const setDefaultBehaviorOptions = () => {
    const lastIndex = behaviors.value.length - 1
    changeBehaviorType(DEFAULT_BEHAVIOR.name, lastIndex)
  }

  /**
   * Adds a new behavior with the default behavior to the behaviors array and sets its options.
   */
  const addNewBehavior = () => {
    pushBehavior({ ...DEFAULT_BEHAVIOR })
    setDefaultBehaviorOptions()
  }

  const behaviorsOptionsMap = {
    request: () => behaviorsRequestOptions.value,
    default: () => {
      if (behaviors.value.length === 1) {
        return behaviorsDefaultOptions.value
      }
      return behaviorsRequestOptions.value
    },
    response: () => behaviorsResponseOptions.value
  }

  const behaviorsOptions = computed(() => behaviorsOptionsMap[phase.value]() || [])

  /**
   * Updates the 'requires' property of behavior options based on component props.
   * This function checks if the behavior option is 'redirect_http_to_https' and sets the 'requires'
   * property based on the 'isDeliveryProtocolHttps' prop. For other options that have 'requires' as true,
   * it sets the 'requires' property based on the 'isEnableApplicationAccelerator' prop.
   * @param {Array} options - The behavior options to update.
   * @returns {Array} The updated array of behavior options with the 'requires' property set accordingly.
   */
  const updateOptionRequires = (options) => {
    const conditionsMap = {
      redirect_http_to_https: !props.isDeliveryProtocolHttps,
      optimize_images: !props.isImageOptimization,
      run_function: !props.isEdgeFunctionEnabled
    }

    return options.map((option) => {
      if (option.requires) {
        const requires = conditionsMap[option.value] ?? !props.isEnableApplicationAccelerator

        return { ...option, requires }
      }
      return option
    })
  }

  /**
   * Updates the 'requires' property of all behavior options that have 'requires' as true by default,
   * based on the component props.
   * It applies the 'updateOptionRequires' function to both request and response behavior options.
   */
  const updateBehaviorsOptionsRequires = () => {
    behaviorsRequestOptions.value = updateOptionRequires(behaviorsRequestOptions.value)
    behaviorsResponseOptions.value = updateOptionRequires(behaviorsResponseOptions.value)
  }
  const functionsInstanceOptions = ref(null)
  const loadingFunctionsInstance = ref(false)

  /**
   * Fetches the list of function instance options and updates the 'functionsInstanceOptions' ref.
   */
  const listFunctionsInstanceOptions = async () => {
    try {
      loadingFunctionsInstance.value = true
      functionsInstanceOptions.value = await props.listEdgeApplicationFunctionsService(
        props.edgeApplicationId
      )
    } finally {
      loadingFunctionsInstance.value = false
    }
  }

  const originsOptions = ref(null)
  const loadingOrigins = ref(false)

  /**
   * Fetches the list of origin options and updates the 'originsOptions' ref.
   */
  const listOriginsOptions = async () => {
    try {
      loadingOrigins.value = true
      originsOptions.value = await props.listOriginsService({ id: props.edgeApplicationId })
    } finally {
      loadingOrigins.value = false
    }
  }

  const cacheSettingsOptions = ref(null)
  const loadingCacheSettings = ref(false)

  /**
   * Fetches the list of cache settings options and updates the 'cacheSettingsOptions' ref.
   */
  const listCacheSettingsOptions = async () => {
    try {
      loadingCacheSettings.value = true
      cacheSettingsOptions.value = await props.listCacheSettingsService({
        id: props.edgeApplicationId
      })
    } finally {
      loadingCacheSettings.value = false
    }
  }

  const showNewBehaviorButton = ref(true)

  /**
   * Updates the 'showNewBehaviorButton' ref.
   * @param {boolean} isShow - Whether to show the new behavior button.
   */
  const setShowNewBehaviorButton = (isShow) => {
    showNewBehaviorButton.value = isShow
  }

  /**
   * Updates the 'showTargetField' property of the behavior at the specified index.
   * @param {boolean} isShow - Whether to show the target field.
   * @param {number} index - The index of the behavior to update.
   */
  const setShowBehaviorTargetField = (isShow, index) => {
    behaviors.value[index].showTargetField = isShow
  }

  /**
   * Removes behaviors from the behaviors array starting from the specified index.
   * @param {number} startIndex - The index to start removing behaviors from.
   */
  const removeBehaviorsFromIndex = (startIndex) => {
    const endIndex = behaviors.value.length - 1
    for (let index = endIndex; index > startIndex; index--) {
      removeBehavior(index)
    }
  }

  /**
   * Changes the type of the behavior at the specified index and updates related properties.
   * @param {string} behaviorName - The new type of the behavior.
   * @param {number} index - The index of the behavior to change.
   */
  const changeBehaviorType = (behaviorName, index) => {
    const disableTargetOptions = [
      'deliver',
      'enable_gzip',
      'bypass_cache_phase',
      'deny',
      'forward_cookies',
      'no_content',
      'optimize_images',
      'redirect_http_to_https'
    ]
    const disableAddBehaviorButtonOptions = [
      'deliver',
      'redirect_to_301',
      'redirect_to_302',
      'deny',
      'no_content'
    ]

    let targetValue = behaviors.value[index].value.target
    if (!isEditDrawer.value) targetValue = ''
    if (typeof targetValue == 'object' && Object.keys(targetValue).length === 0) targetValue = ''

    updateBehavior(index, { name: behaviorName, target: targetValue })
    setShowNewBehaviorButton(true)

    switch (behaviorName) {
      case 'run_function':
        listFunctionsInstanceOptions()
        break
      case 'set_cache_policy':
        listCacheSettingsOptions()
        break
      case 'set_origin':
        listOriginsOptions()
        break
      case 'capture_match_groups':
        let matchGroupsFields = { captured_array: '', subject: '', regex: '' }
        if (isEditDrawer.value) matchGroupsFields = behaviors.value[index].value.target

        updateBehavior(index, { name: behaviorName, target: matchGroupsFields })
        break
      default:
        const isBehaviorTargetFieldEnabled = !disableTargetOptions.includes(behaviorName)
        const isAddBehaviorButtonEnabled = !disableAddBehaviorButtonOptions.includes(behaviorName)

        setShowBehaviorTargetField(isBehaviorTargetFieldEnabled, index)
        setShowNewBehaviorButton(isAddBehaviorButtonEnabled)

        if (!isAddBehaviorButtonEnabled) {
          removeBehaviorsFromIndex(index)
        }
    }
  }

  /**
   * Calls the appropriate services to fetch options for the behaviors of the selected rules engine to edit.
   */
  const callOptionsServicesAtEdit = async () => {
    if (isEditDrawer.value) {
      const behaviorsLength = props.selectedRulesEngineToEdit.behaviors.length

      for (let index = 0; index < behaviorsLength; index++) {
        const behavior = props.selectedRulesEngineToEdit.behaviors[index]
        try {
          await handleBehaviorOptions(behavior, index)
        } catch (error) {
          toast.add({
            closable: true,
            severity: 'error',
            summary: `Error in ${behavior.name} load.`
          })
        }
      }
    }
  }

  /**
   * Handles fetching options for a behavior based on its type.
   * @param {Object} behavior - The behavior to handle.
   * @param {number} index - The index of the behavior in the behaviors array.
   */
  const handleBehaviorOptions = async (behavior, index) => {
    switch (behavior.name) {
      case 'run_function':
        await listFunctionsInstanceOptions()
        break
      case 'set_origin':
        await listOriginsOptions()
        break
      case 'set_cache_policy':
        await listCacheSettingsOptions()
        break
    }
    updateBehavior(index, { name: behavior.name, target: behavior.target })
  }

  const processBehaviorsAtEdit = async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    const areBehaviorsReady = (index) => behaviors && behaviors.value[index]

    const processBehavior = (behavior, index) => {
      changeBehaviorType(behavior.name, index)
    }

    if (isEditDrawer.value) {
      let index = 0

      while (!areBehaviorsReady(index)) {
        await delay(100)
      }
      props.selectedRulesEngineToEdit.behaviors.forEach((behavior, index) => {
        processBehavior(behavior, index)
      })
    }
  }

  const variableAutocompleteOptions = ref([
    '${arg_}',
    '${args}',
    '${cookie_}',
    '${da_}',
    '${device_group}',
    '${domain}',
    '${geoip_city_continent_code}',
    '${geoip_city_country_code}',
    '${geoip_city_country_name}',
    '${geoip_city}',
    '${geoip_continent_code}',
    '${geoip_country_code}',
    '${geoip_country_name}',
    '${geoip_region_name}',
    '${geoip_region}',
    '${host}',
    '${http_}',
    '${remote_addr}',
    '${remote_port}',
    '${remote_user}',
    '${request_body}',
    '${request_method}',
    '${request_uri}',
    '${request}',
    '${scheme}',
    '${server_port}',
    '${uri}'
  ])

  const variableItems = ref([])

  /**
   * Filters the variable autocomplete options based on the user's query.
   * @param {Object} event - The event object containing the user's query.
   * @param {string} event.query - The user's query.
   */
  const searchVariableOption = (event) => {
    variableItems.value = variableAutocompleteOptions.value.filter((item) =>
      item.includes(event.query)
    )
  }

  /**
   * Gets the label for the behavior item.
   * @param {Object} behaviorItem - The behavior item.
   * @param {Boolean} behaviorItem.isFirst - The behavior boolean isFirst.
   * @returns {string} The label for the behavior item.
   */
  const getBehaviorLabel = (behaviorItem) => {
    return behaviorItem.isFirst ? 'Then' : 'And'
  }

  /**
/**
* Checks if a criterion can be deleted.
* @param {number} index - The index of the criterion.
* @returns {boolean} True if the criterion can be deleted, false otherwise.
*/
  const isNotFirstCriteria = (index) => {
    return criteria.value.length > 1 && index < criteria.value.length - 1
  }

  const maximumConditionalsByCriteriaReached = (criteriaIndex) => {
    const MAXIMUM_ALLOWED = 10
    return criteria.value[criteriaIndex].value.length >= MAXIMUM_ALLOWED
  }

  const maximumCriteriaReached = computed(() => {
    const MAXIMUM_ALLOWED = 5
    return criteria.value.length >= MAXIMUM_ALLOWED
  })

  const MaximumBehaviorsAllowed = computed(() => {
    const MAXIMUM_NUMBER = 10
    return behaviors.value.length >= MAXIMUM_NUMBER
  })

  const phasesRadioOptions = [
    {
      title: 'Request Phase',
      value: 'request',
      subtitle: 'Configure the requests made to the edge.'
    },
    {
      title: 'Response Phase',
      value: 'response',
      subtitle: 'Configure the responses delivered to end-users.'
    }
  ]

  onMounted(() => {
    updateBehaviorsOptionsRequires()

    if (props.isEnableApplicationAccelerator) {
      if (criteria.value[0] && !isEditDrawer.value) {
        criteria.value[0].value[0].variable = ''
      }
    }
    if (behaviors.value[0]) {
      changeBehaviorType(behaviors.value[0].value.name, 0)
    }
    if (props.initialPhase) {
      phase.value = props.initialPhase
    }

    callOptionsServicesAtEdit()
    processBehaviorsAtEdit()
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Create a rule to handle the conditional execution of behaviors through logical operators."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          :readonly="checkPhaseIsDefaultValue"
          :disabled="checkPhaseIsDefaultValue"
          placeholder="My rule"
          :value="name"
          description="Give a unique and descriptive name to identify the rule."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="Description"
          :autoResize="true"
          rows="1"
          name="description"
          :value="description"
          description="Add a short description or comment to the rule."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Phase"
    description="Select the phase of the execution of the rule."
    v-if="!checkPhaseIsDefaultValue"
  >
    <template #inputs>
      <InlineMessage
        v-if="isEditDrawer"
        class="p-2"
        severity="info"
      >
        Once a rule is created, its phase cannot be changed. If you want to change the phase, you
        must create a new rule.
      </InlineMessage>

      <FieldGroupRadio
        nameField="phase"
        isCard
        :options="phasesRadioOptions"
      />
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
          v-for="(item, conditionalIndex) in criteriaItem.value"
          :key="conditionalIndex"
        >
          <div class="flex items-center gap-2">
            <Divider
              align="left"
              type="dashed"
              class="capitalize z-0"
            >
              {{ item.conditional }}
            </Divider>

            <PrimeButton
              v-if="conditionalIndex !== 0"
              icon="pi pi-ellipsis-h"
              size="small"
              outlined
              @click="(event) => toggleConditionalMenu(event, criteriaIndex, conditionalIndex)"
            />
            <PrimeMenu
              :ref="(el) => (conditionalMenuRef[`${criteriaIndex}${conditionalIndex}`] = el)"
              id="drawer_overlay_menu"
              :model="criteriaMenuOptions(criteriaIndex, conditionalIndex)"
              :popup="true"
            />
          </div>

          <div class="flex gap-2 mt-6 mb-8">
            <div class="p-inputgroup">
              <div
                class="p-inputgroup-addon"
                :class="{
                  'opacity-20': !props.isEnableApplicationAccelerator || checkPhaseIsDefaultValue
                }"
              >
                <i class="pi pi-dollar"></i>
              </div>
              <AutoComplete
                :id="`criteria[${criteriaIndex}][${conditionalIndex}].variable`"
                v-model="criteria[criteriaIndex].value[conditionalIndex].variable"
                :suggestions="variableItems"
                @complete="searchVariableOption"
                :disabled="!props.isEnableApplicationAccelerator || checkPhaseIsDefaultValue"
                :completeOnFocus="true"
              />
            </div>

            <FieldDropdown
              :options="criteriaOperatorOptions"
              optionLabel="label"
              optionValue="value"
              inputClass="w-full"
              :name="`criteria[${criteriaIndex}][${conditionalIndex}].operator`"
              :value="criteria[criteriaIndex].value[conditionalIndex].operator"
              :disabled="checkPhaseIsDefaultValue"
            />
            <FieldText
              v-if="
                criteria[criteriaIndex].value[conditionalIndex].operator !== 'exists' &&
                criteria[criteriaIndex].value[conditionalIndex].operator !== 'does_not_exist'
              "
              :name="`criteria[${criteriaIndex}][${conditionalIndex}].input_value`"
              :value="criteria[criteriaIndex].value[conditionalIndex].input_value"
              inputClass="w-full"
              :disabled="checkPhaseIsDefaultValue"
            />
          </div>
        </div>

        <div
          class="flex gap-2 mb-8"
          v-if="props.isEnableApplicationAccelerator && !checkPhaseIsDefaultValue"
        >
          <PrimeButton
            icon="pi pi-plus-circle"
            label="And"
            size="small"
            :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
            outlined
            @click="addNewConditional({ index: criteriaIndex, operator: 'and' })"
          />
          <PrimeButton
            icon="pi pi-plus-circle"
            label="Or"
            size="small"
            :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
            outlined
            @click="addNewConditional({ index: criteriaIndex, operator: 'or' })"
          />
        </div>

        <div
          v-if="props.isEnableApplicationAccelerator && !checkPhaseIsDefaultValue"
          class="flex items-center gap-2"
        >
          <Divider type="solid" />

          <PrimeButton
            v-if="isNotFirstCriteria(criteriaIndex)"
            icon="pi pi-ellipsis-h"
            size="small"
            outlined
            @click="(event) => toggleCriteriaMenu(event, criteriaIndex + 1)"
          />
          <PrimeMenu
            :ref="(el) => (criteriaMenuRef[criteriaIndex + 1] = el)"
            id="drawer_overlay_menu"
            :model="criteriaMenuOptions(criteriaIndex + 1)"
            :popup="true"
          />
        </div>
      </div>
      <div v-if="props.isEnableApplicationAccelerator && !checkPhaseIsDefaultValue">
        <PrimeButton
          icon="pi pi-plus-circle"
          label="Add Criteria"
          size="small"
          outlined
          :disabled="maximumCriteriaReached"
          @click="addNewCriteria"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Behaviors"
    description="Set the behaviors the rule should perform if the conditions defined in the criteria are met. Select a behavior and fill in all required information. Some behaviors can't be added together or in some conditions."
  >
    <template #inputs>
      <div
        class="flex flex-col gap-2"
        v-for="(behaviorItem, behaviorIndex) in behaviors"
        :key="behaviorItem.key"
      >
        <div class="flex items-center gap-2">
          <Divider
            align="left"
            type="dashed z-0"
          >
            {{ getBehaviorLabel(behaviorItem) }}
          </Divider>

          <PrimeButton
            v-if="behaviorIndex !== 0"
            icon="pi pi-ellipsis-h"
            size="small"
            outlined
            @click="(event) => toggleBehaviorMenu(event, behaviorIndex)"
          />

          <PrimeMenu
            :ref="(el) => (behaviorsMenuRef[behaviorIndex] = el)"
            id="drawer_behavior_overlay_menu"
            :model="behaviorMenuOptions(behaviorIndex)"
            :popup="true"
          />
        </div>

        <div class="flex gap-2 mt-6 mb-8">
          <div class="w-1/2">
            <FieldDropdown
              :key="behaviorItem.key"
              :name="`behaviors[${behaviorIndex}].name`"
              :options="behaviorsOptions"
              optionLabel="label"
              optionValue="value"
              optionDisabled="requires"
              :value="behaviors[behaviorIndex].value.name"
              inputClass="w-full"
              @onChange="(newValue) => changeBehaviorType(newValue, behaviorIndex)"
              :disabled="checkPhaseIsDefaultValue && behaviorItem.key === 0"
            />
          </div>

          <div class="w-1/2">
            <template v-if="behaviorItem.value.name === 'run_function'">
              <FieldDropdown
                :loading="loadingFunctionsInstance"
                :name="`behaviors[${behaviorIndex}].target`"
                :options="functionsInstanceOptions"
                optionLabel="name.text"
                optionValue="id"
                inputClass="w-full"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_origin'">
              <FieldDropdown
                :loading="loadingOrigins"
                :name="`behaviors[${behaviorIndex}].target`"
                :options="originsOptions"
                optionLabel="name"
                optionValue="originId"
                inputClass="w-full"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_cache_policy'">
              <FieldDropdown
                :loading="loadingCacheSettings"
                :name="`behaviors[${behaviorIndex}].target`"
                :options="cacheSettingsOptions"
                optionLabel="name"
                optionValue="id"
                inputClass="w-full"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'capture_match_groups'">
              <div class="flex flex-col w-full">
                <FieldText
                  placeholder="Captured Array"
                  inputClass="w-full mb-3"
                  :name="`behaviors[${behaviorIndex}].target.captured_array`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.target.captured_array"
                />
                <FieldText
                  placeholder="Subject"
                  inputClass="w-full mb-3"
                  :name="`behaviors[${behaviorIndex}].target.subject`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.target.subject"
                />
                <FieldText
                  placeholder="Regex"
                  inputClass="w-full"
                  :name="`behaviors[${behaviorIndex}].target.regex`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.target.regex"
                />
              </div>
            </template>
            <template v-else-if="behaviors[behaviorIndex]?.showTargetField">
              <FieldText
                inputClass="w-full"
                :name="`behaviors[${behaviorIndex}].target`"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
              />
            </template>
          </div>
        </div>
      </div>

      <template v-if="showNewBehaviorButton">
        <Divider type="solid" />
        <div>
          <PrimeButton
            icon="pi pi-plus-circle"
            label="Add Behavior"
            size="small"
            outlined
            :disabled="MaximumBehaviorsAllowed"
            @click="addNewBehavior"
          />
        </div>
      </template>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Status"
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="isActive"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </FormHorizontal>
</template>
