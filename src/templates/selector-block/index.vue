<template>
  <Card
    :pt="{
      root: { class: ['select-none', classStateRoot, rootClass] }
    }"
  >
    <template #content>
      <label
        class="flex gap-3 cursor-pointer"
        :class="classStateRootItem"
        :for="props.nameId"
      >
        <div v-show="!hideSelector">
          <slot name="selector" />
        </div>
        <div :class="styleClass">
          <div class="flex gap-3 text-base items-center font-medium">
            <span
              v-if="!props.isCard"
              class="text-color font-medium leading-5"
            >
              {{ props.title }}
            </span>
            <span v-else>
              {{ props.title }}
            </span>
          </div>
          <div
            class="text-sm font-normal text-color-secondary"
            v-if="props.subtitle"
          >
            {{ props.subtitle }}
          </div>
          <p
            class="py-3 text-sm font-normal text-color-secondary"
            v-if="props.description"
          >
            {{ props.description }}
          </p>
          <div
            @click="stopPropagation"
            v-if="slots.footer"
            class="w-full"
          >
            <slot name="footer" />
          </div>
        </div>
      </label>
    </template>
  </Card>
</template>

<script setup>
  import Card from 'primevue/card'
  import { computed, useSlots } from 'vue'

  defineOptions({ name: 'SelectorBlock' })

  const props = defineProps({
    title: {
      type: String
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
    selected: {
      type: Boolean,
      default: false
    },
    nameId: {
      type: String,
      required: true
    },
    inputClass: {
      type: String
    },
    rootClass: {
      type: String
    }
  })
  const slots = useSlots()

  const check = computed(() => props.selected)

  const stopPropagation = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const styleClass = computed(() => {
    const disabled = props.disabled && props.hideSelector ? 'p-disabled' : ''

    return `${disabled} ${props.inputClass}`
  })

  const classStateRootItem = computed(() => ({
    'p-4': props.isCard,
    'p-2': !props.isCard
  }))

  const classStateRoot = computed(() => ({
    'shadow-none': !props.isCard,
    'w-fit': props.auto,
    'border-transparent': !check.value,
    'border-orange-500': check.value,
    'border-orange-500/[.32]': props.disabled && check.value,
    'border rounded-md': props.isCard
  }))
</script>
