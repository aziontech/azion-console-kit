<script setup>
  import { ref } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputSwitch from 'primevue/inputswitch'
  import Dropdown from 'primevue/dropdown'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Divider from 'primevue/divider'
  import PrimeButton from 'primevue/button'
  import RadioButton from 'primevue/radiobutton'
  import InputText from 'primevue/inputtext'
  import Card from 'primevue/card'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-waf-rules-allowed' })

  const { value: matchZones } = useField('matchZones')
  const { value: path } = useField('path')
  const { value: reason } = useField('reason')
  const { value: status } = useField('status')
  const { value: useRegex } = useField('useRegex')
  const { value: ruleId } = useField('ruleId')

  const matchZonesOptions = ref([
    { name: 'Conditional Query String', value: 'conditional_query_string' },
    { name: 'Conditional Request Body', value: 'conditional_query_body' },
    { name: 'Conditional Request Header', value: 'conditional_query_header' },
    { name: 'File Name (Multipart Body)', value: 'file_name' },
    { name: 'Path', value: 'path' },
    { name: 'Query String', value: 'query_string' },
    { name: 'Raw Body', value: 'raw_body' },
    { name: 'Request Body', value: 'request_body' },
    { name: 'Request Header', value: 'request_header' }
  ])

  const ruleIdOption = ref([{ name: '0 - All Rules', value: 0 }])

  const addMatchZones = () => {
    const newArray = matchZones.value
    matchZones.value = [...newArray, { matches_on: 'value', zone: 'path', zone_input: null }]
  }

  const descriptionAllowedFormField = ref(
    'Choose match zones to put into the Allowed Rule:\n Path to put the path itself or one named path into the Allowed Rule. \n Query String or Conditional Query String to put all GET arguments or one named argument into the Allowed Rule. For example, the "search" argument. \n Request Header or Conditional Request Header to put all HTTP request headers or one named header into the Allowed Rule. For example, the Cookie header. \nRequest Body or Conditional Request Body to put all POST arguments or one named argument into the Allowed Rule. For example, the "search" argument.\n Raw Body to put the unparsed (raw) request body into the whitelist.\n File Name (Multipart Body) to put the unparsed (raw) request body into the Allowed Rule.'
  )

  const showConditionalInputs = (value) => {
    const conditionalInputs = [
      'conditional_query_string',
      'conditional_query_body',
      'conditional_query_header'
    ]
    return conditionalInputs.includes(value)
  }

  const showMatchOnInputs = (value) => {
    const conditionalInputs = [
      'conditional_query_string',
      'conditional_query_body',
      'conditional_query_header',
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
    description="Create a match zone for wich this Rule should be in the Allowed Rule."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="ruleid"
          class="text-color text-base font-medium"
          >Rule ID *</label
        >
        <Dropdown
          id="ruleid"
          v-model="ruleId"
          :options="ruleIdOption"
          optionLabel="name"
          optionValue="value"
          class="w-full"
          :disabled="true"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Reason *"
          name="reason"
          :value="reason"
          description="Set a suggestive description for this rule."
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
          label="Path *"
          name="path"
          :value="path"
          description="Path is only used to restrict the scope of a matchzone. Leave it in blank if you do not want to restrict matchzone scope."
        />
      </div>
      <Divider
        align="left"
        type="dashed"
      >
        Then
      </Divider>
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
              @click="deleteMatchZone(index)"
            />
          </div>

          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="ruleid"
              class="text-color text-base font-medium"
              >Match Zones *</label
            >
            <Dropdown
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
              <label class="text-color text-base font-medium">Field </label>
              <InputText
                v-model="matchZones[index].zone_input"
                type="text"
              />
            </div>
          </div>
          <div
            class="flex flex-col gap-2"
            v-if="showMatchOnInputs(matchZones[index].zone)"
          >
            <label class="text-color text-base font-medium">Matches On *</label>
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
                      To put the value into the allowed rule or.
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
                      To put the key name into the allowed rule.
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Divider type="solid"></Divider>
      <PrimeButton
        severity="secondary"
        icon="pi pi-plus"
        label="New Match Zone"
        class="sm:w-1/3"
        @click="addMatchZones"
      />
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Regex"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex gap-2 items-top">
        <InputSwitch
          id="regex"
          class="flex-shrink-0 flex-grow"
          v-model="useRegex"
        />
        <div class="flex flex-col gap-1">
          <label
            class="text-sm font-normal leading-tight"
            for="regex"
            >Active
          </label>
          <small class="text-color-secondary text-sm font-normal leading-tight">
            Check this option to treat conditional fields as regular expressions in all Match Zone
            Set. Otherwise, conditional fields should be treated as strings.
          </small>
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
          v-model="status"
        />
        <label
          for="status"
          class="text-base"
          >Status</label
        >
      </div>
    </template>
  </FormHorizontal>
</template>
