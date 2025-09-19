<template>
  <CreateDrawerBlock
    data-testid="allow-rules-drawer"
    v-model:visible="visibleDrawer"
    :createService="handleSubmitAllowRules"
    :schema="validationSchema"
    :initialValues="initialValues"
    drawerId="allow-rules-drawer"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Allowing Rules"
  >
    <template #formFields>
      <div class="flex flex-col gap-6">
        <FormHorizontal
          isDrawer
          title="Type"
          description="Choose how to refine and allow rules to address false positives effectively."
        >
          <template #inputs>
            <div class="flex flex-col gap-6">
              <FieldGroupRadio
                nameField="typeOption"
                isCard
                :options="typeOptionsRadios"
                @onRadioChange="handleRadioChange"
                data-testid="allow-rules-drawer__type-option"
              >
                <template #footer="{ item }">
                  <PrimeTag
                    v-if="moreThanOneItemWasSelected && item.inputValue === 'path_regex'"
                    value="This option is blocked when more than one field is selected"
                    icon="pi pi-lock"
                    severity="info"
                    class="mt-3 opacity-100"
                  />
                </template>
              </FieldGroupRadio>
            </div>
            <Message
              severity="warn"
              :closable="false"
              :pt="{ wrapper: { class: 'px-4 py-2' }, icon: { class: 'w-4 h-4' } }"
              v-if="showPathRegexField"
            >
              <p class="text-xs">
                This is a sensitive field essential for secure and effective WAF configuration.
                Ensure the path regex is correct.
                <PrimeButton
                  link
                  label="Learn more about Regex in WAF Rules."
                  class="w-fit p-0 text-xs"
                  @click="clickOnLearnMore"
                />
              </p>
            </Message>
            <div
              class="flex flex-col sm:max-w-sm gap-4"
              v-if="showPathRegexField"
            >
              <FieldText
                data-testid="allow-rules-drawer__path-regex"
                label="Path Regex"
                required
                name="pathRegex"
                placeholder="/user/\d+/details"
                description=""
              />
            </div>
          </template>
        </FormHorizontal>
        <FormHorizontal
          title="Context"
          isDrawer
          description="Add a short description or comment to explain the reason this rule was allowed."
        >
          <template #inputs>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldTextarea
                label="Description"
                :placeholder="getPlaceholder()"
                name="name"
                rows="4"
                required
                data-testid="allow-rules-drawer__description"
              />
            </div>
          </template>
        </FormHorizontal>
      </div>
    </template>
  </CreateDrawerBlock>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import * as yup from 'yup'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldTextarea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import PrimeTag from 'primevue/tag'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Message from 'primevue/message'

  defineOptions({
    name: 'allowed-rules-details'
  })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    allowedByAttacks: {
      type: Array,
      default: () => []
    },
    handleSubmitAllowRules: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['update:visible', 'closeDrawer', 'handleDescriptionOfAttack'])

  const validationSchema = yup.object({
    typeOption: yup.string().required('Type option is required'),
    name: yup.string().required('Description is required'),
    pathRegex: yup.string().when('typeOption', {
      is: 'path_regex',
      then: (schema) => schema.required('Path regex is required when using Path Regex option'),
      otherwise: (schema) => schema.notRequired()
    })
  })

  const initialValues = ref({
    typeOption: 'fields',
    name: '',
    pathRegex: ''
  })

  const currentTypeOption = ref('fields')

  const closeDrawer = () => {
    currentTypeOption.value = 'fields'
    emit('closeDrawer')
  }

  const handleRadioChange = (value) => {
    currentTypeOption.value = value
  }

  const handleCreateWithSuccess = () => {
    closeDrawer()
  }

  const getPlaceholder = () => {
    return `e.g., False positive for query parameter 'item_value' affecting multiple paths.`
  }

  const clickOnLearnMore = () => {}

  const moreThanOneItemWasSelected = computed(() => props.allowedByAttacks.length > 1)

  const typeOptionsRadios = computed(() => [
    {
      title: 'Fields',
      subtitle:
        'Allow rules based on the selected fields (e.g., query parameters or headers). This option simplifies the process by grouping related paths into a single rule.',
      inputValue: 'fields'
    },
    {
      title: 'Path Regex',
      subtitle:
        'Use a pattern to allow rules for multiple paths that follow a similar structure. This option is useful when paths share predictable patterns.',
      inputValue: 'path_regex',
      disabled: moreThanOneItemWasSelected.value
    }
  ])

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const showPathRegexField = computed(() => {
    return currentTypeOption.value === 'path_regex'
  })
</script>
