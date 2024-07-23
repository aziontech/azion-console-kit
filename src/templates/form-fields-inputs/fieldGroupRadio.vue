<script setup>
  import FieldRadioBlock from '@/templates/form-fields-inputs/fieldRadioBlock'
  import { useField } from 'vee-validate'
  import { computed, ref, toRefs, useAttrs } from 'vue'
  import PrimeDivider from 'primevue/divider'

  defineOptions({ name: 'FieldGroupRadio' })

  const emit = defineEmits(['onRadioChange'])

  const props = defineProps({
    hideSelector: {
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
    label: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      required: true
    },
    helpText: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    nameField: {
      type: String,
      required: true
    }
  })

  const { nameField } = toRefs(props)
  const { errorMessage } = useField(nameField)
  const pickListSize = ref(props.options.length - 1)

  const classStateRoot = computed(() => ({
    'p-disabled': props.disabled
  }))

  const classListSelector = computed(() => ({
    'flex-wrap': props.auto,
    'flex-col': !props.auto,
    'gap-3': props.isCard
  }))

  const showDivider = (position) => {
    return position < pickListSize.value && !props.isCard
  }

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-radio'

    return {
      label: `${id}__label`,
      radio: `${id}__radio`,
      description: `${id}__description`,
      error: `${id}__error-message`
    }
  })

  const radioTestId = (name, nameField, index) => {
    const rest = name ?? `${nameField}-radio-${index}`
    return `${customTestId.value.radio}__${rest}`
  }
</script>

<template>
  <div :class="['flex flex-col gap-2', classStateRoot]">
    <label
      class="text-color text-sm font-medium leading-5"
      :data-testid="customTestId.label"
    >
      {{ props.label }}
    </label>
    <div
      class="flex"
      :class="classListSelector"
    >
      <template
        v-for="(item, index) in props.options"
        :key="index"
      >
        <FieldRadioBlock
          v-show="!item.hide"
          :nameField="props.nameField"
          :name="item.name ?? `${props.nameField}-radio-${index}`"
          :auto="props.auto"
          :hideSelector="props.hideSelector"
          :isCard="props.isCard"
          v-bind="item"
          @onRadioChange="emit('onRadioChange', item.inputValue)"
          :data-testid="radioTestId(item.name, props.nameField, index)"
        >
          <template #footer>
            <slot
              name="footer"
              :item="item"
            />
          </template>
        </FieldRadioBlock>
        <PrimeDivider
          v-if="showDivider(index)"
          class="my-2"
        />
      </template>
    </div>
    <small
      class="text-xs text-color-secondary font-normal leading-5"
      v-if="props.helpText"
      :data-testid="customTestId.description"
    >
      {{ props.helpText }}
    </small>
    <small
      v-if="errorMessage"
      :data-testid="customTestId.error"
      class="p-error text-xs font-normal leading-tight"
    >
      {{ errorMessage }}
    </small>
  </div>
</template>
