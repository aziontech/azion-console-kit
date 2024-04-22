<script setup>
  import FieldCheckboxBlock from '@/templates/form-fields-inputs/fieldCheckboxBlock'
  import { useField } from 'vee-validate'
  import { computed, ref, toRefs } from 'vue'
  import PrimeDivider from 'primevue/divider'

  defineOptions({ name: 'FieldGroupCheckbox' })

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
</script>

<template>
  <div :class="['flex flex-col gap-2', classStateRoot]">
    <label class="text-color text-sm font-medium leading-5">
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
        <FieldCheckboxBlock
          :nameField="props.nameField"
          :name="`${props.nameField}-checkbox-${index}`"
          :auto="props.auto"
          :hideSelector="props.hideSelector"
          :isCard="props.isCard"
          v-bind="item"
        >
          <template #footer>
            <slot :item="item" />
          </template>
        </FieldCheckboxBlock>
        <PrimeDivider
          v-if="showDivider(index)"
          class="my-2"
        />
      </template>
    </div>
    <small
      class="text-xs text-color-secondary font-normal leading-5"
      v-if="props.helpText"
    >
      {{ props.helpText }}
    </small>
    <small
      v-if="errorMessage"
      class="p-error text-xs font-normal leading-tight"
    >
      {{ errorMessage }}
    </small>
  </div>
</template>
