<!-- eslint-disable vue/return-in-computed-property -->
<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField, useFieldArray } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import fieldAutoComplete from '@/templates/form-fields-inputs/fieldAutoComplete'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'
  import Divider from 'primevue/divider'

  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  import { computed, ref, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    isApplicationAcceleratorEnabled: {
      type: Boolean,
      required: true
    },
    isDeliveryProtocolHttps: {
      type: Boolean,
      required: true
    },
    isImageOptimizationEnabled: {
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
      type: String,
      validator: (val) => ['reques', 'respons', 'default'].includes(val)
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
    },
    errors: {
      type: Object
    }
  })

  const isEditDrawer = computed(() => !!props.selectedRulesEngineToEdit)
  const isImageOptimizationEnabled = computed(() => !!props.isImageOptimizationEnabled)
  const checkPhaseIsDefaultValue = ref()

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

  const behaviorsLabelsTags = computed(() => {
    const empty = ''

    return {
      applicationAccelerator: !props.hideApplicationAcceleratorInDescription
        ? ' - Requires Application Accelerator'
        : empty,
      https: !props.isDeliveryProtocolHttps ? ' - Requires Delivery Protocol with HTTPS' : empty,
      imageOptimization: !props.isImageOptimizationEnabled ? ' - Requires Image Processor' : empty,
      edgeFunction: !props.isEdgeFunctionEnabled ? ' - Requires Edge Functions' : empty
    }
  })

  const behaviorsRequestOptions = ref([
    {
      label: 'Add Request Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'add_request_cookie',
      requires: true
    },
    { label: 'Add Request Header', value: 'add_request_header', requires: false },
    {
      label: 'Bypass Cache' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'bypass_cache_phase',
      requires: true
    },
    {
      label: 'Capture Match Groups' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'capture_match_groups',
      requires: true
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Deny (403 Forbidden)', value: 'deny', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: 'Filter Request Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'filter_request_cookie',
      requires: true
    },
    { label: 'Filter Request Header', value: 'filter_request_header', requires: false },
    {
      label: 'Forward Cookies' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'forward_cookies',
      requires: true
    },
    { label: 'No Content (204)', value: 'no_content', requires: false },
    {
      label: 'Optimize Images' + behaviorsLabelsTags.value.imageOptimization,
      value: 'optimize_images',
      requires: true
    },
    {
      label: 'Redirect HTTP to HTTPS' + behaviorsLabelsTags.value.https,
      value: 'redirect_http_to_https',
      requires: true
    },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    {
      label: 'Rewrite Request' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'rewrite_request',
      requires: true
    },
    {
      label: 'Run Function' + behaviorsLabelsTags.value.edgeFunction,
      value: 'run_function',
      requires: true
    },
    { label: 'Set Cache Policy', value: 'set_cache_policy', requires: false },
    { label: 'Set Origin', value: 'set_origin', requires: false }
  ])

  const behaviorsResponseOptions = ref([
    {
      label: 'Add Response Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'set_cookie',
      requires: true
    },
    { label: 'Add Response Header', value: 'add_response_header', requires: false },
    {
      label: 'Capture Match Groups' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'capture_match_groups',
      requires: true
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: 'Filter Response Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'filter_response_cookie',
      requires: true
    },
    { label: 'Filter Response Header', value: 'filter_response_header', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    {
      label: 'Run Function' + behaviorsLabelsTags.value.edgeFunction,
      value: 'run_function',
      requires: true
    }
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

  const removeConditional = (criteriaIndex, conditionalIndex) => {
    criteria.value[criteriaIndex].value.splice(conditionalIndex, 1)
  }

  const addNewConditional = ({ index, operator }) => {
    criteria.value[index].value.push({ ...DEFAULT_OPERATOR, conditional: operator })
  }

  const addNewCriteria = () => {
    pushCriteria([DEFAULT_OPERATOR])
  }

  const setDefaultBehaviorOptions = () => {
    const lastIndex = behaviors.value.length - 1
    changeBehaviorType(DEFAULT_BEHAVIOR.name, lastIndex)
  }

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

  const behaviorsOptions = computed(() => {
    return behaviorsOptionsMap[phase.value]() || []
  })

  const updateOptionRequires = (options) => {
    const conditionsMap = {
      redirect_http_to_https: !props.isDeliveryProtocolHttps,
      optimize_images: !isImageOptimizationEnabled.value,
      run_function: !props.isEdgeFunctionEnabled
    }

    return options.map((option) => {
      if (option.requires) {
        const requires = conditionsMap[option.value] ?? !props.isApplicationAcceleratorEnabled

        return { ...option, requires }
      }
      return option
    })
  }

  const updateBehaviorsOptionsRequires = () => {
    behaviorsRequestOptions.value = updateOptionRequires(behaviorsRequestOptions.value)
    behaviorsResponseOptions.value = updateOptionRequires(behaviorsResponseOptions.value)
  }
  const functionsInstanceOptions = ref(null)
  const loadingFunctionsInstance = ref(false)

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

  const setShowBehaviorTargetField = (isShow, index) => {
    behaviors.value[index].showTargetField = isShow
  }

  const removeBehaviorsFromIndex = (startIndex) => {
    const endIndex = behaviors.value.length - 1
    for (let index = endIndex; index > startIndex; index--) {
      removeBehavior(index)
    }
  }

  const disableAddBehaviorButtonComputed = computed(() => {
    const MAXIMUM_NUMBER_OF_BEHAVIORS = 10
    const disableAddBehaviorButton = true
    const behaviorHasNotBeenLoaded = !behaviors || !behaviors.value
    if (behaviorHasNotBeenLoaded) {
      return disableAddBehaviorButton
    }
    if (behaviors.value.length === 0) {
      return disableAddBehaviorButton
    }
    if (behaviors.value.length >= MAXIMUM_NUMBER_OF_BEHAVIORS) {
      return disableAddBehaviorButton
    }

    const lastBehavior = behaviors.value[behaviors.value.length - 1]
    const isLastBehaviorEmpty = !lastBehavior.value.name
    if (isLastBehaviorEmpty) {
      return disableAddBehaviorButton
    }
    const optionsThatDisableAddBehaviors = [
      'deliver',
      'redirect_to_301',
      'redirect_to_302',
      'deny',
      'no_content'
    ]

    return optionsThatDisableAddBehaviors.includes(lastBehavior.value.name)
  })

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
    if (targetValue && typeof targetValue == 'object' && Object.keys(targetValue).length === 0) {
      targetValue = ''
    }

    updateBehavior(index, { name: behaviorName, target: targetValue })

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
      case 'capture_match_groups': {
        let matchGroupsFields = { captured_array: '', subject: '', regex: '' }
        if (isEditDrawer.value) matchGroupsFields = behaviors.value[index].value.target

        updateBehavior(index, { name: behaviorName, target: matchGroupsFields })
        break
      }
      default: {
        const isBehaviorTargetFieldEnabled = !disableTargetOptions.includes(behaviorName)
        const isAddBehaviorButtonEnabled = !disableAddBehaviorButtonOptions.includes(behaviorName)

        setShowBehaviorTargetField(isBehaviorTargetFieldEnabled, index)

        if (!isAddBehaviorButtonEnabled) {
          removeBehaviorsFromIndex(index)
        }
      }
    }
  }

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
            summary: `Error loading ${behavior.name}.`
          })
        }
      }
    }
  }

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

  const searchVariableOption = (event) => {
    variableItems.value = variableAutocompleteOptions.value.filter((item) =>
      item.includes(event.query)
    )
  }

  const getBehaviorLabel = (behaviorItem) => {
    return behaviorItem.isFirst ? 'Then' : 'And'
  }

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

  const phasesRadioOptions = ref([])

  const setPhaseRadioOptions = () => {
    if (!checkPhaseIsDefaultValue.value) {
      phasesRadioOptions.value = [
        {
          title: 'Request Phase',
          inputValue: 'request',
          subtitle: 'Configure the requests made to the edge.'
        },
        {
          title: 'Response Phase',
          inputValue: 'response',
          subtitle: 'Configure the responses delivered to end-users.'
        }
      ]
    } else {
      phasesRadioOptions.value = []
    }
  }

  const handlePhaseOnMount = () => {
    phase.value = props.initialPhase || phase.value

    checkPhaseIsDefaultValue.value = phase.value === 'default'
    setPhaseRadioOptions()
  }

  const handleBehaviorsOnMount = () => {
    updateBehaviorsOptionsRequires()

    if (behaviors.value[0]) {
      changeBehaviorType(behaviors.value[0].value.name, 0)
    }
  }

  const handleCriteriaOnMount = () => {
    const shouldResetFirstCriteriaAtCreationWithApplicationAcceleratorEnabled =
      props.isApplicationAcceleratorEnabled && criteria.value[0] && !isEditDrawer.value

    if (shouldResetFirstCriteriaAtCreationWithApplicationAcceleratorEnabled) {
      criteria.value[0].value[0].variable = ''
    }
  }

  onMounted(() => {
    handleBehaviorsOnMount()
    handleCriteriaOnMount()
    processBehaviorsAtEdit()
    callOptionsServicesAtEdit()
    handlePhaseOnMount()
  })
