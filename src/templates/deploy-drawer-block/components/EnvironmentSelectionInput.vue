<script setup>
  /**
   * EnvironmentSelectionInput — dumb/presentational selection input rendering N
   * selectable radio cards (one RadioButton per binding, all sharing the same
   * `name`). Each card shows the environment name, its policy and a "consome"
   * badge, plus the bound deployment (strategy) with workload count and the
   * active release. It does not fetch, filter or resolve anything —
   * `environments` arrive already derived/enriched from the composable.
   */
  import RadioButton from '@aziontech/webkit/radiobutton'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import PrimeButton from '@aziontech/webkit/button'
  import LabelBlock from '@aziontech/webkit/label'

  defineOptions({ name: 'deploy-drawer-environment-selection-input' })

  defineProps({
    modelValue: {
      type: String,
      default: null
    },
    environments: {
      type: Array,
      default: () => []
    },
    workloadName: {
      type: String,
      default: ''
    },
    resourceName: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue', 'bind'])

  const onSelect = (value) => emit('update:modelValue', value)
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-3)]"
    data-testid="deploy-drawer__environment-selection"
  >
    <LabelBlock
      label="Environment"
      isRequired
    />
    <span class="text-body-xs text-[var(--text-color-secondary)] -mt-2">
      Environments of {{ workloadName }}. The Deployment bound to each one is the strategy that runs
      the Release.
    </span>

    <div
      v-if="!loading && environments.length === 0"
      class="flex items-start gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
      data-testid="deploy-drawer__environment-empty"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-ground)]"
      >
        <i class="pi pi-link text-[var(--text-color-secondary)]" />
      </span>
      <div class="flex flex-1 flex-col gap-[var(--spacing-2)]">
        <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
          <span class="text-body-sm font-medium text-[var(--text-color)]"
            >No Environment bound</span
          >
          <PrimeTag
            severity="warning"
            value="Action needed"
          />
        </span>
        <span class="text-body-xs text-[var(--text-color-secondary)]">
          <b>{{ workloadName }}</b> has no Environment tied to a Deployment, so there's no strategy
          to run this release.
        </span>
        <div
          class="flex flex-wrap items-center justify-between gap-[var(--spacing-2)] pt-[var(--spacing-1)]"
        >
          <span class="text-body-xs text-[var(--text-color-secondary)]">
            Bind an Environment to a Deployment in the Workload settings, then publish.
          </span>
          <PrimeButton
            label="Bind Environment"
            icon="pi pi-external-link"
            iconPos="right"
            size="small"
            outlined
            data-testid="deploy-drawer__environment-bind"
            @click="emit('bind')"
          />
        </div>
      </div>
    </div>

    <div
      v-for="env in environments"
      :key="env.id"
      class="flex items-start gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border px-[var(--spacing-4)] py-[var(--spacing-3)] transition-colors"
      :class="
        modelValue === env.id
          ? 'border-[var(--border-selected)] bg-[var(--surface-section)]'
          : 'border-[var(--surface-border)]'
      "
      :data-testid="`deploy-drawer__environment-card-${env.id}`"
    >
      <RadioButton
        :inputId="`deploy-drawer-environment-${env.id}`"
        name="deploy-drawer-environment"
        :value="env.id"
        :modelValue="modelValue"
        @update:modelValue="onSelect"
      />
      <label
        :for="`deploy-drawer-environment-${env.id}`"
        class="flex flex-1 flex-col gap-[6px] cursor-pointer"
      >
        <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
          <i class="pi pi-server text-[var(--text-color-secondary)]" />
          <span class="text-body-sm font-medium text-[var(--text-color)]">{{ env.name }}</span>
          <span
            v-if="env.policyLabel"
            class="inline-flex items-center rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-2)] py-[2px] text-body-xs text-[var(--text-color-secondary)]"
          >
            {{ env.policyLabel }}
          </span>
          <span
            v-if="env.consumes && resourceName"
            class="inline-flex items-center rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-2)] py-[2px] text-body-xs text-[var(--text-color-secondary)]"
          >
            consumes {{ resourceName }}
          </span>
        </span>
        <span class="text-body-xs text-[var(--text-color-secondary)]">
          Deployment (strategy) {{ env.deploymentName }}
          <template v-if="env.workloadCount != null">
            · <i class="pi pi-globe" /> {{ env.workloadCount }} Workloads
          </template>
        </span>
        <span
          v-if="env.activeReleaseName"
          class="text-body-xs text-[var(--text-color-secondary)]"
        >
          <i class="pi pi-tag" /> Active release: {{ env.activeReleaseName }}
        </span>
      </label>
    </div>
  </div>
</template>
