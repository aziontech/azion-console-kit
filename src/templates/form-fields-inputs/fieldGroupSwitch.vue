<script setup>
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { computed, ref, useAttrs } from 'vue'
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

  const attrs = useAttrs()

  const customTestId = (type, name = 'default') => {
    const id = attrs['data-testid'] || 'field-group-switch'

    const options = {
      label: `${id}__label`,
      switch: `${id}__switch-${name}`,
      description: `${id}__description`
    }

    return options[type] || id
  }
</script>

<template>
  <div :class="['flex flex-col gap-2', classStateRoot]">
    <label
      class="text-color text-sm font-medium leading-5"
      :data-testid="customTestId('label')"
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
        <FieldSwitchBlock
          :nameField="`${item.nameField}`"
          :name="`${item.nameField}-switch-${index}`"
          :auto="props.auto"
          :hideSelector="props.hideSelector"
          :isCard="props.isCard"
          v-bind="item"
          :selectorClass="props.inputClass"
          :data-testid="customTestId('switch', item.nameField)"
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
      :data-testid="customTestId('description')"
    >
      {{ props.helpText }}
    </small>
  </div>
</template>
