<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField, useFieldArray } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldInputGroup from '@/templates/form-fields-inputs/fieldInputGroup'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeRadio from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import InputSwitch from 'primevue/inputswitch'
  import Divider from 'primevue/divider'
  import { computed, ref, onMounted } from 'vue'

  const props = defineProps({
    isEnableApplicationAcceleration: {
      type: Boolean,
      required: true
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
    }
  })

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

  const behaviorsRequestOptions = ref([
    {
      label: 'Add Request Cookie - requires Application Acceleration',
      value: 'add_request_cookie',
      requires: true
    },
    { label: 'Add Request Header', value: 'add_request_header', requires: false },
    {
      label: 'Bypass Cache - requires Application Acceleration',
      value: 'bypass_cache_phase',
      requires: true
    },
    {
      label: 'Capture Match Groups - requires Application Acceleration',
      value: 'capture_match_groups',
      requires: true
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Deny (403 Forbidden)', value: 'deny', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: 'Filter Request Cookie - requires Application Acceleration',
      value: 'filter_request_cookie',
      requires: true
    },
    { label: 'Filter Request Header', value: 'filter_request_header', requires: false },
    {
      label: 'Forward Cookies - requires Application Acceleration',
      value: 'forward_cookies',
      requires: true
    },
    { label: 'No Content (204)', value: 'no_content', requires: false },
    { label: 'Optimize Images', value: 'optimize_images', requires: false },
    { label: 'Redirect HTTP to HTTPS', value: 'redirect_http_to_https', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    {
      label: 'Rewrite Request - requires Application Acceleration',
      value: 'rewrite_request',
      requires: true
    },
    { label: 'Run Function', value: 'run_function', requires: false },
    { label: 'Set Cache Policy', value: 'set_cache_policy', requires: false },
    { label: 'Set Origin', value: 'set_origin', requires: false }
  ])

  const behaviorsResponseOptions = ref([
    {
      label: 'Add Response Cookie - requires Application Acceleration',
      value: 'add_response_cookie',
      requires: true
    },
    { label: 'Add Response Header', value: 'add_response_header', requires: false },
    {
      label: 'Capture Match Groups - requires Application Acceleration',
      value: 'capture_match_groups',
      requires: true
    },
    { label: 'Deliver', value: 'deliver', requires: false },
    { label: 'Enable Gzip', value: 'enable_gzip', requires: false },
    {
      label: 'Filter Response Cookie - requires Application Acceleration',
      value: 'filter_response_cookie',
      requires: true
    },
    { label: 'Filter Response Header', value: 'filter_response_header', requires: false },
    { label: 'Redirect To (301 Moved Permanently)', value: 'redirect_to_301', requires: false },
    { label: 'Redirect To (302 Found)', value: 'redirect_to_302', requires: false },
    { label: 'Run Function', value: 'run_function', requires: false }
  ])

  const { value: name } = useField('name')
  const { push: pushCriteria, fields: criteria } = useFieldArray('criteria')
  const {
    push: pushBehavior,
    remove: removeBehavior,
    fields: behaviors
  } = useFieldArray('behaviors')
  const { value: phase } = useField('phase')
  const { value: description } = useField('description')
  const { value: isActive } = useField('isActive')

  const phasesList = [
    {
      label: 'Response Phase',
      value: 'response'
    },
    {
      label: 'Request Phase',
      value: 'request'
    }
  ]

  const DEFAULT_AND_OPERATOR = {
    variable: '${uri}',
    operator: 'is_equal',
    conditional: 'and',
    input_value: ''
  }
  const DEFAULT_OR_OPERATOR = {
    variable: '${uri}',
    operator: 'is_equal',
    conditional: 'or',
    input_value: ''
  }
  const DEFAULT_IF_OPERATOR = {
    variable: '${uri}',
    operator: 'is_equal',
    conditional: 'if',
    input_value: '/page'
  }
  const DEFAULT_BEHAVIOR = {
    name: `deliver`,
    target: {}
  }

  const addConditionalAnd = (index) => {
    criteria.value[index].value.push(DEFAULT_AND_OPERATOR)
  }
  const addConditionalOr = (index) => {
    criteria.value[index].value.push(DEFAULT_OR_OPERATOR)
  }
  const addNewCriteria = () => {
    pushCriteria([DEFAULT_IF_OPERATOR])
  }
  const addNewBehavior = () => {
    pushBehavior({ ...DEFAULT_BEHAVIOR })
  }

  const showCriteriaValueField = ref(true)
  const isShowCriteriaValueField = (operator) => {
    const isOperatorExistsOrDoesNotExist = operator !== 'exists' && operator !== 'does_not_exist'
    showCriteriaValueField.value = isOperatorExistsOrDoesNotExist
  }

  const behaviorsOptions = computed(() =>
    phase.value === 'request' ? behaviorsRequestOptions.value : behaviorsResponseOptions.value
  )

  const updateBehaviorsOptionsRequires = () => {
    behaviorsRequestOptions.value = behaviorsRequestOptions.value.map((option) => ({
      ...option,
      requires: false
    }))

    behaviorsResponseOptions.value = behaviorsResponseOptions.value.map((option) => ({
      ...option,
      requires: false
    }))
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

  const showNewBehaviorButton = ref(true)
  const setBehaviorTargetValue = (newTargetValue, index) => {
    behaviors.value[index].value.target = newTargetValue
  }
  const setShowNewBehaviorButton = (isShow) => {
    showNewBehaviorButton.value = isShow
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
    behaviors.value[index].value.name = behaviorName
    setBehaviorTargetValue('', index)
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
        const defaultMatchGroupsFields = { captured_array: '', subject: '', regex: '' }
        setBehaviorTargetValue(defaultMatchGroupsFields, index)
        break
      default:
        const isBehaviorTargetFieldEnabled = !disableTargetOptions.includes(behaviorName)
        const isAddBehaviorButtonEnabled = !disableAddBehaviorButtonOptions.includes(behaviorName)

        setShowBehaviorTargetField(isBehaviorTargetFieldEnabled, index)
        setShowNewBehaviorButton(isAddBehaviorButtonEnabled)

        if(!isAddBehaviorButtonEnabled) {
          removeBehaviorsFromIndex(index)
        }
    }
  }

  onMounted(() => {
    if (props.isEnableApplicationAcceleration) {
      updateBehaviorsOptionsRequires()
    }
    if (behaviors.value[0]) {
      changeBehaviorType(behaviors.value[0].value.name, 0)
    }
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Create a rule set to handle the conditional execution of behaviors through logical operators."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          :value="name"
          description="Give a unique and descriptive name to identify the rule."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Description *"
          name="description"
          :value="description"
          description="Add a short text that describes the rule to remember what it's used for or write another type of comment."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Rule Type"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <div
          v-for="item in phasesList"
          :key="item.value"
          class="w-full border-1 rounded-md surface-border flex align-items-center justify-between p-4 gap-2"
          :class="{ 'border-radio-card-active': phase === item.value }"
        >
          <label class="font-medium">
            {{ item.label }}
            <div class="text-color-secondary text-sm font-normal">Description</div>
          </label>

          <PrimeRadio
            v-model="phase"
            :value="item.value"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Criteria"
    description="Set the conditions to execute the rule. Select a variable from the list, the operator and, if prompted, enter the comparison string."
  >
    <template #inputs>
      <div
        class="flex flex-col gap-2"
        v-for="(criteriaItem, index) in criteria"
        :key="index"
      >
        <div
          v-for="(item, itemIndex) in criteriaItem.value"
          :key="itemIndex"
        >
          <Divider
            align="left"
            type="dashed"
          >
            <b>{{ item.conditional }}</b>
          </Divider>

          <div class="flex gap-2 mt-6 mb-8">
            <FieldInputGroup
              :name="`criteria[${index}][${itemIndex}].variable`"
              :value="item.variable"
              :readonly="!props.isEnableApplicationAcceleration"
              placeholder="{uri}"
              inputClass="w-full"
            >
              <template #icon>
                <i class="pi pi-user"></i>
              </template>
            </FieldInputGroup>

            <FieldDropdown
              :name="`criteria[${index}][${itemIndex}].operator`"
              :options="criteriaOperatorOptions"
              optionLabel="label"
              optionValue="value"
              inputClass="w-full"
              :value="item.operator"
              @onChange="(newValue) => isShowCriteriaValueField(newValue)"
            />

            <FieldText
              v-if="showCriteriaValueField"
              :name="`criteria[${index}][${itemIndex}].input_value`"
              :value="item.input_value"
              inputClass="w-full"
            />
          </div>
        </div>

        <div
          class="flex gap-2 mb-8"
          v-if="props.isEnableApplicationAcceleration"
        >
          <PrimeButton
            icon="pi pi-plus-circle"
            label="And"
            size="small"
            outlined
            @click="addConditionalAnd(index)"
          />
          <PrimeButton
            icon="pi pi-plus-circle"
            label="OR"
            size="small"
            outlined
            @click="addConditionalOr(index)"
          />
        </div>
        <Divider
          type="solid"
          v-if="props.isEnableApplicationAcceleration"
        />
      </div>
      <div v-if="props.isEnableApplicationAcceleration">
        <PrimeButton
          icon="pi pi-plus-circle"
          label="New Criteria"
          size="small"
          outlined
          @click="addNewCriteria"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Behaviors"
    description="Set the behaviors you want your rule to perform if the conditions defined in the criteria are met. Select a behavior and all required information. Some actions can't be used together or in some conditions."
  >
    <template #inputs>
      <pre>
        {{ behaviors }}
      </pre>
      <div
        class="flex flex-col gap-2"
        v-for="(behaviorItem, index) in behaviors"
        :key="behaviorItem.key"
      >
        <Divider
          align="left"
          type="dashed"
        >
          {{ behaviorItem.isFirst ? 'Then' : 'And' }}
        </Divider>

        <div class="flex gap-2 mt-6 mb-8">
          <div class="w-full">
            <FieldDropdown
              :key="behaviorItem.key"
              :name="`behaviors[${index}].name`"
              :options="behaviorsOptions"
              optionLabel="label"
              optionValue="value"
              optionDisabled="requires"
              :value="behaviors[index].value.name"
              inputClass="w-full"
              @onChange="(newValue) => changeBehaviorType(newValue, index)"
            />
          </div>

          <template v-if="behaviorItem.value.name === 'run_function'">
            <FieldDropdown
              :loading="loadingFunctionsInstance"
              :name="`behaviors[${index}].target`"
              :options="functionsInstanceOptions"
              optionLabel="name.text"
              optionValue="id"
              inputClass="w-full"
              :key="behaviorItem.key"
              :value="behaviors[index].value.target"
            />
          </template>
          <template v-else-if="behaviorItem.value.name === 'set_origin'">
            <FieldDropdown
              :loading="loadingOrigins"
              :name="`behaviors[${index}].target`"
              :options="originsOptions"
              optionLabel="name"
              optionValue="id"
              inputClass="w-full"
              :key="behaviorItem.key"
              :value="behaviors[index].value.target"
            />
          </template>
          <template v-else-if="behaviorItem.value.name === 'set_cache_policy'">
            <FieldDropdown
              :loading="loadingCacheSettings"
              :name="`behaviors[${index}].target`"
              :options="cacheSettingsOptions"
              optionLabel="name"
              optionValue="id"
              inputClass="w-full"
              :key="behaviorItem.key"
              :value="behaviors[index].value.target"
            />
          </template>
          <template v-else-if="behaviorItem.value.name === 'capture_match_groups'">
            <div class="flex flex-col w-full">
              <FieldText
                placeholder="Captured Array"
                inputClass="w-full mb-3"
                :name="`behaviors[${index}].target.captured_array`"
                :key="behaviorItem.key"
                :value="behaviors[index].value.target.captured_array"
              />
              <FieldText
                placeholder="Subject"
                inputClass="w-full mb-3"
                :name="`behaviors[${index}].target.subject`"
                :key="behaviorItem.key"
                :value="behaviors[index].value.target.subject"
              />
              <FieldText
                placeholder="Regex"
                inputClass="w-full"
                :name="`behaviors[${index}].target.regex`"
                :key="behaviorItem.key"
                :value="behaviors[index].value.target.regex"
              />
            </div>
          </template>
          <template v-else-if="behaviors[index]?.showTargetField">
            <FieldText
              inputClass="w-full"
              :name="`behaviors[${index}].target`"
              :key="behaviorItem.key"
              :value="behaviors[index].value.target"
            />
          </template>
        </div>
      </div>

      <template v-if="showNewBehaviorButton">
        <Divider type="solid" />
        <div>
          <PrimeButton
            icon="pi pi-plus-circle"
            label="New Behaviors"
            size="small"
            outlined
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
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="active"
          v-model="isActive"
        />
        <label
          for="active"
          class="text-base"
          >Active</label
        >
      </div>
    </template>
  </FormHorizontal>
</template>
