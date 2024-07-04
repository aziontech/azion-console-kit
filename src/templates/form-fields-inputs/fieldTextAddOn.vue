<script setup>
  import { computed, ref, toRef, useAttrs, useSlots } from 'vue'
  import { useField } from 'vee-validate'
  import InputText from 'primevue/inputtext'

  const props = defineProps({
    value: {
      type: String,
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
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    }
  })
  const emit = defineEmits(['input'])
  const inputRef = ref(null)
  const name = toRef(props, 'name')
  const slots = useSlots()
  const attrs = useAttrs()
  const hasDescriptionSlot = !!slots.description
  const handleChange = ()=> {
    emit('input') 
  }

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-text'

    return {
      label: `${id}__label`,
      input: `${id}__input`,
      description: `${id}__description`,
      error: `${id}__error-message`
    }
  })

  const {
    value: inputValue,
    errorMessage,
    handleBlur,
  } = useField(name, undefined, {
    initialValue: props.value
  })

  defineExpose({
    inputRef
  })
</script>

<template>
  <label
    :for="props.name"
    :data-testid="customTestId.label"
    class="text-color text-base font-medium leading-5"
  >
    {{ props.label }}
  </label>
  <div class="p-inputgroup">
    <span class="p-inputgroup-addon">
      <slot 
        name="addOn"
      />
    </span>
    <InputText
      :data-testid="customTestId.input"
      ref="inputRef"
      :id="name"
      v-model="inputValue"
      :name="name"
      :readonly="readonly"
      :disabled="disabled"
      type="text"
      :placeholder="props.placeholder"
      @input="handleChange"
      :class="{ 'p-invalid': errorMessage }"
      @blur="handleBlur"
    />
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
    v-if="props.description || hasDescriptionSlot"
    :data-testid="customTestId.description"
  >
    <slot name="description">
      {{ props.description }}
    </slot>
  </small>
</template>
