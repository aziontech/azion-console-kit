<script setup>
  import { ref, computed, watch, useSlots } from 'vue'
  import PrimeBadge from '@aziontech/webkit/badge'

  defineOptions({ name: 'collapsible-card' })

  const props = defineProps({
    title: {
      type: String,
      default: ''
    },
    count: {
      type: [Number, String],
      default: null
    },
    defaultExpanded: {
      type: Boolean,
      default: true
    },
    expanded: {
      type: Boolean,
      default: undefined
    },
    dataTestid: {
      type: String,
      default: 'collapsible-card'
    },
    disableToggle: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:expanded', 'toggle'])
  const slots = useSlots()

  const internalExpanded = ref(props.defaultExpanded)

  const isControlled = computed(() => props.expanded !== undefined)
  const isExpanded = computed({
    get: () => (isControlled.value ? props.expanded : internalExpanded.value),
    set: (value) => {
      if (!isControlled.value) internalExpanded.value = value
      emit('update:expanded', value)
    }
  })

  watch(
    () => props.expanded,
    (value) => {
      if (value !== undefined) internalExpanded.value = value
    }
  )

  const toggle = () => {
    if (props.disableToggle) return
    isExpanded.value = !isExpanded.value
    emit('toggle', isExpanded.value)
  }
</script>

<template>
  <div
    class="border surface-border rounded-md surface-section"
    :data-testid="dataTestid"
  >
    <button
      type="button"
      class="flex items-center gap-2 px-6 py-4 w-full rounded surface-ground surface-border"
      :class="{ 'cursor-default pointer-events-none': disableToggle }"
      :tabindex="disableToggle ? -1 : undefined"
      @click="toggle"
      :aria-expanded="disableToggle ? undefined : isExpanded"
      :data-testid="`${dataTestid}__toggle`"
    >
      <template v-if="slots.header">
        <slot name="header" />
      </template>
      <template v-else>
        <div class="flex items-center gap-2 flex-1">
          <span class="text-xs text-color-secondary flex-1 text-left">{{ title }}</span>
          <PrimeBadge
            v-if="count !== null && count !== undefined"
            :value="String(count)"
            severity="secondary"
          />
          <slot name="header-extra" />
        </div>
      </template>
      <span
        v-if="slots['header-actions']"
        class="pointer-events-auto inline-flex items-center"
      >
        <slot name="header-actions" />
      </span>
      <i
        v-if="!disableToggle"
        class="pi pi-chevron-down text-xs transition-transform"
        :class="{ 'rotate-180': !isExpanded }"
      />
    </button>

    <div
      v-if="!disableToggle"
      class="collapsible-panel"
      :class="{ 'is-expanded': isExpanded }"
      :aria-hidden="!isExpanded"
    >
      <div class="collapsible-panel__inner">
        <div class="flex flex-col">
          <slot />
          <div
            v-if="slots.footer"
            class="flex justify-end p-1.5"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .collapsible-panel {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 0.2s ease,
      opacity 0.2s ease;
  }
  .collapsible-panel.is-expanded {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  .collapsible-panel__inner {
    min-height: 0;
    overflow: hidden;
  }
</style>
