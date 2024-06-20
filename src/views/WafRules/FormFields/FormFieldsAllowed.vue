<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Card from 'primevue/card'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InputSwitch from 'primevue/inputswitch'
  import RadioButton from 'primevue/radiobutton'
  import { ref } from 'vue'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-waf-rules-allowed' })

  const props = defineProps({
    optionsRuleIds: {
      type: Array,
      required: true,
      default: () => []
    },
    disabledRuleId: {
      type: Boolean,
      default: false
    }
  })
  const { value: matchZones } = useField('matchZones')
  const { value: path } = useField('path')
  const { value: reason } = useField('reason')
  const { value: status } = useField('status')
  const { value: useRegex } = useField('useRegex')
  const { value: ruleId } = useField('ruleId')

  const matchZonesOptions = ref([
    { name: 'Conditional Query String', value: 'conditional_query_string' },
    { name: 'Conditional Request Body', value: 'conditional_request_body' },
    { name: 'Conditional Request Header', value: 'conditional_request_header' },
    { name: 'File Name (Multipart Body)', value: 'file_name' },
    { name: 'Path', value: 'path' },
    { name: 'Query String', value: 'query_string' },
    { name: 'Raw Body', value: 'raw_body' },
    { name: 'Request Body', value: 'request_body' },
    { name: 'Request Header', value: 'request_header' }
  ])

  const ruleIdOption = ref(props.optionsRuleIds)

  const addMatchZones = () => {
    const newArray = matchZones.value
    matchZones.value = [...newArray, { matches_on: 'value', zone: 'path', zone_input: null }]
  }

  const descriptionAllowedFormField = ref(
    'Configure the behavior that should be used to allow a rule.'
  )

  const showInputNameHeader = (value) => {
    return value === 'conditional_query_header'
  }

  const showConditionalInputs = (value) => {
    const conditionalInputs = [
      'conditional_query_string',
      'conditional_request_body',
      'conditional_request_header'
    ]
    return conditionalInputs.includes(value)
  }

  const showMatchOnInputs = (value) => {
    const conditionalInputs = [
      'conditional_query_string',
      'conditional_request_body',
      'conditional_request_header',
      'query_string',
      'request_body',
      'request_header'
    ]
    return conditionalInputs.includes(value)
  }

  const deleteMatchZone = (index) => {
    matchZones.value.splice(index, 1)
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Create a match zone to allow specific rules to amplify the security levels of the application and prevent false positives."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="ruleid"
          class="text-color text-sm font-medium"
          >Rule ID *</label
        >
        <Dropdown
          appendTo="self"
          id="ruleid"
          v-model="ruleId"
          :options="ruleIdOption"
          optionLabel="text"
          optionValue="value"
          class="w-full"
          :disabled="props.disabledRuleId"
          :pt="{
            panel: { class: 'sm:!w-[500px]' },
            item: { class: 'whitespace-pre-line' }
          }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select the rule that matches the request to be allowed.
        </small>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Description *"
          name="reason"
          placeholder="This rule was allowed because the path is being used in internal tests."
          description="Add a short description or comment to explain the reason this rule was allowed."
          :value="reason"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    :isDrawer="true"
    title="Match Zone Set"
    :description="descriptionAllowedFormField"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Path"
          name="path"
          :value="path"
          placeholder="/"
          description="Add a path to restrict the scope of a match zone."
        />
      </div>
      <Divider
        align="left"
        type="dashed"
      ></Divider>
      <div class="flex flex-col gap-8">
        <div
          v-for="(item, index) in matchZones"
          :key="index"
          class="flex flex-col gap-6"
        >
          <div
            class="flex gap-3"
            v-if="index"
          >
            <Divider
              align="left"
              type="dashed"
              :key="index"
            >
              And
            </Divider>
            <PrimeButton
              outlined
              severity="secondary"
              icon="pi pi-trash"
              aria-label="Trash"
              v-tooltip.bottom="{ value: 'Delete', showDelay: 200 }"
              @click="deleteMatchZone(index)"
            />
          </div>

          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="ruleid"
              class="text-color text-sm font-medium"
              >Match Zone *</label
            >
            <Dropdown
              appendTo="self"
              id="ruleid"
              v-model="matchZones[index].zone"
              :options="matchZonesOptions"
              optionLabel="name"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="showConditionalInputs(matchZones[index].zone)"
          >
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <label
                v-if="showInputNameHeader(matchZones[index].zone)"
                class="text-color text-sm font-medium"
                >Header</label
              >
              <FieldText
                label="Field"
                :name="`matchZones[${index}].zone_input`"
                :value="matchZones[index].zone_input"
                description="Add a specific value that represents the match option or leave it blank to consider empty values."
              />
            </div>
          </div>
          <div
            class="flex flex-col gap-2"
            v-if="showMatchOnInputs(matchZones[index].zone)"
          >
            <label class="text-color text-sm font-medium">Matches On *</label>
            <div class="flex flex-col gap-3">
              <Card
                :pt="{
                  root: { class: 'shadow-none border-b rounded-none surface-border' },
                  body: { class: 'py-4 border-0' },
                  title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
                  subtitle: {
                    class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                  }
                }"
              >
                <template #title>
                  <RadioButton
                    v-model="matchZones[index].matches_on"
                    inputId="value"
                    name="matches_on"
                    value="value"
                  />
                  <div class="flex-col gap-1">
                    <div class="">
                      <div
                        class="text-color text-sm font-normal"
                        for="value"
                      >
                        Value
                      </div>
                    </div>
                    <div class="self-stretch text-color-secondary text-sm font-normal">
                      Adds the value into the allowed rule.
                    </div>
                  </div>
                </template>
              </Card>

              <Card
                :pt="{
                  root: { class: 'shadow-none rounded-none' },
                  body: { class: 'py-4 border-0' },
                  title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
                  subtitle: {
                    class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                  }
                }"
              >
                <template #title>
                  <RadioButton
                    v-model="matchZones[index].matches_on"
                    inputId="name"
                    name="matches_on"
                    value="name"
                  />
                  <div class="flex-col gap-1">
                    <div class="">
                      <div
                        class="text-color text-sm font-normal"
                        for="name"
                      >
                        Name
                      </div>
                    </div>
                    <div class="self-stretch text-color-secondary text-sm font-normal">
                      Adds the key name into the allowed rule.
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Divider type="solid"></Divider>
      <div>
        <PrimeButton
          severity="secondary"
          icon="pi pi-plus"
          label="New Match Zone"
          class="sm:w-auto"
          :disabled="matchZones?.length >= 9"
          outlined
          @click="addMatchZones"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Regex"
    description="Activate this option to treat conditional fields as regular expressions in all match zones."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="regex"
          class="flex-shrink-0"
          v-model="useRegex"
        />
        <div class="flex flex-col gap-1">
          <label
            class="text-base font-normal leading-tight"
            for="regex"
            >Active
          </label>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Status"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="status"
          class="flex-shrink-0"
          v-model="status"
        />
        <label
          for="status"
          class="text-base"
          >Active</label
        >
      </div>
    </template>
  </FormHorizontal>
</template>
