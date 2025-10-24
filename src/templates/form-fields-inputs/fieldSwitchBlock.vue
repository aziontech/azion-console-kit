<template>
  <SelectorBlock
    v-bind="props"
    :selected="checked"
    :nameId="props.name"
    @change="changeState"
    :inputClass="props.selectorClass"
    :rootClass="rootClass"
    :data-testid="customTestId.selector"
  >
    <template #selector>
      <InputSwitch
        :disabled="disabled"
        :inputId="props.name"
        :name="props.name"
        @change="stopPropagation"
        v-model="inputValue"
        :readonly="readonly"
        :data-testid="customTestId.switch"
      />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </SelectorBlock>
</template>

<script setup>
  import InputSwitch from 'primevue/inputswitch'
  import SelectorBlock from '@/templates/selector-block'

  import { useField } from 'vee-validate'
  import { toRefs, useAttrs, computed } from 'vue'

  defineOptions({ name: 'FieldSwitchBlock' })

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
      type: Boolean
    },
    readonly: {
      type: Boolean
    },
    selectorClass: {
      type: String
    },
    rootClass: {
      type: String
    }
  })

  const { nameField } = toRefs(props)
  const emit = defineEmits(['onSwitchChange'])

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-switch'

    return {
      selector: `${id}__selector`,
      switch: `${id}__switch`
    }
  })

  const {
    value: inputValue,
    checked,
    handleChange
  } = useField(nameField, undefined, {
    type: 'checkbox',
    checkedValue: true,
    uncheckedValue: false
  })

  const stopPropagation = (event) => {
    event.preventDefault()
    event.stopPropagation()
    emit('onSwitchChange', inputValue.value)
  }

  const changeState = (event) => {
    stopPropagation(event)
    handleChange(!inputValue.value)
  }
</script>
