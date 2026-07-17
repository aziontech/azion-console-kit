<script setup>
  import { computed, ref, watch } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import ProgressBar from '@aziontech/webkit/progressbar'
  import SelectButton from '@aziontech/webkit/selectbutton'

  defineOptions({ name: 'deployment-progress-dialog' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: () => []
    },
    counts: {
      type: Object,
      default: () => ({ total: 0, inProgress: 0, done: 0, failed: 0, settled: 0 })
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    activeName: {
      type: String,
      default: null
    }
  })

  const emit = defineEmits(['retry-failed', 'close'])

  const STATUS_VISUAL = {
    deploying: { severity: 'info', label: 'Activating', icon: 'pi pi-spinner animate-spin' },
    done: { severity: 'success', label: 'Done', icon: 'pi pi-check-circle' },
    failed: { severity: 'danger', label: 'Failed', icon: 'pi pi-times-circle' },
    skipped: { severity: 'warning', label: 'Skipped', icon: 'pi pi-minus-circle' }
  }

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => {
      if (!value) emit('close')
    }
  })

  const headerText = computed(() => {
    const { total, settled } = props.counts
    if (props.isRunning) return `Deploying ${settled} of ${total}…`
    const noun = total === 1 ? 'Deployment Setting' : 'Deployment Settings'
    return `Deployed ${total} ${noun}`
  })

  const summaryText = computed(() => {
    const { done, failed } = props.counts
    return `${done} succeeded · ${failed} failed. Each activates independently; successful ones stay live.`
  })

  const progressValue = computed(() => {
    const { total, settled } = props.counts
    return total ? Math.round((settled / total) * 100) : 0
  })

  const filter = ref('all')

  const filterOptions = computed(() => [
    { label: `In Progress ${props.counts.inProgress}`, value: 'progress' },
    { label: `Failed ${props.counts.failed}`, value: 'failed' },
    { label: `Done ${props.counts.done}`, value: 'done' },
    { label: 'All', value: 'all' }
  ])

  const filteredItems = computed(() => {
    if (filter.value === 'progress')
      return props.items.filter((item) => item.status === 'deploying')
    if (filter.value === 'failed')
      return props.items.filter((item) => item.status === 'failed' || item.status === 'skipped')
    if (filter.value === 'done') return props.items.filter((item) => item.status === 'done')
    return props.items
  })

  const environmentLabel = (item) => {
    if (Array.isArray(item.environmentNames) && item.environmentNames.length) {
      return item.environmentNames.join(', ')
    }
    return item.policyLabel ?? ''
  }

  const visualFor = (item) => STATUS_VISUAL[item.status] ?? STATUS_VISUAL.deploying

  const SKIP_MESSAGES = {
    degraded: 'Could not read the active release; deployment skipped.',
    mismatch: 'The resource is not part of this deployment; skipped.',
    unresolved_version: 'No ready version resolved for the resource; skipped.'
  }

  const errorLinesFor = (item) => {
    const raw = item?.error?.message
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String)
    if (raw) return [String(raw)]
    return []
  }

  const feedbackFor = (item) => {
    if (item.status === 'failed') {
      const lines = errorLinesFor(item)
      return { tone: 'error', lines: lines.length ? lines : ['Something went wrong.'] }
    }
    if (item.status === 'skipped') {
      return { tone: 'muted', lines: [SKIP_MESSAGES[item.skipReason] ?? 'Deployment skipped.'] }
    }
    return { tone: 'muted', lines: [] }
  }

  watch(
    () => props.visible,
    (open) => {
      if (open) filter.value = 'all'
    }
  )
</script>

<template>
  <PrimeDialog
    v-model:visible="dialogVisible"
    modal
    :block-scroll="true"
    :closable="!isRunning"
    :close-on-escape="!isRunning"
    :dismissable-mask="false"
    class="w-full max-w-[var(--container-md)]"
    :header="headerText"
    data-testid="deployment-progress__dialog"
  >
    <div class="flex flex-col gap-[var(--spacing-4)]">
      <p
        class="text-body-sm text-[var(--text-color-secondary)]"
        data-testid="deployment-progress__summary"
      >
        {{ summaryText }}
      </p>

      <ProgressBar
        :value="progressValue"
        :show-value="false"
        style="height: 0.5rem"
        :pt="{ value: { style: 'background-color: var(--primary-color) !important' } }"
        data-testid="deployment-progress__bar"
      />

      <div
        v-if="isRunning && activeName"
        class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
        data-testid="deployment-progress__active"
      >
        <i class="pi pi-spinner animate-spin" />
        <span>
          Activating
          <strong class="font-semibold text-[var(--text-color)]">{{ activeName }}</strong>
        </span>
      </div>

      <SelectButton
        v-model="filter"
        :options="filterOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Filter deployments by status"
        data-testid="deployment-progress__filter"
      />

      <div
        class="flex max-h-[22rem] flex-col overflow-y-auto rounded-[var(--shape-elements)] border border-[var(--surface-border)]"
        data-testid="deployment-progress__list"
      >
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="flex flex-col gap-[var(--spacing-2)] border-b border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-3)] last:border-b-0"
          :data-testid="`deployment-progress__item-${item.id}`"
          :data-status="item.status"
        >
          <div class="flex items-center justify-between gap-[var(--spacing-3)]">
            <div class="flex min-w-0 items-center gap-[var(--spacing-2)]">
              <i class="ai ai-deploy-pillar text-[var(--text-color-secondary)]" />
              <span class="truncate text-body-sm font-semibold text-[var(--text-color)]">
                {{ item.name }}
              </span>
              <span
                v-if="environmentLabel(item)"
                class="truncate text-body-xs text-[var(--text-color-secondary)]"
              >
                · {{ environmentLabel(item) }}
              </span>
            </div>
            <PrimeTag
              :severity="visualFor(item).severity"
              :value="visualFor(item).label"
              :icon="visualFor(item).icon"
              rounded
            />
          </div>
          <div
            v-if="feedbackFor(item).lines.length"
            class="flex flex-col gap-[2px] pl-[var(--spacing-6)]"
            :data-testid="`deployment-progress__item-${item.id}-error`"
          >
            <span
              v-for="(line, index) in feedbackFor(item).lines"
              :key="index"
              class="break-words text-body-xs"
              :class="
                feedbackFor(item).tone === 'error'
                  ? 'text-[var(--error-color)]'
                  : 'text-[var(--text-color-secondary)]'
              "
            >
              {{ line }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-[var(--spacing-3)]">
        <PrimeButton
          v-if="counts.failed"
          label="Retry failed"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          size="small"
          :disabled="isRunning"
          data-testid="deployment-progress__retry"
          @click="emit('retry-failed')"
        />
        <PrimeButton
          label="Close"
          size="small"
          :disabled="isRunning"
          data-testid="deployment-progress__close"
          @click="emit('close')"
        />
      </div>
    </template>
  </PrimeDialog>
</template>
