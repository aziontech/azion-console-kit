<script setup>
  import Dropdown from 'primevue/dropdown'
  import { useField } from 'vee-validate'
  import { computed, toRef, useSlots } from 'vue'

  const props = defineProps({
    value: {
      type: [String, Number],
      default: ''
    },
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    optionLabel: {
      type: String,
      default: ''
    },
    optionValue: {
      type: String,
      default: ''
    },
    optionDisabled: {
      type: [String, Function],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    isRequiredField: {
      type: Boolean,
      default: false
    },
    enableWorkaroundLabelToDisabledOptions: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    filter: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['onBlur', 'onChange', 'onSelectOption'])

  const name = toRef(props, 'name')
  const slots = useSlots()
  const hasDescriptionSlot = !!slots.description

  const { value: inputValue, errorMessage } = useField(name, undefined, {
    initialValue: props.value
  })

  const emitBlur = () => {
    emit('onBlur')
  }

  const emitChange = () => {
    const selectedOption = props.options.find(
      (option) => option[props.optionValue] === inputValue.value
    )

    emit('onChange', inputValue.value)

    if (selectedOption) {
      emit('onSelectOption', selectedOption)
    }
  }

  /**
   * Workaround to resolve the issue described in https://github.com/primefaces/primevue/issues/4431
   * This should be remove from this field component as soon as the
   * primevue team fixes the issue.
   * When we select a disabled value, the label  is not showing
   * @param {*} selectedValue The selected value in the Dropdown component.
   * @returns {string | null} The selected value if it corresponds to a disabled option, or null otherwise.
   */
  const getLabelBySelectedValue = (selectedValue) => {
    const result = props.options.find((option) => option.value === selectedValue)
    return result?.label
  }
  const enableCustomLabel = computed(() => {
    return props.enableWorkaroundLabelToDisabledOptions && !!inputValue.value
  })
  /**
   * end of primevue workaround
   */

  const labelSufix = computed(() => {
    return props.isRequiredField ? '*' : ''
  })
</script>

<template>
  <label
    :for="props.name"
    class="text-color text-base font-medium leading-5"
  >
    {{ props.label }} {{ labelSufix }}
  </label>
  <Dropdown
    appendTo="self"
    :id="name"
    :name="props.name"
    :loading="props.loading"
    v-model="inputValue"
    :options="props.options"
    :optionLabel="props.optionLabel"
    :optionDisabled="props.optionDisabled"
    :filter="props.filter"
    :optionValue="props.optionValue"
    :placeholder="props.placeholder"
    :autoFilterFocus="props.filter"
    @change="emitChange"
    @blur="emitBlur"
    :class="{ 'p-invalid': errorMessage }"
    v-bind="$attrs"
    :disabled="props.disabled"
    class="w-full"
    :pt="{
      filterInput: {
        class: 'w-full'
      }
    }"
  >
    <template
      v-if="enableCustomLabel"
      #value="slotProps"
    >
      <span>
        {{ getLabelBySelectedValue(slotProps.value) }}
      </span>
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </Dropdown>

  <small
    v-if="errorMessage"
    class="p-error text-xs font-normal leading-tight"
  >
    {{ errorMessage }}
  </small>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    v-if="props.description || hasDescriptionSlot"
  >
    <slot name="description">
      {{ props.description }}
    </slot>
  </small>
</template>
