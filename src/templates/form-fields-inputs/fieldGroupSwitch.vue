<script setup>
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { computed, ref } from 'vue'
  import PrimeDivider from 'primevue/divider'

  defineOptions({ name: 'FieldGroupSwitch' })

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
    helpText: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      required: true
    },
    inputClass: {
      type: String,
      default: ''
    }
  })

  const pickListSize = ref(props.options.length - 1)

  const classStateRoot = computed(() => ({
    'p-disabled': props.disabled
  }))

  const classListSelector = computed(() => ({
    'flex-wrap': props.auto,
    'flex-col': !props.auto,
    'gap-3': !props.divider
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
        <FieldSwitchBlock
          :nameField="`${item.nameField}`"
          :name="`${item.nameField}-switch-${index}`"
          :auto="props.auto"
          :hideSelector="props.hideSelector"
          :isCard="props.isCard"
          v-bind="item"
          :selectorClass="props.inputClass"
        >
          <template #footer>
            <slot
              name="footer"
              :item="item"
            />
          </template>
        </FieldSwitchBlock>
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
