<template>
  <SelectorBlock
    v-bind="props"
    :selected="checked"
    :nameId="props.name"
    @click="clickCard"
  >
    <template #selector>
      <PrimeRadio
        :disabled="disabled"
        :inputId="props.name"
        :name="props.name"
        @click="stopPropagation"
        :value="props.value"
        v-model="inputValue"
        :binary="props.binary"
      />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </SelectorBlock>
</template>

<script setup>
  import PrimeRadio from 'primevue/radiobutton'
  import SelectorBlock from '@/templates/selector-block'

  import { useField } from 'vee-validate'
  import { toRefs } from 'vue'

  defineOptions({ name: 'FieldRadioBlock' })

  const props = defineProps({
    title: {
      type: String
    },
    isLabel: {
      type: Boolean,
      default: false
    },
    subtitle: {
      type: String
    },
    description: {
      type: String
    },
    disabled: {
      type: Boolean,
      default: false
    },
    auto: {
      type: Boolean,
      default: false
    },
    isCard: {
      type: Boolean,
      default: true
    },
    hideSelector: {
      type: Boolean,
      default: false
    },
    nameField: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    value: {
      type: [Boolean, String, Object],
      default: false
    },
    binary: {
      type: Boolean,
      default: false
    }
  })

  const { nameField } = toRefs(props)

  const {
    value: inputValue,
    checked,
    handleChange
  } = useField(nameField, undefined, {
    type: 'checkbox',
    checkedValue: props.binary ? true : props.value,
    uncheckedValue: props.binary ? false : ''
  })

  const stopPropagation = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const clickCard = (event) => {
    if (props.binary) {
      stopPropagation(event)
      handleChange(!inputValue.value)
      return
    }
  }
</script>
