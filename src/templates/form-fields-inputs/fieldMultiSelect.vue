<script setup>
  import Checkbox from 'primevue/checkbox'
  import { useField } from 'vee-validate'
  import { computed, toRef, useSlots, useAttrs } from 'vue'
  import LabelBlock from '@/templates/label-block'

  const props = defineProps({
    value: {
      type: Array,
      default: () => []
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
      default: 'label'
    },
    optionValue: {
      type: String,
      default: 'value'
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
    }
  })

  const emit = defineEmits(['onBlur', 'onChange'])

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
    emit('onChange', inputValue.value)
  }

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-multiselect'

    return {
      label: `${id}__label`,
      multiselect: `${id}__multiselect`,
      description: `${id}__description`,
      error: `${id}__error-message`,
      filterInput: `${id}__multiselect-filter-input`,
      trigger: `${id}__multiselect-trigger`,
      loadingIcon: `${id}__loading-icon`
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

  <div
    class="flex flex-col gap-3"
    :data-testid="customTestId.multiselect"
  >
    <div
      v-for="option in props.options"
      :key="option[props.optionValue]"
      class="flex items-center gap-3"
    >
      <Checkbox
        :id="`${props.name}_${option[props.optionValue]}`"
        :name="props.name"
        :value="option[props.optionValue]"
        v-model="inputValue"
        :disabled="
          props.disabled ||
          (typeof props.optionDisabled === 'function'
            ? props.optionDisabled(option)
            : option[props.optionDisabled])
        "
        @change="emitChange"
        @blur="emitBlur"
      />
      <label
        :for="`${props.name}_${option[props.optionValue]}`"
        class="cursor-pointer"
        :class="{
          'opacity-50':
            props.disabled ||
            (typeof props.optionDisabled === 'function'
              ? props.optionDisabled(option)
              : option[props.optionDisabled])
        }"
      >
        <div class="font-medium">{{ option[props.optionLabel] }}</div>
        <div
          v-if="option.description"
          class="text-sm text-color-secondary"
        >
          {{ option.description }}
        </div>
      </label>
    </div>
  </div>

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
