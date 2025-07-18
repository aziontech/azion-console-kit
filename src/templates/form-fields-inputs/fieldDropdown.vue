<script setup>
  import Dropdown from 'primevue/dropdown'
  import { useField } from 'vee-validate'
  import { computed, toRef, useSlots, useAttrs } from 'vue'
  import LabelBlock from '@/templates/label-block'

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
    },
    pt: {
      type: Object,
      default: () => {}
    },
    optionGroupLabel: {
      type: String,
      default: ''
    },
    optionGroupChildren: {
      type: String,
      default: ''
    },
    editable: {
      type: Boolean,
      default: false
    },
    emptyMessage: {
      type: String,
      default: 'No available options'
    },
    emptyFilterMessage: {
      type: String,
      default: 'No results found'
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

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-dropdown'

    return {
      label: `${id}__label`,
      dropdown: `${id}__dropdown`,
      value: `${id}__value`,
      description: `${id}__description`,
      error: `${id}__error-message`,
      filterInput: `${id}__dropdown-filter-input`,
      trigger: `${id}__dropdown-trigger`,
      loadingIcon: `${id}__loading-icon`
    }
  })

  const isDisabledIcon = computed(() => {
    const iconDisabled = props.iconDisabled || 'pi pi-lock'
    return props.disabled ? iconDisabled : ''
  })

  const passThrough = computed(() => {
    return {
      filterInput: {
        class: 'w-full',
        'data-testid': customTestId.value.filterInput
      },
      trigger: {
        'data-testid': customTestId.value.trigger
      },
      loadingIcon: {
        'data-testid': customTestId.value.loadingIcon
      },
      ...props.pt
    }
  })
</script>

<template>
  <LabelBlock
    :for="props.name"
    :label="props.label"
    :isRequired="$attrs.required"
    :data-testid="customTestId.label"
    v-if="props.label"
  />
  <Dropdown
    :dropdown-icon="isDisabledIcon"
    :editable="props.editable"
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
    :optionGroupLabel="props.optionGroupLabel"
    :optionGroupChildren="props.optionGroupChildren"
    :placeholder="props.placeholder"
    :autoFilterFocus="props.filter"
    :emptyMessage="props.emptyMessage"
    :emptyFilterMessage="props.emptyFilterMessage"
    @change="emitChange"
    @blur="emitBlur"
    :class="{ 'p-invalid': errorMessage }"
    v-bind="$attrs"
    :disabled="props.disabled"
    class="w-full"
    :pt="passThrough"
    :data-testid="customTestId.dropdown"
  >
    <template
      v-if="enableCustomLabel"
      #value="slotProps"
    >
      <span :data-testid="customTestId.value">
        {{ getLabelBySelectedValue(slotProps.value) }}
      </span>
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </Dropdown>

  <small
    v-if="errorMessage"
    :data-testid="customTestId.error"
    class="p-error text-xs font-normal leading-tight"
  >
    {{ errorMessage }}
  </small>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    :data-testid="customTestId.description"
    v-if="props.description || hasDescriptionSlot"
  >
    <slot name="description">
      {{ props.description }}
    </slot>
  </small>
</template>
