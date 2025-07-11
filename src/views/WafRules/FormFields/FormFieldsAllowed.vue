<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import { defaultConditions } from '@/views/WafRules/Config'
  import { ref } from 'vue'

  import { useField, useFieldArray } from 'vee-validate'
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

  const {
    fields: conditions,
    push: pushCondition,
    remove: removeCondition
  } = useFieldArray('conditions')
  const { value: path } = useField('path')
  const { value: name } = useField('name')
  const { value: ruleId } = useField('ruleId')
  const { value: operator } = useField('operator')
  const { value: status } = useField('status')
  const activeAccordions = ref([0])

  const conditionsOptions = ref(defaultConditions)

  const ruleIdOption = ref(props.optionsRuleIds)

  const addCondition = () => {
    pushCondition({ match: 'specific_url', field: null })
  }

  const deleteMatchZone = (index) => {
    activeAccordions.value.splice(index, 1)
    removeCondition(index)
    if (activeAccordions.value[index]) {
      const invertedAccordionState = activeAccordions.value[index] === null ? 0 : null
      activeAccordions.value[index] = invertedAccordionState
    }
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Create a match zone to allow specific rules to amplify the security levels of the application and prevent false positives."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          data-testid="allowed-rules-form__rule-id"
          label="Rule ID"
          required
          name="ruleId"
          filter
          :options="ruleIdOption"
          :disabled="props.disabledRuleId"
          :value="ruleId"
          optionLabel="text"
          optionValue="value"
          appendTo="self"
          description="Select the rule that matches the request to be allowed."
          :pt="{
            panel: { class: 'sm:!w-[500px]' },
            item: { class: 'whitespace-pre-line', style: { height: 'auto !important' } }
          }"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="This rule was allowed because the path is being used in internal tests."
          description="Add a short description or comment to explain the reason this rule was allowed."
          :value="name"
          data-testid="allowed-rules-form__description-field"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    :isDrawer="true"
    title="Match Zone Set"
    description="Configure the behavior that should be used to allow a rule."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Path"
          name="path"
          :value="path"
          placeholder="/"
          description="Add a path to restrict the scope of a match zone."
          data-testid="allowed-rules-form__path-field"
        />
      </div>
      <div class="flex flex-col gap-8">
        <div
          v-for="(item, index) in conditions"
          :key="index"
          class="flex flex-col gap-6"
        >
          <Accordion v-model:activeIndex="activeAccordions[index]">
            <AccordionTab :header="conditions[index].value.title">
              <template #header>
                <div class="ml-auto flex justify-center items-center">
                  <PrimeButton
                    icon="pi pi-trash"
                    size="small"
                    outlined
                    @click="deleteMatchZone(index)"
                    :data-testid="`allowed-rules-form__delete-match-zone[${index}]__button`"
                  />
                </div>
              </template>
              <div class="flex flex-col gap-5">
                <div class="flex flex-col w-full sm:max-w-xs gap-2">
                  <FieldDropdown
                    :data-testid="`allowed-rules-form__match-zone[${index}]-field`"
                    label="Match Zone"
                    required
                    :name="`conditions[${index}].match`"
                    :options="conditionsOptions"
                    :value="conditions[index].value.match"
                    optionLabel="title"
                    optionValue="value"
                    appendTo="self"
                    description="Define the matching criteria to identify and allow specific requests based on your selected parameters."
                  />
                </div>
                <div class="flex flex-col sm:max-w-lg w-full gap-2">
                  <FieldText
                    label="Field"
                    :name="`conditions[${index}].field`"
                    :value="conditions[index].value.field"
                    description="Add a specific value that represents the match option or leave it blank to consider empty values."
                    :data-testid="`allowed-rules-form__zone[${index}]__header-field`"
                  />
                </div>
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      </div>
      <div>
        <PrimeButton
          severity="secondary"
          icon="pi pi-plus"
          label="Match Zone"
          class="sm:w-auto"
          :disabled="conditions?.length >= 9"
          outlined
          @click="addCondition"
          data-testid="allowed-rules-form__add-match-zone__button"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Regex"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="operator"
          name="operator"
          :value="operator"
          auto
          :isCard="false"
          title="Active"
          subtitle="Activate this option to treat conditional fields as regular expressions in all match zones."
          data-testid="allowed-rules-form__use-regex-field"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Status"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="status"
          name="status"
          :value="status"
          auto
          :isCard="false"
          title="Active"
          data-testid="allowed-rules-form__status-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
