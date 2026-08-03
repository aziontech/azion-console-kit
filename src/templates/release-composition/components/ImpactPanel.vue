<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'release-impact-panel' })

  const props = defineProps({
    impact: {
      type: Object,
      default: () => ({
        hasSelection: false,
        impactUnavailable: true,
        perDs: [],
        totals: { domains: 0, workloads: 0, dsCount: 0 }
      })
    },
    degradationReason: {
      type: String,
      default: null
    }
  })

  const emit = defineEmits(['retry'])

  const onRetry = () => emit('retry')

  const UNAVAILABLE_MESSAGES = {
    fetch_failed:
      "Couldn't load the workloads needed to compute the impact. Retry, or publish anyway — the impact won't be shown.",
    legacy_no_bindings:
      "These deployments' workloads have no environment bindings yet, so the blast radius can't be computed. You can still publish.",
    capped:
      'The workloads list was truncated, so the impact shown is partial. You can still publish.'
  }
  const unavailableMessage = computed(
    () =>
      UNAVAILABLE_MESSAGES[props.degradationReason] ??
      "The blast radius (environments · workloads · domains) couldn't be computed. You can still publish, but the impact won't be shown."
  )

  const isPartial = computed(() => props.degradationReason === 'capped')
</script>

<template>
  <section
    class="flex flex-col gap-[var(--spacing-3)]"
    data-testid="release-composition__impact-panel"
  >
    <div
      v-if="!impact.hasSelection"
      class="rounded-[var(--shape-card)] border border-dashed border-[var(--surface-border)] p-[var(--spacing-6)] text-center text-body-xs text-[var(--text-color-secondary)]"
      data-testid="release-composition__impact-empty"
    >
      Select Deployment Settings to preview the impact.
    </div>

    <div
      v-else-if="impact.isLoading"
      class="flex items-center gap-[var(--spacing-2)] rounded-[var(--shape-card)] border border-[var(--surface-border)] bg-[var(--surface-50)] p-[var(--spacing-4)] text-body-xs text-[var(--text-color-secondary)]"
      data-testid="release-composition__impact-loading"
    >
      <i class="pi pi-spinner pi-spin" />
      <span>Computing impact…</span>
    </div>

    <div
      v-else-if="impact.impactUnavailable"
      class="flex flex-col rounded-[var(--shape-card)] border border-[var(--surface-border)] bg-[var(--surface-50)] p-[var(--spacing-4)]"
      data-testid="release-composition__impact-unavailable"
    >
      <div class="mb-[var(--spacing-2)] flex items-center gap-[var(--spacing-2)]">
        <i class="pi pi-exclamation-triangle text-[var(--warning-contrast)]" />
        <span class="text-body-sm font-semibold text-[var(--text-color)]">Impact unavailable</span>
      </div>
      <p class="mb-[var(--spacing-3)] text-body-xs text-[var(--text-color-secondary)]">
        {{ unavailableMessage }}
      </p>
      <div
        class="flex items-center gap-[var(--spacing-2)] rounded-[var(--shape-card)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
      >
        <i class="ai ai-deploy-pillar text-[var(--text-color-secondary)]" />
        <span>{{ impact.totals.dsCount }} Deployment Settings selected</span>
      </div>
      <PrimeButton
        label="Retry impact"
        icon="pi pi-refresh"
        severity="secondary"
        size="small"
        class="mt-[var(--spacing-3)] w-full"
        data-testid="release-composition__impact-retry"
        @click="onRetry"
      />
    </div>

    <div
      v-else
      class="flex flex-col gap-[var(--spacing-3)]"
      data-testid="release-composition__impact-tree"
    >
      <div
        v-if="isPartial"
        class="flex items-center gap-[var(--spacing-2)] rounded-[var(--shape-card)] border border-[var(--surface-border)] bg-[var(--surface-50)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
        data-testid="release-composition__impact-partial"
      >
        <i class="pi pi-exclamation-triangle text-[var(--warning-contrast)]" />
        <span class="text-body-xs text-[var(--text-color-secondary)]">
          Partial impact — the workloads list was truncated, so these numbers may be incomplete.
        </span>
      </div>

      <div
        v-for="ds in impact.perDs"
        :key="ds.deploymentId ?? ds.name"
        class="flex flex-col gap-[var(--spacing-3)]"
        :data-testid="`release-composition__impact-ds-${ds.name}`"
      >
        <div class="flex items-center gap-[var(--spacing-2)] py-[var(--spacing-1)]">
          <i class="ai ai-deploy-pillar text-[var(--text-color-secondary)]" />
          <span class="flex-1 text-body-sm font-semibold text-[var(--text-color)]">{{
            ds.name
          }}</span>
          <span class="ml-auto text-body-xxs text-[var(--text-color-secondary)]"
            >{{ ds.domains }} domains</span
          >
        </div>

        <div
          v-if="ds.environments.length"
          class="flex flex-col gap-[var(--spacing-3)] ml-[var(--spacing-1)] pl-[var(--spacing-4)] border-l border-[var(--surface-border)]"
        >
          <div
            v-for="env in ds.environments"
            :key="env.name"
            class="flex flex-col gap-[var(--spacing-2)]"
            :data-testid="`release-composition__impact-env-${env.name}`"
          >
            <div class="flex items-center gap-[var(--spacing-2)]">
              <span class="flex-1 text-body-xs text-[var(--text-color)]">{{ env.name }}</span>
              <span class="ml-auto text-body-xxs text-[var(--text-color-secondary)]"
                >{{ env.wlCount }} workloads</span
              >
            </div>

            <div
              class="flex flex-col ml-[var(--spacing-1)] pl-[var(--spacing-4)] border-l border-[var(--surface-border)]"
            >
              <div
                v-for="row in env.rows"
                :key="row.name"
                class="flex items-center gap-[var(--spacing-2)] border-t border-[var(--surface-border)] py-[var(--spacing-1)]"
                :data-testid="`release-composition__impact-row-${row.name}`"
              >
                <i class="ai ai-workloads text-[var(--text-color-secondary)]" />
                <span class="flex-1 text-body-xs text-[var(--text-color)]">{{ row.name }}</span>
                <span class="ml-auto text-body-xxs text-[var(--text-color-secondary)]"
                  >{{ row.domains }} domains</span
                >
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="ml-[var(--spacing-1)] pl-[var(--spacing-4)] border-l border-[var(--surface-border)] py-[var(--spacing-1)] text-body-xxs text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__impact-ds-empty-${ds.name}`"
        >
          No workloads are bound to this Deployment Settings yet.
        </div>
      </div>

      <div
        class="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-3)] rounded-[var(--shape-card)] border border-[var(--surface-border)] bg-[var(--surface-50)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
        data-testid="release-composition__impact-summary"
      >
        <i class="pi pi-info-circle text-[var(--text-color-secondary)]" />
        <p class="text-body-xs text-[var(--text-color-secondary)]">
          Routes
          <strong class="font-semibold text-[var(--text-color)]"
            >{{ impact.totals.totalDomains }} domains</strong
          >
          across
          <strong class="font-semibold text-[var(--text-color)]"
            >{{ impact.totals.totalWorkloads }} workloads</strong
          >
          in
          <strong class="font-semibold text-[var(--text-color)]"
            >{{ impact.totals.dsCount }} Deployment Settings</strong
          >.
        </p>
      </div>
    </div>
  </section>
</template>