</script>

<template>
  <FormHorizontal
    isDrawer
    title="General"
    description="Create a rule to handle the conditional execution of behaviors through logical operators."
    data-testid="rule-form-general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          :readonly="checkPhaseIsDefaultValue"
          :disabled="checkPhaseIsDefaultValue"
          placeholder="My rule"
          :value="name"
          description="Give a unique and descriptive name to identify the rule."
          data-testid="rule-form-general-name"
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
          data-testid="rule-form-general-description"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Phase"
    description="Select the phase of the execution of the rule."
    v-if="!checkPhaseIsDefaultValue"
    data-testid="rule-form-phase"
  >
    <template #inputs>
      <InlineMessage
        v-if="isEditDrawer"
        class="p-2"
        severity="info"
        data-testid="rule-form-phase-message"
      >
        Once a rule is created, its phase cannot be changed. To change the phase, create a new rule.
      </InlineMessage>

      <FieldGroupRadio
        nameField="phase"
        isCard
        :options="phasesRadioOptions"
        data-testid="edge-application-rule-form__phase__radio-group"
        :disabled="isEditDrawer"
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Criteria"
    description="Set the conditions to execute the rule. Add a variable, the comparison operator and, if prompted, an argument."
    data-testid="rule-form-criteria"
  >
    <template #inputs>
      <div
        class="flex flex-col"
        v-for="(criteriaItem, criteriaIndex) in criteria"
        :key="criteriaIndex"
        data-testid="rule-form-criteria-item"
      >
        <div
          v-for="(item, conditionalIndex) in criteriaItem.value"
          :key="conditionalIndex"
          data-testid="rule-form-criteria-item-conditional"
        >
          <div class="flex items-center gap-2">
            <Divider
              align="left"
              type="dashed"
              class="capitalize z-0"
              data-testid="rule-form-criteria-item-conditional-divider"
            >
              {{ item.conditional }}
            </Divider>

            <PrimeButton
              v-if="conditionalIndex !== 0"
              icon="pi pi-trash"
              size="small"
              outlined
              @click="removeConditional(criteriaIndex, conditionalIndex)"
              data-testid="rule-form-criteria-item-conditional-remove-button"
            />
          </div>

          <div class="flex gap-2 mt-6 mb-8">
            <div class="w-full">
              <fieldAutoComplete
                :data-testid="`edge-application-rule-form__criteria-variable[${criteriaIndex}][${conditionalIndex}]__autocomplete`"
                :id="`criteria[${criteriaIndex}][${conditionalIndex}].variable`"
                :name="`criteria[${criteriaIndex}][${conditionalIndex}].variable`"
                :value="criteria[criteriaIndex].value[conditionalIndex].variable"
                :suggestions="variableItems"
                :onComplete="searchVariableOption"
                icon="pi pi-search"
                :disabled="!props.isApplicationAcceleratorEnabled || checkPhaseIsDefaultValue"
                completeOnFocus
              />
            </div>

            <FieldDropdown
              :options="criteriaOperatorOptions"
              optionLabel="label"
              optionValue="value"
              class="h-fit"
              :name="`criteria[${criteriaIndex}][${conditionalIndex}].operator`"
              :value="criteria[criteriaIndex].value[conditionalIndex].operator"
              :disabled="checkPhaseIsDefaultValue"
              :data-testid="`edge-application-rule-form__criteria-operator[${criteriaIndex}][${conditionalIndex}]`"
            />

            <div class="flex flex-col w-full">
              <FieldText
                :data-testid="`edge-application-rule-form__criteria-input-value[${criteriaIndex}][${conditionalIndex}]`"
                v-if="
                  criteria[criteriaIndex].value[conditionalIndex].operator !== 'exists' &&
                  criteria[criteriaIndex].value[conditionalIndex].operator !== 'does_not_exist'
                "
                :name="`criteria[${criteriaIndex}][${conditionalIndex}].input_value`"
                :value="criteria[criteriaIndex].value[conditionalIndex].input_value"
                :disabled="checkPhaseIsDefaultValue"
              />
            </div>
          </div>
        </div>

        <div
          class="flex gap-2 mb-8"
          v-if="props.isApplicationAcceleratorEnabled && !checkPhaseIsDefaultValue"
          data-testid="rule-form-criteria-item-conditional-add-button"
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
          v-if="props.isApplicationAcceleratorEnabled && !checkPhaseIsDefaultValue"
          class="flex items-center gap-2"
        >
          <Divider type="solid" />
          <PrimeButton
            v-if="isNotFirstCriteria(criteriaIndex)"
            icon="pi pi-trash"
            size="small"
            outlined
            @click="removeCriteria(criteriaIndex + 1)"
            :data-testid="`edge-application-rule-form__criteria-remove[${criteriaIndex}]__button`"
          />
        </div>
      </div>
      <div v-if="props.isApplicationAcceleratorEnabled && !checkPhaseIsDefaultValue">
        <PrimeButton
          icon="pi pi-plus-circle"
          label="Add Criteria"
          size="small"
          outlined
          :disabled="maximumCriteriaReached"
          @click="addNewCriteria"
          data-testid="rule-form-criteria-add-button"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Behaviors"
    description="Set the behaviors the rule should perform if the conditions defined in the criteria are met. Select a behavior and fill in all required information. Some behaviors can't be added together or in some conditions."
    data-testid="rule-form-behaviors"
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
            data-testid="rule-form-behaviors-item-divider"
          >
            {{ getBehaviorLabel(behaviorItem) }}
          </Divider>

          <PrimeButton
            v-if="behaviorIndex !== 0"
            icon="pi pi-trash"
            size="small"
            outlined
            @click="removeBehavior(behaviorIndex)"
            data-testid="rule-form-behaviors-item-remove-button"
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
              @onChange="(newValue) => changeBehaviorType(newValue, behaviorIndex)"
              :data-testid="`edge-application-rule-form__behaviors-item[${behaviorIndex}]`"
            />
          </div>

          <div class="w-1/2">
            <template v-if="behaviorItem.value.name === 'run_function'">
              <FieldDropdown
                :filter="true"
                :loading="loadingFunctionsInstance"
                :name="`behaviors[${behaviorIndex}].target`"
                :options="functionsInstanceOptions"
                optionLabel="name.text"
                optionValue="id"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
                :data-testid="`edge-application-rule-form__function-instance-item[${behaviorIndex}]`"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_origin'">
              <FieldDropdown
                :loading="loadingOrigins"
                :name="`behaviors[${behaviorIndex}].target`"
                :options="originsOptions"
                optionLabel="name"
                optionValue="originId"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
                :data-testid="`edge-application-rule-form__origin-item[${behaviorIndex}]`"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_cache_policy'">
              <FieldDropdown
                :loading="loadingCacheSettings"
                :name="`behaviors[${behaviorIndex}].target`"
                :options="cacheSettingsOptions"
                optionLabel="name"
                optionValue="id"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
                :data-testid="`edge-application-rule-form__cache-settings-item[${behaviorIndex}]`"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'capture_match_groups'">
              <div class="flex flex-col w-full">
                <FieldText
                  placeholder="Captured Array"
                  class="w-full mb-3"
                  :name="`behaviors[${behaviorIndex}].target.captured_array`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.target.captured_array"
                  :data-testid="`edge-application-rule-form__behaviors-item-capture-match-groups-captured-array[${behaviorIndex}]`"
                />
                <FieldText
                  placeholder="Subject"
                  class="w-full mb-3"
                  :name="`behaviors[${behaviorIndex}].target.subject`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.target.subject"
                  :data-testid="`edge-application-rule-form__behaviors-item-capture-match-groups-subject[${behaviorIndex}]`"
                />
                <FieldText
                  placeholder="Regex"
                  class="w-full"
                  :name="`behaviors[${behaviorIndex}].target.regex`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.target.regex"
                  :data-testid="`edge-application-rule-form__behaviors-item-capture-match-groups-regex[${behaviorIndex}]`"
                />
              </div>
            </template>
            <template v-else-if="behaviors[behaviorIndex]?.showTargetField">
              <FieldText
                :name="`behaviors[${behaviorIndex}].target`"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.target"
                :data-testid="`edge-application-rule-form__behaviors-item-target[${behaviorIndex}]`"
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
          @click="addNewBehavior"
          data-testid="rule-form-behaviors-add-button"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Status"
    data-testid="rule-form-status"
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="isActive"
        name="active"
        auto
        :isCard="false"
        title="Active"
        data-testid="rule-form-status-switch"
      />
    </template>
  </FormHorizontal>
</template>
