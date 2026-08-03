<script setup>
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
    groups: {
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
    },
    isLoadingMeta: {
      type: Boolean,
      default: false
    },
    metaUnavailable: {
      type: Boolean,
      default: false
    }
  })

  const MAX_ENV_TAGS = 3

  const visibleEnvNames = (ds) => (ds.environmentNames ?? []).slice(0, MAX_ENV_TAGS)
  const remainingEnvNames = (ds) => (ds.environmentNames ?? []).slice(MAX_ENV_TAGS)
  const extraEnvCount = (ds) => remainingEnvNames(ds).length
  const hasWorkloads = (ds) => Number.isFinite(ds.workloadsCount) && ds.workloadsCount > 0
  const workloadsLabel = (ds) =>
    `${ds.workloadsCount} ${ds.workloadsCount === 1 ? 'Workload' : 'Workloads'} affected`

  const emit = defineEmits([
    'update:modelValue',
    'update:query',
    'bind-environment',
    'group-action'
  ])

  const selectedIds = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const toggle = (id) => {
    const isSelected = props.modelValue.some((item) => String(item) === String(id))
    selectedIds.value = isSelected
      ? props.modelValue.filter((item) => String(item) !== String(id))
      : [...props.modelValue, id]
  }

  const searchTerm = computed({
    get: () => props.query,
    set: (value) => emit('update:query', value)
  })

  const visibleGroups = computed(() =>
    props.groups.filter((group) => group.deployments && group.deployments.length > 0)
  )

  const hasGroups = computed(() => visibleGroups.value.length > 0)

  const listedDeployments = computed(() =>
    hasGroups.value ? visibleGroups.value.flatMap((group) => group.deployments) : props.deployments
  )

  const selectableListed = computed(() =>
    hasGroups.value
      ? visibleGroups.value
          .filter((group) => group.selectable !== false)
          .flatMap((group) => group.deployments)
      : props.deployments
  )

  const total = computed(() => listedDeployments.value.length)
  const selectedCount = computed(() => props.modelValue.length)

  const searchPlaceholder = computed(() => `Search ${total.value} Deployment Settings`)

  const hasDeployments = computed(() => total.value > 0)
  const hasSelectable = computed(() => selectableListed.value.length > 0)

  const sections = computed(() =>
    hasGroups.value
      ? visibleGroups.value.map((group) => ({
          key: group.key,
          label: group.label,
          selectable: group.selectable !== false,
          notice: group.notice ?? null,
          action: group.action ?? null,
          deployments: group.deployments
        }))
      : [
          {
            key: null,
            label: null,
            selectable: true,
            notice: null,
            action: null,
            deployments: props.deployments
          }
        ]
  )

  const isSelected = (id) => props.modelValue.some((item) => String(item) === String(id))

  const allSelected = computed(
    () =>
      hasSelectable.value && selectableListed.value.every((deployment) => isSelected(deployment.id))
  )

  const selectAll = () => {
    const listedToAdd = selectableListed.value
      .map((deployment) => deployment.id)
      .filter((id) => !isSelected(id))
    selectedIds.value = [...props.modelValue, ...listedToAdd]
  }

  const clearAll = () => {
    const listedIds = new Set(selectableListed.value.map((deployment) => String(deployment.id)))
    selectedIds.value = props.modelValue.filter((item) => !listedIds.has(String(item)))
  }
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
      <span class="flex items-center gap-[var(--spacing-2)]">
        <PrimeButton
          label="Select all"
          link
          size="small"
          :disabled="allSelected || !hasSelectable"
          data-testid="release-composition__ds-select-all"
          @click="selectAll"
        />
        <PrimeButton
          label="Clear all"
          link
          size="small"
          :disabled="selectedCount === 0"
          data-testid="release-composition__ds-clear-all"
          @click="clearAll"
        />
      </span>
    </div>

    <div
      v-if="hasDeployments"
      class="flex flex-col gap-[var(--spacing-3)] overflow-y-auto max-h-[var(--container-md)] pr-[var(--spacing-1)]"
      data-testid="release-composition__ds-list"
    >
      <template
        v-for="section in sections"
        :key="section.key ?? '__flat'"
      >
        <span
          v-if="section.label"
          class="text-body-xs font-semibold text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__ds-group-${section.key}`"
        >
          {{ section.label }}
        </span>
        <div
          v-for="ds in section.selectable ? section.deployments : []"
          :key="ds.id"
          role="checkbox"
          :aria-checked="selectedIds.includes(ds.id)"
          :aria-label="ds.name"
          tabindex="0"
          class="flex cursor-pointer items-start gap-[var(--spacing-3)] rounded-[var(--shape-card)] border px-[var(--spacing-4)] py-[var(--spacing-4)] transition-colors"
          :class="
            selectedIds.includes(ds.id)
              ? 'border-[var(--border-selected)] bg-[var(--surface-50)]'
              : 'border-[var(--surface-border)]'
          "
          :data-testid="`release-composition__ds-row-${ds.id}`"
          @click="toggle(ds.id)"
          @keydown.enter.prevent="toggle(ds.id)"
          @keydown.space.prevent="toggle(ds.id)"
        >
          <Checkbox
            :modelValue="selectedIds.includes(ds.id)"
            binary
            tabindex="-1"
            class="pointer-events-none"
            :inputId="`release-composition__ds-checkbox-${ds.id}`"
            :data-testid="`release-composition__ds-checkbox-${ds.id}`"
          />
          <div class="flex flex-1 flex-col gap-[var(--spacing-1)]">
            <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
              <i class="ai ai-deploy-pillar text-[var(--text-color-secondary)]" />
              <span class="text-body-sm text-[var(--text-color)]">{{ ds.name }}</span>

              <span
                v-if="!isLoadingMeta && visibleEnvNames(ds).length"
                class="flex flex-wrap items-center gap-[var(--spacing-1)]"
                :data-testid="`release-composition__ds-envs-${ds.id}`"
              >
                <span
                  v-for="envName in visibleEnvNames(ds)"
                  :key="envName"
                  class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
                  :data-testid="`release-composition__ds-env-${ds.id}`"
                >
                  {{ envName }}
                </span>
                <span
                  v-if="extraEnvCount(ds) > 0"
                  v-tooltip.top="remainingEnvNames(ds).join(', ')"
                  tabindex="0"
                  role="button"
                  :aria-label="`${extraEnvCount(ds)} more Environments: ${remainingEnvNames(ds).join(', ')}`"
                  class="inline-flex cursor-default items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-selected)]"
                  :data-testid="`release-composition__ds-env-more-${ds.id}`"
                >
                  +{{ extraEnvCount(ds) }}
                </span>
              </span>
            </span>

            <div
              v-if="isLoadingMeta"
              class="flex flex-col gap-[var(--spacing-1)]"
              :data-testid="`release-composition__ds-meta-skeleton-${ds.id}`"
            >
              <span class="flex items-center gap-[var(--spacing-2)]">
                <span
                  class="inline-block h-[var(--spacing-4)] w-[var(--spacing-16)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] animate-pulse"
                />
                <span
                  class="inline-block h-[var(--spacing-4)] w-[var(--spacing-16)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] animate-pulse"
                />
              </span>
              <span
                class="inline-block h-[var(--spacing-3)] w-[var(--spacing-24)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] animate-pulse"
              />
            </div>

            <span
              v-else-if="hasWorkloads(ds)"
              class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
              :data-testid="`release-composition__ds-workloads-${ds.id}`"
            >
              <i class="ai ai-workloads" />
              {{ workloadsLabel(ds) }}
            </span>

            <span
              v-else-if="metaUnavailable"
              class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
              :data-testid="`release-composition__ds-workloads-unavailable-${ds.id}`"
            >
              <i class="ai ai-workloads" />
              Workloads impact unavailable
            </span>

            <span
              v-else
              class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
              :data-testid="`release-composition__ds-workloads-empty-${ds.id}`"
            >
              <i class="ai ai-workloads" />
              No workloads bound
            </span>
          </div>
          <span
            class="inline-flex shrink-0 items-center self-start rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
            :data-testid="`release-composition__ds-policy-${ds.id}`"
          >
            {{ ds.policyLabel }}
          </span>
        </div>

        <div
          v-for="ds in section.selectable ? [] : section.deployments"
          :key="`nonselectable-${section.key}-${ds.id}`"
          class="flex items-start gap-[var(--spacing-3)] rounded-[var(--shape-card)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-50)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
          :data-testid="`release-composition__ds-row-${ds.id}`"
        >
          <i
            class="pi pi-exclamation-circle mt-[var(--spacing-1)] text-[var(--text-color-secondary)]"
          />
          <div class="flex flex-1 flex-col gap-[var(--spacing-1)]">
            <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
              <i class="ai ai-deploy-pillar text-[var(--text-color-secondary)]" />
              <span class="text-body-sm text-[var(--text-color)]">{{ ds.name }}</span>
              <span
                class="inline-flex shrink-0 items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
                :data-testid="`release-composition__ds-policy-${ds.id}`"
              >
                {{ ds.policyLabel }}
              </span>
            </span>
            <span
              v-if="section.notice"
              class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
              :data-testid="`release-composition__ds-notice-${ds.id}`"
            >
              {{ section.notice }}
            </span>
          </div>
          <PrimeButton
            v-if="section.action"
            :label="section.action.label"
            :icon="section.action.icon"
            iconPos="right"
            link
            size="small"
            class="shrink-0 self-start"
            :data-testid="`release-composition__ds-action-${section.key}-${ds.id}`"
            @click="emit('group-action', { groupKey: section.key, dsId: ds.id })"
          />
        </div>
      </template>
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
