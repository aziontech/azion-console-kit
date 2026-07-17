<script setup>
  import { computed, ref, onUnmounted } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { useElementOverflow } from '@/composables/useElementOverflow'
  import { clipboardWrite } from '@/helpers/clipboard'

  defineOptions({ name: 'domain-row' })

  const props = defineProps({
    domain: {
      type: String,
      default: ''
    },
    subdomain: {
      type: String,
      default: ''
    },
    environmentLabel: {
      type: String,
      default: ''
    },
    certificateLabel: {
      type: String,
      default: ''
    },
    isUrlVersioned: {
      type: Boolean,
      default: false
    },
    disableRemove: {
      type: Boolean,
      default: false
    },
    dataTestid: {
      type: String,
      default: 'domain-row'
    }
  })

  defineEmits(['edit', 'remove'])

  const fqdn = computed(() => {
    if (!props.domain && !props.subdomain) return 'New domain'
    const sub = props.subdomain ? `${props.subdomain}.` : ''
    return `${sub}${props.domain || ''}`
  })

  const versionedPrefix = computed(() =>
    props.isUrlVersioned && (props.domain || props.subdomain) ? '*.' : ''
  )

  const domainDisplay = computed(() => `${versionedPrefix.value}${fqdn.value}`)

  const environmentDisplay = computed(() => props.environmentLabel || '—')
  const certificateDisplay = computed(() => props.certificateLabel || '—')

  const { target: domainEl, isOverflowing: domainOverflowing } = useElementOverflow(
    () => domainDisplay.value
  )
  const { target: environmentEl, isOverflowing: environmentOverflowing } = useElementOverflow(
    () => environmentDisplay.value
  )
  const { target: certificateEl, isOverflowing: certificateOverflowing } = useElementOverflow(
    () => certificateDisplay.value
  )

  const hasDomain = computed(() => !!(props.domain || props.subdomain))
  const copyValue = computed(() => fqdn.value)

  const copied = ref(false)
  let copiedTimeout = null

  const copyDomain = async () => {
    try {
      await clipboardWrite(copyValue.value)
      copied.value = true
      clearTimeout(copiedTimeout)
      copiedTimeout = setTimeout(() => {
        copied.value = false
      }, 1500)
    } catch {
      copied.value = false
    }
  }

  onUnmounted(() => clearTimeout(copiedTimeout))
</script>

<template>
  <div
    class="flex items-center justify-between gap-4 min-h-12 px-4 py-2 border-t surface-border"
    :data-testid="dataTestid"
  >
    <div class="flex flex-1 gap-4 min-w-0">
      <div class="group flex flex-col gap-1 flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] uppercase tracking-wider text-color-secondary leading-none">
            domain
          </span>
        </div>
        <div class="flex items-center gap-1 min-w-0 h-5">
          <span
            ref="domainEl"
            class="text-xs truncate flex-1 min-w-0"
            v-tooltip.top="
              domainOverflowing
                ? { value: domainDisplay, showDelay: 200, class: 'domain-cell-tooltip' }
                : undefined
            "
          >
            <span
              v-if="versionedPrefix"
              class="text-color-secondary"
              title="This environment is url-versioned: each deploy generates a dynamic hash prefix."
              >{{ versionedPrefix }}</span
            >{{ fqdn }}
          </span>
          <PrimeButton
            v-if="hasDomain"
            :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
            class="p-button-text p-button-sm w-5 h-5 p-0 shrink-0 transition-opacity"
            :class="
              copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
            "
            v-tooltip.top="{ value: copied ? 'Copied!' : 'Copy', showDelay: 200 }"
            aria-label="Copy domain"
            :data-testid="`${dataTestid}__copy`"
            @click="copyDomain"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <span class="text-[10px] uppercase tracking-wider text-color-secondary leading-none">
          environment
        </span>
        <span
          ref="environmentEl"
          class="text-xs truncate leading-5"
          v-tooltip.top="
            environmentOverflowing
              ? { value: environmentDisplay, showDelay: 200, class: 'domain-cell-tooltip' }
              : undefined
          "
          >{{ environmentDisplay }}</span
        >
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <span class="text-[10px] uppercase tracking-wider text-color-secondary leading-none">
          certificate
        </span>
        <span
          ref="certificateEl"
          class="text-xs truncate leading-5"
          v-tooltip.top="
            certificateOverflowing
              ? { value: certificateDisplay, showDelay: 200, class: 'domain-cell-tooltip' }
              : undefined
          "
          >{{ certificateDisplay }}</span
        >
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <PrimeButton
        icon="pi pi-pencil"
        class="p-button-outlined p-button-sm w-7 h-7 p-0"
        :data-testid="`${dataTestid}__edit`"
        title="Edit"
        @click="$emit('edit')"
      />
      <PrimeButton
        icon="pi pi-trash"
        class="p-button-outlined p-button-sm p-button-danger w-7 h-7 p-0"
        :disabled="disableRemove"
        :data-testid="`${dataTestid}__remove`"
        title="Remove"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>

<style>
  .domain-cell-tooltip {
    max-width: none !important;
  }

  .domain-cell-tooltip .p-tooltip-text {
    white-space: nowrap !important;
  }
</style>
