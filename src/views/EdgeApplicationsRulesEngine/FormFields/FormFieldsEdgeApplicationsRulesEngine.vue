<script setup>
  import { useField, useFieldArray } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  import FieldAutoComplete from '@/templates/form-fields-inputs/fieldAutoComplete'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { cacheSettingsService } from '@/services/v2'

  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import Drawer from '@/views/EdgeApplicationsCacheSettings/Drawer'
  import DrawerOrigin from '@/views/EdgeApplicationsOrigins/Drawer'
  import DrawerFunction from '@/views/EdgeApplicationsFunctions/Drawer'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'

  import Divider from 'primevue/divider'
  import InlineMessage from 'primevue/inlinemessage'
  import PrimeButton from 'primevue/button'
  import { edgeConnectorsService } from '@/services/v2'

  const getBehaviorsOriginOrEdgeConnectors = () => {
    if (!hasFlagBlockApiV4()) {
      return [{ label: 'Set Edge Connectors', value: 'set_edge_connector', requires: false }]
    } else {
      return [{ label: 'Set Origin', value: 'set_origin', requires: false }]
    }
  }

  const getEdgeConnectors = async (query) => {
    return await edgeConnectorsService.listEdgeConnectorsService({
      fields: 'id,name',
      ...query
    })
  }

  const CRITERIA_OPERATOR_OPTIONS = [
    { label: 'is equal', value: 'is_equal' },
    { label: 'is not equal', value: 'is_not_equal' },
    { label: 'starts with', value: 'starts_with' },
    { label: 'does not start with', value: 'does_not_start_with' },
    { label: 'matches', value: 'matches' },
    { label: 'does not match', value: 'does_not_match' },
    { label: 'exists', value: 'exists' },
    { label: 'does not exist', value: 'does_not_exist' }
  ]

  const BEHAVIORS_DEFAULT_OPTIONS = [
    { label: 'Deny (403 Forbidden)', value: 'deny', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    ...getBehaviorsOriginOrEdgeConnectors(),
    { label: 'Run Function', value: 'run_function', requires: false },
    { label: 'No Content (204)', value: 'no_content', requires: false }
  ]

  const DEFAULT_OPERATOR = {
    variable: '${uri}',
    operator: 'is_equal',
    conditional: 'if',
    argument: ''
  }

  const DEFAULT_BEHAVIOR = {
    name: `deliver`
  }

  const DISABLE_ADD_BEHAVIOR_OPTIONS = [
    'deliver',
    'redirect_to_301',
    'redirect_to_302',
    'deny',
    'no_content'
  ]

  const DISABLE_TARGET_OPTIONS = [
    'deliver',
    'enable_gzip',
    'bypass_cache_phase',
    'deny',
    'forward_cookies',
    'no_content',
    'optimize_images',
    'redirect_http_to_https',
    'run_function',
    'set_origin',
    'set_cache_policy',
    'capture_match_groups'
  ]

  const VARIABLE_AUTOCOMPLETE_REQUEST_OPTIONS = ['${server_addr}', '${server_port}']

  const VARIABLE_AUTOCOMPLETE_RESPONSE_OPTIONS = [
    '${sent_http_name}',
    '${status}',
    '${tcpinfo_rtt}',
    '${upstream_addr}',
    '${upstream_cookie_}',
    '${upstream_http_}',
    '${upstream_status}'
  ]

  const VARIABLE_AUTOCOMPLETE_OPTIONS = [
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
    '${uri}'
  ]

  const PHASE_OPTIONS = [
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

  const emit = defineEmits([
    'toggleDrawer',
    'refreshCacheSettings',
    'refreshOrigins',
    'refreshFunctions'
  ])

  const props = defineProps({
    functionsInstanceOptions: {
      type: Array,
      required: true
    },
    cacheSettingsOptions: {
      type: Array,
      required: true
    },
    isLoadingRequests: {
      type: Boolean
    },
    originsOptions: {
      type: Array,
      required: true
    },
    isApplicationAcceleratorEnabled: {
      type: Boolean
    },
    isImageOptimizationEnabled: {
      type: Boolean
    },
    hideApplicationAcceleratorInDescription: {
      type: Boolean
    },
    isEdgeFunctionEnabled: {
      type: Boolean
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
      default: () => {}
    },
    errors: {
      type: Object
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    loadingOrigins: {
      type: Boolean,
      default: false
    },
    loadingFunctionsInstance: {
      type: Boolean,
      default: false
    }
  })

  const drawerRef = ref('')
  const drawerOriginRef = ref('')
  const drawerFunctionRef = ref('')
  const activeAccordions = ref([0])

  const isEditDrawer = computed(() => !!props.selectedRulesEngineToEdit)

  const behaviorsLabelsTags = computed(() => {
    const empty = ''

    return {
      applicationAccelerator: !props.hideApplicationAcceleratorInDescription
        ? ' - Requires Application Accelerator'
        : empty,
      https: empty,
      imageOptimization: !props.isImageOptimizationEnabled ? ' - Requires Image Processor' : empty,
      edgeFunction: !props.isEdgeFunctionEnabled ? ' - Requires Edge Functions' : empty
    }
  })

  const placeholderBehaviors = (behavior) => {
    const placeholders = {
      add_request_cookie: 'cookie-name=value',
      add_request_header: 'header-name: value',
      filter_request_cookie: 'cookie-name or cookie-name=cookie-value',
      filter_request_header: 'header-name',
      redirect_to_301: 'location',
      redirect_to_302: 'location',
      rewrite_request: 'URL-path'
    }

    return placeholders[behavior] || ''
  }

  const isDefaultPhase = computed(() => props.initialPhase === 'default')

  const isLoadingRequestsData = computed(() => {
    return props.isLoadingRequests
  })

  const behaviorsRequestOptions = ref([
    {
      label: 'Add Request Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'add_request_cookie',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'Add Request Header', value: 'add_request_header', requires: false },
    {
      label: 'Bypass Cache' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'bypass_cache_phase',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    {
      label: 'Capture Match Groups' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'capture_match_groups',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Deny (403 Forbidden)', value: 'deny', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: 'Filter Request Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'filter_request_cookie',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'Filter Request Header', value: 'filter_request_header', requires: false },
    {
      label: 'Forward Cookies' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'forward_cookies',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'No Content (204)', value: 'no_content', requires: false },
    {
      label: 'Optimize Images' + behaviorsLabelsTags.value.imageOptimization,
      value: 'optimize_images',
      requires: !props.isImageOptimizationEnabled
    },
    {
      label: 'Redirect HTTP to HTTPS' + behaviorsLabelsTags.value.https,
      value: 'redirect_http_to_https',
      requires: false
    },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    {
      label: 'Rewrite Request' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'rewrite_request',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    {
      label: 'Run Function' + behaviorsLabelsTags.value.edgeFunction,
      value: 'run_function',
      requires: !props.isEdgeFunctionEnabled
    },
    { label: 'Set Cache Policy', value: 'set_cache_policy', requires: false },
    ...getBehaviorsOriginOrEdgeConnectors()
  ])

  const behaviorsResponseOptions = ref([
    {
      label: 'Add Response Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'set_cookie',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'Add Response Header', value: 'add_response_header', requires: false },
    {
      label: 'Capture Match Groups' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'capture_match_groups',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: 'Filter Response Cookie' + behaviorsLabelsTags.value.applicationAccelerator,
      value: 'filter_response_cookie',
      requires: !props.hideApplicationAcceleratorInDescription
    },
    { label: 'Filter Response Header', value: 'filter_response_header', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    {
      label: 'Run Function' + behaviorsLabelsTags.value.edgeFunction,
      value: 'run_function',
      requires: !props.isEdgeFunctionEnabled
    }
  ])

  const { value: name } = useField('name')
  const { push: pushCriteria, remove: removeCriteria, fields: criteria } = useFieldArray('criteria')
  const {
    push: pushBehavior,
    remove: removeBehavior,
    fields: behaviors
  } = useFieldArray('behaviors')
  const { value: phase } = useField('phase')
  const { value: description } = useField('description')

  const removeConditional = (criteriaIndex, conditionalIndex) => {
    criteria.value[criteriaIndex].value.splice(conditionalIndex, 1)
  }

  const removeCriteriaDecorator = (index) => {
    activeAccordions.value.splice(index, 1)
    removeCriteria(index)
    if (activeAccordions.value[index]) {
      const invertedAccordionState = activeAccordions.value[index] === null ? 0 : null
      activeAccordions.value[index] = invertedAccordionState
    }
  }

  const addNewConditional = ({ index, operator }) => {
    criteria.value[index].value.push({ ...DEFAULT_OPERATOR, conditional: operator })
  }

  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const openDrawerOrigin = () => {
    drawerOriginRef.value.openDrawerCreate()
  }

  const openDrawerFunction = () => {
    drawerFunctionRef.value.openDrawerCreate()
  }

  const addNewCriteria = () => {
    activeAccordions.value.push(0)
    pushCriteria([DEFAULT_OPERATOR])
  }

  const addNewBehavior = () => {
    pushBehavior({ ...DEFAULT_BEHAVIOR })
  }

  const behaviorsOptionsMap = {
    request: () => behaviorsRequestOptions.value,
    default: () => {
      if (behaviors.value.length === 1) {
        return BEHAVIORS_DEFAULT_OPTIONS
      }
      return behaviorsRequestOptions.value
    },
    response: () => behaviorsResponseOptions.value
  }

  const behaviorsOptions = computed(() => {
    return behaviorsOptionsMap[phase.value]() || []
  })

  const disableAddBehaviorButtonComputed = computed(() => {
    const MAXIMUM_NUMBER_OF_BEHAVIORS = 10

    const disableAddBehaviorButton = true

    const isBehaviorsListEmpty = !behaviors.value?.length
    if (isBehaviorsListEmpty) return disableAddBehaviorButton

    const excededMaximumNumberOfBehaviors = behaviors.value.length >= MAXIMUM_NUMBER_OF_BEHAVIORS
    if (excededMaximumNumberOfBehaviors) return disableAddBehaviorButton

    const lastBehavior = behaviors.value[behaviors.value.length - 1]

    const isLastBehaviorEmpty = !lastBehavior.value.name
    if (isLastBehaviorEmpty) return disableAddBehaviorButton

    return DISABLE_ADD_BEHAVIOR_OPTIONS.includes(lastBehavior.value.name)
  })

  const showDefaultField = (name) => {
    return !DISABLE_TARGET_OPTIONS.includes(name)
  }

  const variableItems = ref([])

  const searchVariableOption = (event) => {
    let combinedOptions = [...VARIABLE_AUTOCOMPLETE_OPTIONS]

    if (phase.value === 'request') {
      combinedOptions = [...combinedOptions, ...VARIABLE_AUTOCOMPLETE_REQUEST_OPTIONS]
    } else if (phase.value === 'response') {
      combinedOptions = [...combinedOptions, ...VARIABLE_AUTOCOMPLETE_RESPONSE_OPTIONS]
    }

    variableItems.value = combinedOptions.filter((item) => item.includes(event.query))
  }

  const isNotLastCriteria = (criteriaIndex) => {
    return criteriaIndex !== criteria.value.length - 1
  }

  const shouldRenderCriteriaValueInput = (criteriaIndex, conditionalIndex) => {
    return (
      criteria.value[criteriaIndex].value[conditionalIndex].operator !== 'exists' &&
      criteria.value[criteriaIndex].value[conditionalIndex].operator !== 'does_not_exist'
    )
  }

  const getBehaviorLabel = (behaviorItem) => {
    return behaviorItem.isFirst ? 'Then' : 'And'
  }

  const maximumConditionalsByCriteriaReached = (criteriaIndex) => {
    const MAXIMUM_ALLOWED = 10
    return criteria.value[criteriaIndex].value.length >= MAXIMUM_ALLOWED
  }

  const maximumCriteriaReached = computed(() => {
    const MAXIMUM_ALLOWED = 5
    return criteria.value.length >= MAXIMUM_ALLOWED
  })

  const openAccordionWithFormErrors = () => {
    const errorsKeys = Object.keys(props.errors)
    if (errorsKeys.length > 0) {
      const match = errorsKeys[0].match(/criteria\[(\d+)\]/)
      const index = match[1]
      activeAccordions.value[index] = 0
    }
  }
  watch(
    () => criteria.value.length,
    () => {
      if (criteria.value.length > activeAccordions.value.length) {
        criteria.value.forEach((index) => {
          if (!activeAccordions.value[index]) {
            activeAccordions.value.push(0)
          }
        })
      }
    }
  )
  watch(
    () => drawerRef.value.showCreateDrawer,
    () => {
      emit('toggleDrawer', drawerRef.value.showCreateDrawer)
    }
  )

  watch(
    () => drawerOriginRef.value.showCreateOriginDrawer,
    () => {
      emit('toggleDrawer', drawerOriginRef.value.showCreateOriginDrawer)
    }
  )

  watch(
    () => drawerFunctionRef.value.showCreateFunctionDrawer,
    () => {
      emit('toggleDrawer', drawerFunctionRef.value.showCreateFunctionDrawer)
    }
  )

  watch(
    () => props.errors,
    () => {
      openAccordionWithFormErrors()
    }
  )

  const handleSuccess = () => {
    emit('refreshCacheSettings')
  }

  const handleSuccessOrigin = () => {
    emit('refreshOrigins')
  }

  const handleSuccessFunction = () => {
    emit('refreshFunctions')
  }
</script>

<template>
  <FormHorizontal
    isDrawer
    title="General"
    description="Create a rule to handle the conditional execution of behaviors through logical operators."
    data-testid="rule-form-general"
  >
    <template #inputs>
      <Drawer
        ref="drawerRef"
        @onSuccess="handleSuccess"
        :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
        :createService="cacheSettingsService.createCacheSettingsService"
        :edgeApplicationId="edgeApplicationId"
        :showTieredCache="isTieredCacheEnabled"
      />
      <DrawerOrigin
        ref="drawerOriginRef"
        :showBarGoBack="false"
        @onSuccess="handleSuccessOrigin"
        :edgeApplicationId="edgeApplicationId"
        :createService="createOriginService"
        :clipboardWrite="clipboardWrite"
      />
      <DrawerFunction
        ref="drawerFunctionRef"
        @onSuccess="handleSuccessFunction"
        :edgeApplicationId="edgeApplicationId"
      />
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          :readonly="isDefaultPhase"
          :disabled="isDefaultPhase"
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
    v-if="!isDefaultPhase"
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
        :options="PHASE_OPTIONS"
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
        class="flex flex-col gap-8"
        v-for="(_, criteriaIndex) in criteria"
        :key="criteriaIndex"
      >
        <Accordion v-model:activeIndex="activeAccordions[criteriaIndex]">
          <AccordionTab :header="`Criteria ${criteriaIndex + 1}`">
            <template #header>
              <div class="ml-auto flex justify-center items-center">
                <PrimeButton
                  :disabled="criteriaIndex === 0"
                  icon="pi pi-trash"
                  size="small"
                  outlined
                  @click="removeCriteriaDecorator(criteriaIndex)"
                  :data-testid="`edge-application-rule-form__criteria-remove[${criteriaIndex}]__button`"
                />
              </div>
            </template>
            <div
              v-for="(item, conditionalIndex) in criteria[criteriaIndex].value"
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

              <div class="flex flex-col gap-4 sm:flex-row sm:gap-6 mt-6 mb-8 w-full">
                <div class="flex flex-col w-full">
                  <FieldAutoComplete
                    :data-testid="`edge-application-rule-form__criteria-variable[${criteriaIndex}][${conditionalIndex}]__autocomplete`"
                    :id="`criteria[${criteriaIndex}][${conditionalIndex}].variable`"
                    :name="`criteria[${criteriaIndex}][${conditionalIndex}].variable`"
                    :value="criteria[criteriaIndex].value[conditionalIndex].variable"
                    :suggestions="variableItems"
                    :onComplete="searchVariableOption"
                    icon="pi pi-search"
                    :disabled="!props.isApplicationAcceleratorEnabled || isDefaultPhase"
                    completeOnFocus
                  />
                </div>
                <div class="flex flex-col w-full sm:max-w-[160px]">
                  <FieldDropdown
                    :options="CRITERIA_OPERATOR_OPTIONS"
                    optionLabel="label"
                    optionValue="value"
                    class="h-fit w-full"
                    :name="`criteria[${criteriaIndex}][${conditionalIndex}].operator`"
                    :value="criteria[criteriaIndex].value[conditionalIndex].operator"
                    :disabled="isDefaultPhase"
                    :data-testid="`edge-application-rule-form__criteria-operator[${criteriaIndex}][${conditionalIndex}]`"
                  />
                </div>
                <div class="flex flex-col w-full">
                  <FieldText
                    :data-testid="`edge-application-rule-form__criteria-input-value[${criteriaIndex}][${conditionalIndex}]`"
                    v-if="shouldRenderCriteriaValueInput(criteriaIndex, conditionalIndex)"
                    :name="`criteria[${criteriaIndex}][${conditionalIndex}].argument`"
                    :value="criteria[criteriaIndex].value[conditionalIndex].argument"
                    :disabled="isDefaultPhase"
                  />
                </div>
              </div>
            </div>

            <div
              class="flex gap-2 w-full"
              v-if="props.isApplicationAcceleratorEnabled && !isDefaultPhase"
              data-testid="rule-form-criteria-item-conditional-add-button"
            >
              <PrimeButton
                class="w-full"
                icon="pi pi-plus-circle"
                label="And"
                :pt="{
                  root: { class: 'justify-center' },
                  label: { class: 'grow-0' }
                }"
                :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
                outlined
                @click="addNewConditional({ index: criteriaIndex, operator: 'and' })"
              />
              <PrimeButton
                class="w-full"
                icon="pi pi-plus-circle"
                label="Or"
                :pt="{
                  root: { class: 'justify-center' },
                  label: { class: 'grow-0' }
                }"
                :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
                outlined
                @click="addNewConditional({ index: criteriaIndex, operator: 'or' })"
              />
            </div>
          </AccordionTab>
        </Accordion>
        <Divider
          v-if="isNotLastCriteria(criteriaIndex)"
          align="center"
          type="dashed"
          class="capitalize z-0"
        >
          and
        </Divider>
      </div>
      <div v-if="props.isApplicationAcceleratorEnabled && !isDefaultPhase">
        <PrimeButton
          :pt="{
            root: { class: 'justify-center' },
            label: { class: 'grow-0' }
          }"
          icon="pi pi-plus-circle"
          label="Add Criteria"
          outlined
          class="w-full"
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
              v-bind:value="behaviors[behaviorIndex].value.name"
              :data-testid="`edge-application-rule-form__behaviors-item[${behaviorIndex}]`"
            />
          </div>

          <div class="w-1/2">
            <template v-if="behaviorItem.value.name === 'run_function'">
              <FieldDropdown
                filter
                :loading="loadingFunctionsInstance"
                :name="`behaviors[${behaviorIndex}].functionId`"
                :options="functionsInstanceOptions"
                optionLabel="name"
                optionValue="id"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.functionId"
                :data-testid="`edge-application-rule-form__function-instance-item[${behaviorIndex}]`"
              >
                <template #footer>
                  <ul class="p-2">
                    <li>
                      <PrimeButton
                        class="w-full whitespace-nowrap flex"
                        data-testid="edge-applications-rules-engine-form__create-function-instance-button"
                        text
                        @click="openDrawerFunction"
                        size="small"
                        icon="pi pi-plus-circle"
                        :pt="{
                          label: { class: 'w-full text-left' },
                          root: { class: 'p-2' }
                        }"
                        label="Create Function Instance"
                      />
                    </li>
                  </ul>
                </template>
              </FieldDropdown>
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_edge_connector'">
              <FieldDropdownLazyLoader
                :service="getEdgeConnectors"
                :loadService="edgeConnectorsService.loadEdgeConnectorsService"
                :loading="loadingOrigins"
                :name="`behaviors[${behaviorIndex}].edgeConnectorId`"
                optionLabel="name"
                optionValue="id"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.edgeConnectorId"
                :data-testid="`edge-application-rule-form__edge-connector-item[${behaviorIndex}]`"
              />
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_origin'">
              <FieldDropdown
                filter
                :loading="loadingOrigins"
                :name="`behaviors[${behaviorIndex}].originId`"
                :options="originsOptions"
                optionLabel="name"
                optionValue="originId"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.originId"
                :data-testid="`edge-application-rule-form__origin-item[${behaviorIndex}]`"
              >
                <template #footer>
                  <ul class="p-2">
                    <li>
                      <PrimeButton
                        class="w-full whitespace-nowrap flex"
                        data-testid="edge-applications-rules-engine-form__create-origin-button"
                        text
                        @click="openDrawerOrigin"
                        size="small"
                        icon="pi pi-plus-circle"
                        :pt="{
                          label: { class: 'w-full text-left' },
                          root: { class: 'p-2' }
                        }"
                        label="Create Origin"
                      />
                    </li>
                  </ul>
                </template>
              </FieldDropdown>
            </template>
            <template v-else-if="behaviorItem.value.name === 'set_cache_policy'">
              <FieldDropdown
                filter
                :loading="isLoadingRequestsData"
                :name="`behaviors[${behaviorIndex}].cacheId`"
                :options="cacheSettingsOptions"
                optionLabel="name"
                optionValue="id"
                :key="behaviorItem.key"
                :value="behaviors[behaviorIndex].value.cacheId"
                :data-testid="`edge-application-rule-form__cache-settings-item[${behaviorIndex}]`"
              >
                <template #footer>
                  <ul class="p-2">
                    <li>
                      <PrimeButton
                        class="w-full whitespace-nowrap flex"
                        data-testid="edge-applications-rules-engine-form__create-cache-policy-button"
                        text
                        @click="openDrawer"
                        size="small"
                        icon="pi pi-plus-circle"
                        :pt="{
                          label: { class: 'w-full text-left' },
                          root: { class: 'p-2' }
                        }"
                        label="Create Cache Policy"
                      />
                    </li>
                  </ul>
                </template>
              </FieldDropdown>
            </template>
            <template v-else-if="behaviorItem.value.name === 'capture_match_groups'">
              <div class="flex gap-3 flex-col w-full">
                <FieldText
                  :name="`behaviors[${behaviorIndex}].captured_array`"
                  :key="behaviorItem.key"
                  placeholder="Captured array name"
                  :value="behaviors[behaviorIndex].value.captured_array"
                  :data-testid="`edge-application-rule-form__behaviors-item-capture-match-groups-captured-array[${behaviorIndex}]`"
                />
                <FieldText
                  placeholder="Subject"
                  :name="`behaviors[${behaviorIndex}].subject`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.subject"
                  :data-testid="`edge-application-rule-form__behaviors-item-capture-match-groups-subject[${behaviorIndex}]`"
                />
                <FieldText
                  placeholder="Regex"
                  :name="`behaviors[${behaviorIndex}].regex`"
                  :key="behaviorItem.key"
                  :value="behaviors[behaviorIndex].value.regex"
                  :data-testid="`edge-application-rule-form__behaviors-item-capture-match-groups-regex[${behaviorIndex}]`"
                />
              </div>
            </template>
            <template v-else-if="showDefaultField(behaviorItem.value.name)">
              <div class="[&>input]:w-full">
                <FieldText
                  :name="`behaviors[${behaviorIndex}].target`"
                  :key="behaviorItem.key"
                  :placeholder="placeholderBehaviors(behaviorItem.value.name)"
                  :value="behaviors[behaviorIndex].value.target"
                  :data-testid="`edge-application-rule-form__behaviors-item-target[${behaviorIndex}]`"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
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
