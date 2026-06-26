<script setup>
  /**
   * DeploymentSettingsPicker — presentational multi-select list of Deployment
   * Settings (the atomic deploy unit) with search and a selected counter. It
   * does not fetch, filter, derive or resolve anything: `deployments` arrive
   * already enriched from the composable, `query` is owned by the parent, and
   * selection is a plain array of ids surfaced through `modelValue`.
   *
   * A Deployment Setting row never fabricates data: the Environment name and
   * the "{N} Workloads affected" line are rendered only when the platform
   * actually provides them (`environmentName` / `workloadsCount`); otherwise
   * they are omitted (req 4.3).
   *
   * @prop {Array<{ id, name, policyLabel, environmentName?, workloadsCount? }>} deployments
   *   The Deployment Settings to list. `environmentName` and `workloadsCount`
   *   are optional and rendered only when present.
   * @prop {Array<string|number>} modelValue Selected Deployment Setting ids.
   * @prop {string} query Search string (owned by the parent).
   *
   * @emits update:modelValue When the selection changes.
   * @emits update:query When the search string changes.
   * @emits bind-environment When the empty-state action is triggered.
   */
  import { computed } from 'vue'
  import Checkbox from '@aziontech/webkit/checkbox'
  import InputText from '@aziontech/webkit/inputtext'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'release-deployment-settings-picker' })

  const props = defineProps({
    deployments: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: Array,
      default: () => []
    },
    query: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['update:modelValue', 'update:query', 'bind-environment'])

  const selectedIds = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const searchTerm = computed({
    get: () => props.query,
    set: (value) => emit('update:query', value)
  })

  const total = computed(() => props.deployments.length)
  const selectedCount = computed(() => props.modelValue.length)

  const searchPlaceholder = computed(() => `Search ${total.value} Deployment Settings`)

  const hasDeployments = computed(() => total.value > 0)
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-3)]"
    data-testid="release-composition__ds-picker"
  >
    <div
      class="flex flex-col gap-[var(--spacing-1)]"
      data-testid="release-composition__ds-label"
    >
      <label
        class="flex items-center gap-[var(--spacing-1)] text-body-sm font-semibold text-[var(--text-color-secondary)]"
      >
        Deployment Settings
        <span
          class="text-[var(--color-orange-500)]"
          aria-hidden="true"
          >*</span
        >
      </label>
      <span
        class="text-body-xs text-[var(--text-color-secondary)]"
        data-testid="release-composition__ds-helper"
      >
        Pick the Deployment Settings to publish into. A DS is the atomic unit — selecting it affects
        <strong class="font-bold text-[var(--text-color)]">all</strong> Environments &amp; Workloads
        bound to it (shown on the right).
      </span>
    </div>

    <div
      v-if="hasDeployments"
      class="flex flex-wrap items-center gap-[var(--spacing-3)]"
    >
      <span class="p-input-icon-left flex-1 min-w-[var(--container-3xs)]">
        <i class="pi pi-search text-[var(--text-color-secondary)]" />
        <InputText
          v-model="searchTerm"
          :placeholder="searchPlaceholder"
          class="w-full"
          data-testid="release-composition__ds-search"
        />
      </span>
      <span
        class="text-body-xs text-[var(--text-color-secondary)]"
        data-testid="release-composition__ds-selected-counter"
      >
        {{ selectedCount }} selected
      </span>
    </div>

    <div
      v-if="hasDeployments"
      class="flex flex-col gap-[var(--spacing-3)] overflow-y-auto max-h-[var(--container-xs)] pr-[var(--spacing-1)]"
      data-testid="release-composition__ds-list"
    >
      <label
        v-for="ds in deployments"
        :key="ds.id"
        class="flex cursor-pointer items-start gap-[var(--spacing-3)] rounded-[var(--shape-card)] border px-[var(--spacing-4)] py-[var(--spacing-4)] transition-colors"
        :class="
          selectedIds.includes(ds.id)
            ? 'border-[var(--border-selected)] bg-[var(--surface-50)]'
            : 'border-[var(--surface-border)]'
        "
        :data-testid="`release-composition__ds-row-${ds.id}`"
      >
        <Checkbox
          v-model="selectedIds"
          :value="ds.id"
          :inputId="`release-composition__ds-checkbox-${ds.id}`"
          :data-testid="`release-composition__ds-checkbox-${ds.id}`"
        />
        <div class="flex flex-1 flex-col gap-[var(--spacing-1)]">
          <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
            <i class="pi pi-send text-[var(--text-color-secondary)]" />
            <span class="text-body-sm text-[var(--text-color)]">{{ ds.name }}</span>
            <span
              v-if="ds.environmentName"
              class="text-body-sm font-bold text-[var(--text-color)]"
              :data-testid="`release-composition__ds-environment-${ds.id}`"
            >
              {{ ds.environmentName }}
            </span>
          </span>
          <span
            v-if="ds.workloadsCount != null"
            class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
            :data-testid="`release-composition__ds-workloads-${ds.id}`"
          >
            <i class="pi pi-globe text-[length:inherit]" />
            {{ ds.workloadsCount }} Workloads affected
          </span>
        </div>
        <span
          class="inline-flex shrink-0 items-center self-start rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__ds-policy-${ds.id}`"
        >
          {{ ds.policyLabel }}
        </span>
      </label>
    </div>

    <div
      v-else
      class="flex flex-col gap-[var(--spacing-3)]"
      data-testid="release-composition__ds-empty"
    >
      <InlineMessage severity="secondary">No Deployment Settings</InlineMessage>
      <PrimeButton
        label="Bind Environment"
        icon="pi pi-external-link"
        iconPos="right"
        size="small"
        outlined
        class="self-start"
        data-testid="release-composition__ds-bind-environment"
        @click="emit('bind-environment')"
      />
    </div>
  </div>
</template>
