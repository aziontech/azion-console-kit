<script setup>
  /**
   * ReleaseCompositionField — renders the generic Release composition: an
   * Application card (editable | read-only | no-application), an optional scoped
   * resource card (when the scoped type is not the application) and the carried
   * read-only resources of the active Release. Presentational only: every value
   * comes from the composable; selection flows back through v-model events.
   */
  import LabelBlock from '@aziontech/webkit/label'
  import PrimeButton from '@aziontech/webkit/button'

  import ResourceVersionField from '@/templates/deploy-drawer-block/components/ResourceVersionField.vue'
  import ResourceSelectField from '@/templates/deploy-drawer-block/components/ResourceSelectField.vue'
  import { resolveResourceMeta } from '@/services/v2/deployment/deployment-adapter'

  defineOptions({ name: 'deploy-drawer-release-composition-field' })

  defineProps({
    deploymentName: {
      type: String,
      default: ''
    },
    noApplication: {
      type: Boolean,
      default: false
    },
    applicationReadOnly: {
      type: Boolean,
      default: false
    },
    activeReleaseApplication: {
      type: Object,
      default: null
    },
    applicationName: {
      type: String,
      default: null
    },
    applicationOptions: {
      type: Array,
      default: () => []
    },
    isLoadingApplications: {
      type: Boolean,
      default: false
    },
    selectedApplicationId: {
      type: [String, Number],
      default: null
    },
    applicationVersions: {
      type: Array,
      default: () => []
    },
    isLoadingApplicationVersions: {
      type: Boolean,
      default: false
    },
    selectedApplicationVersionId: {
      type: String,
      default: null
    },
    isScopedApplication: {
      type: Boolean,
      default: false
    },
    scopedType: {
      type: String,
      default: null
    },
    resourceName: {
      type: String,
      default: ''
    },
    versionOptions: {
      type: Array,
      default: () => []
    },
    selectedVersionId: {
      type: String,
      default: null
    },
    readOnlyResources: {
      type: Array,
      default: () => []
    },
    invalid: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits([
    'update:selectedApplicationId',
    'update:selectedApplicationVersionId',
    'update:selectedVersionId',
    'create-application'
  ])
</script>

<template>
  <div
    class="flex flex-col gap-4"
    data-testid="deploy-drawer__composition"
  >
    <div class="flex flex-col gap-1">
      <LabelBlock label="Release composition" />
      <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
        A Release binds one Resource Version of each type configured in
        <span class="font-medium">{{ deploymentName }}</span
        >.
      </span>
    </div>

    <!-- Scoped resource card — the context resource being deployed: always on top. -->
    <div
      v-if="!isScopedApplication"
      class="flex flex-col gap-4 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-4"
      data-testid="deploy-drawer__composition-scoped"
    >
      <span class="flex items-center gap-2">
        <i :class="[resolveResourceMeta(scopedType).icon, 'text-[var(--text-color)]']" />
        <span class="text-sm font-medium text-[var(--text-color)]">
          {{ resolveResourceMeta(scopedType).label }}
        </span>
      </span>

      <ResourceVersionField
        :model-value="selectedVersionId"
        :resource-name="resourceName"
        :versions="versionOptions"
        :invalid="invalid"
        @update:model-value="emit('update:selectedVersionId', $event)"
      />
    </div>

    <!-- Application card — no application available: deploy is blocked. -->
    <div
      v-if="noApplication"
      class="flex flex-col gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-4"
      data-testid="deploy-drawer__composition-no-application"
    >
      <span class="flex items-center gap-2">
        <i :class="[resolveResourceMeta('application').icon, 'text-[var(--text-color)]']" />
        <span class="text-sm font-medium text-[var(--text-color)]">Application</span>
      </span>
      <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
        No Application available. A Release must include an Application. Create one to continue.
      </span>
      <PrimeButton
        label="Create Application"
        icon="pi pi-plus"
        size="small"
        outlined
        class="self-start"
        data-testid="deploy-drawer__create-application"
        @click="emit('create-application')"
      />
    </div>

    <!-- Application card — read-only (Single + active release): pinned to the live Application. -->
    <div
      v-else-if="applicationReadOnly"
      class="flex flex-col gap-3 rounded-md border border-[var(--surface-border)] px-4 py-4"
      data-testid="deploy-drawer__composition-application-readonly"
    >
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <i :class="[resolveResourceMeta('application').icon, 'text-[var(--text-color)]']" />
          <span class="text-sm font-medium text-[var(--text-color)]">Application</span>
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-md bg-[var(--surface-section)] px-2 py-0.5 text-xs text-[var(--text-color-secondary)]"
        >
          <i class="pi pi-lock" /> Read-only
        </span>
      </div>

      <div
        class="flex items-center justify-between gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-ground)] px-3 py-2"
      >
        <span class="text-sm text-[var(--text-color)] truncate">
          {{ applicationName ?? activeReleaseApplication?.resourceVersion ?? '—' }}
        </span>
        <span
          v-if="applicationName"
          class="font-mono text-xs text-[var(--text-color-secondary)] shrink-0"
        >
          {{ activeReleaseApplication?.resourceVersion }}
        </span>
      </div>

      <span
        class="flex items-center gap-1 text-xs text-[var(--text-color-secondary)] leading-tight"
      >
        <i class="pi pi-lock" /> Active release
      </span>
    </div>

    <!-- Application card — editable: pick the Application and its Ready version.
         When the scoped resource IS the application, it is the one being
         deployed, so the card is highlighted. -->
    <div
      v-else
      class="flex flex-col gap-4 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-4"
      data-testid="deploy-drawer__composition-application"
    >
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <i :class="[resolveResourceMeta('application').icon, 'text-[var(--text-color)]']" />
          <span class="text-sm font-medium text-[var(--text-color)]">Application</span>
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-xs text-[var(--text-color-secondary)]"
          data-testid="deploy-drawer__composition-required"
        >
          Required
        </span>
      </div>

      <!-- When the scoped resource IS the application, only the version picker is
           shown (the resource name is fixed); otherwise pick from the catalog. -->
      <ResourceSelectField
        v-if="!isScopedApplication"
        :model-value="selectedApplicationId"
        :options="applicationOptions"
        :loading="isLoadingApplications"
        label="Application"
        placeholder="Select an Application"
        @update:model-value="emit('update:selectedApplicationId', $event)"
      />

      <ResourceVersionField
        :model-value="isScopedApplication ? selectedVersionId : selectedApplicationVersionId"
        :resource-name="isScopedApplication ? resourceName : ''"
        :show-resource="isScopedApplication"
        :versions="applicationVersions"
        :disabled="isLoadingApplicationVersions"
        :invalid="invalid"
        @update:model-value="
          emit(
            isScopedApplication
              ? 'update:selectedVersionId'
              : 'update:selectedApplicationVersionId',
            $event
          )
        "
      />
    </div>

    <!-- Read-only cards — resources carried over from the active Release. -->
    <div
      v-for="entry in readOnlyResources"
      :key="`${entry.resourceType}:${entry.resourceId}`"
      class="flex flex-col gap-3 rounded-md border border-[var(--surface-border)] px-4 py-4"
      :data-testid="`deploy-drawer__composition-keep-${entry.resourceType}-${entry.resourceId}`"
    >
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-2">
          <i :class="[resolveResourceMeta(entry.resourceType).icon, 'text-[var(--text-color)]']" />
          <span class="text-sm font-medium text-[var(--text-color)]">
            {{ resolveResourceMeta(entry.resourceType).label }}
          </span>
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-md bg-[var(--surface-section)] px-2 py-0.5 text-xs text-[var(--text-color-secondary)]"
        >
          <i class="pi pi-lock" /> Read-only
        </span>
      </div>

      <div
        class="flex items-center justify-between gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-ground)] px-3 py-2"
      >
        <span class="text-sm text-[var(--text-color)] truncate">
          {{ entry.resourceName ?? entry.resourceId }}
        </span>
        <span class="font-mono text-xs text-[var(--text-color-secondary)] shrink-0">
          {{ entry.resourceVersion }}
        </span>
      </div>

      <span
        class="flex items-center gap-1 text-xs text-[var(--text-color-secondary)] leading-tight"
      >
        <i class="pi pi-lock" /> Active release
      </span>
    </div>

    <!-- Footer note — scope of the Release. -->
    <div
      class="flex items-start gap-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-3 py-2 text-xs text-[var(--text-color-secondary)] leading-tight"
      data-testid="deploy-drawer__composition-note"
    >
      <i class="pi pi-info-circle mt-0.5" />
      <span>Only the resources above are part of this Release.</span>
    </div>

    <PrimeButton
      label="Add resource"
      icon="pi pi-plus"
      size="small"
      text
      disabled
      class="self-start"
      data-testid="deploy-drawer__composition-add-resource"
    />
  </div>
</template>
