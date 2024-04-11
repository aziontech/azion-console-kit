<template>
  <div class="grid grid-col-1 p-10">
    <form
      class="flex flex-col gap-3"
      @submit.prevent
    >
      <div class="flex flex-col gap-4">
        <FieldGroupCheckbox
          label="Checkbox Group"
          nameField="checkboxGroup"
          :options="valuesSwitchCheck"
          v-bind="bindCheckboxGroup"
          helpText="Help text"
        />
        {{ values.checkboxGroup }}
      </div>
      <div class="flex flex-col gap-4">
        <FieldGroupSwitch
          label="Switch Group"
          nameField="switchGroup"
          helpText="Help text"
        >
          <PrimeButton
            class="w-fit mt-2"
            label="Submit"
            @click="console.log('item')"
          />
        </FieldGroupSwitch>
        {{ values.switchGroup }}
      </div>
      <div class="flex flex-col gap-4">
        <FieldGroupRadio
          label="Radio Group"
          nameField="radioGroup"
          auto
          :options="valuesSwitchCheck"
          helpText="Help text"
        />
        {{ values.radioGroup }}
      </div>

      <PrimeButton
        class="w-fit"
        label="Submit"
        @click="onSubmit"
      />
    </form>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import FieldGroupCheckbox from '@/templates/form-fields-inputs/fieldGroupCheckbox'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import PrimeButton from 'primevue/button'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  const validationSchema = yup.object({
    checkboxGroup: yup.array().min(2).required(),
    switchGroup: yup.array().min(2).required(),
    radioGroup: yup.string().required()
  })

  const { handleSubmit, values } = useForm({
    validationSchema,
    initialValues: {
      checkboxGroup: [],
      switchGroup: [
        {
          isCard: true,
          title: 'Title 1',
          subtitle: 'Subtitle 1',
          value: false
        },
        {
          isCard: true,
          isLabel: true,
          title: 'Title 2',
          subtitle: 'Subtitle 2',
          value: false
        },
        {
          isCard: true,
          title: 'Title 3',
          subtitle: 'Subtitle 3',
          value: true
        }
      ],
      radioGroup: 'Value 2'
    }
  })

  const { value: checkboxGroup } = useField('checkboxGroup')
  useField('switchGroup')
  useField('radioGroup')

  const bindCheckboxGroup = computed(() => ({
    hideSelector: checkboxGroup.value.includes('hideSelector'),
    auto: checkboxGroup.value.includes('auto'),
    isCard: checkboxGroup.value.includes('isCard'),
    disabled: checkboxGroup.value.includes('disabled'),
    divider: checkboxGroup.value.includes('divider')
  }))

  const onSubmit = handleSubmit((values) => {
    console.log(values)
  })

  const valuesSwitchCheck = ref([
    {
      title: 'hideSelector',
      value: 'hideSelector',
      subtitle: 'Hide Selector'
    },
    {
      title: 'auto',
      value: 'auto',
      subtitle: 'Auto'
    },
    {
      title: 'isCard',
      value: 'isCard',
      subtitle: 'Is Card'
    },
    {
      title: 'disabled',
      value: 'disabled',
      subtitle: 'Disabled'
    },
    {
      title: 'divider',
      value: 'divider',
      subtitle: 'Divider'
    }
  ])
</script>
