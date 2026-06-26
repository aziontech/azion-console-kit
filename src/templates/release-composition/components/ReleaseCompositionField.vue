<script setup>
  /**
   * ReleaseCompositionField — renders the generic Release composition: an
   * Application card (editable | read-only | no-application), an optional scoped
   * resource card (when the scoped type is not the application) and the carried
   * read-only resources of the active Release. Presentational only: every value
   * comes from the composable; selection flows back through v-model events.
   *
   * @slot dependencies — optional, scoped per parent resource card. Receives
   *   `{ resourceType }` so a surface (e.g. the full-page composer) can nest its
   *   owned dependencies inside the matching parent card (Application →
   *   Functions/Connectors; Edge Firewall → WAF/Network Lists). Surfaces that do
   *   not own dependencies (the legacy drawer) simply omit the slot and nothing
   *   is rendered — the field stays presentational and unforked.
   * @slot card-actions — optional, pinned to the RIGHT of each editable resource
   *   card header. Receives `{ resourceType }` so a surface can inject a control
   *   (e.g. the composer's "include in this release" toggle) without forking the
   *   field. When the slot is empty (the legacy drawer), the optional cards fall
   *   back to the neutral "Optional" tag and the header is unchanged.
   */
  import { useSlots } from 'vue'

  import LabelBlock from '@aziontech/webkit/label'
  import PrimeButton from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'

  import ResourceVersionField from '@/templates/release-composition/components/ResourceVersionField.vue'
  import ResourceSelectField from '@/templates/release-composition/components/ResourceSelectField.vue'
  import { resolveResourceMeta } from '@/services/v2/deployment/deployment-adapter'

  defineOptions({ name: 'release-composition-field' })

  // When a surface fills `#card-actions`, optional cards show that control
  // (the composer's header toggle) instead of the neutral "Optional" tag, so
  // the legacy drawer (no slot) keeps its tag and stays untouched.
  const slots = useSlots()
  const hasCardActions = () => Boolean(slots['card-actions'])

  defineProps({
    deploymentName: {
      type: String,
      default: ''
    },
    // When false, the field hides its own "Release composition" header + intro so
    // a surface (e.g. the full-page composer) can render a screen-specific intro
    // above it without duplication. Defaults to true so the legacy surface is
    // unchanged.
    showHeader: {
      type: Boolean,
      default: true
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
    hasScopedResource: {
      type: Boolean,
      default: true
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
    editableResources: {
      type: Array,
      default: () => []
    },
    invalid: {
      type: Boolean,
      default: false
    },
    isResolvingApplicationName: {
      type: Boolean,
      default: false
    },
    isResolvingReadOnlyNames: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits([
    'update:selectedApplicationId',
    'update:selectedApplicationVersionId',
    'update:selectedVersionId',
    'update:resourceId',
    'update:resourceVersion',
    'create-application'
  ])
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-4)]"
    data-testid="release-composition__composition"
  >
    <div
      v-if="showHeader"
      class="flex flex-col gap-[var(--spacing-1)]"
    >
      <LabelBlock label="Release composition" />
      <span class="text-body-xs text-[var(--text-color-secondary)]">
        A Release binds one Resource Version of each type configured in
        <span class="font-medium">{{ deploymentName }}</span
        >.
      </span>
    </div>

    <div
      v-if="hasScopedResource && !isScopedApplication"
      class="flex flex-col gap-[var(--spacing-4)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
      data-testid="release-composition__composition-scoped"
    >
      <span class="flex items-center gap-[var(--spacing-2)]">
        <i :class="[resolveResourceMeta(scopedType).icon, 'text-[var(--text-color)]']" />
        <span class="text-body-sm font-medium text-[var(--text-color)]">
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

    <div
      v-if="noApplication"
      class="flex flex-col gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
      data-testid="release-composition__composition-no-application"
    >
      <span class="flex items-center gap-[var(--spacing-2)]">
        <i :class="[resolveResourceMeta('application').icon, 'text-[var(--text-color)]']" />
        <span class="text-body-sm font-medium text-[var(--text-color)]">Application</span>
      </span>
      <span class="text-body-xs text-[var(--text-color-secondary)]">
        No Application available. A Release must include an Application. Create one to continue.
      </span>
      <PrimeButton
        label="Create Application"
        icon="pi pi-plus"
        size="small"
        outlined
        class="self-start"
        data-testid="release-composition__create-application"
        @click="emit('create-application')"
      />
    </div>

    <div
      v-else-if="applicationReadOnly"
      class="flex flex-col gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
      data-testid="release-composition__composition-application-readonly"
    >
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-[var(--spacing-2)]">
          <i :class="[resolveResourceMeta('application').icon, 'text-[var(--text-color)]']" />
          <span class="text-body-sm font-medium text-[var(--text-color)]">Application</span>
        </span>
        <span
          class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] bg-[var(--surface-section)] px-[var(--spacing-2)] py-[2px] text-body-xs text-[var(--text-color-secondary)]"
        >
          <i class="pi pi-lock" /> Read-only
        </span>
      </div>

      <div
        class="flex items-center justify-between gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-ground)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
      >
        <Skeleton
          v-if="isResolvingApplicationName && !applicationName"
          width="10rem"
          height="1rem"
        />
        <span
          v-else
          class="text-body-sm text-[var(--text-color)] truncate"
        >
          {{ applicationName ?? activeReleaseApplication?.resourceVersion ?? '—' }}
        </span>
        <span
          v-if="applicationName"
          class="font-mono text-body-xs text-[var(--text-color-secondary)] shrink-0"
        >
          {{ activeReleaseApplication?.resourceVersion }}
        </span>
      </div>

      <span
        class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
      >
        <i class="pi pi-lock" /> Active release
      </span>
    </div>

    <div
      v-else
      class="flex flex-col gap-[var(--spacing-4)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
      data-testid="release-composition__composition-application"
    >
      <div class="flex items-center justify-between gap-[var(--spacing-3)]">
        <span class="flex items-center gap-[var(--spacing-2)]">
          <span
            class="inline-flex h-[var(--spacing-7)] w-[var(--spacing-7)] items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-section)]"
          >
            <i :class="[resolveResourceMeta('application').icon, 'text-[var(--text-color)]']" />
          </span>
          <span class="text-body-sm font-semibold text-[var(--text-color)]">Application</span>
        </span>
        <span
          class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] border border-[var(--warning-border)] bg-[var(--warning)] px-[var(--spacing-2)] py-[2px] text-body-xs font-medium text-[var(--warning-contrast)]"
          data-testid="release-composition__composition-required"
        >
          Required
        </span>
      </div>

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

      <slot
        name="dependencies"
        resource-type="application"
      />
    </div>

    <template v-if="hasScopedResource">
      <div
        v-for="entry in readOnlyResources"
        :key="`${entry.resourceType}:${entry.resourceId}`"
        class="flex flex-col gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
        :data-testid="`release-composition__composition-keep-${entry.resourceType}-${entry.resourceId}`"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-[var(--spacing-2)]">
            <i
              :class="[resolveResourceMeta(entry.resourceType).icon, 'text-[var(--text-color)]']"
            />
            <span class="text-body-sm font-medium text-[var(--text-color)]">
              {{ resolveResourceMeta(entry.resourceType).label }}
            </span>
          </span>
          <span
            class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] bg-[var(--surface-section)] px-[var(--spacing-2)] py-[2px] text-body-xs text-[var(--text-color-secondary)]"
          >
            <i class="pi pi-lock" /> Read-only
          </span>
        </div>

        <div
          class="flex items-center justify-between gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-ground)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
        >
          <Skeleton
            v-if="isResolvingReadOnlyNames && !entry.resourceName"
            width="10rem"
            height="1rem"
          />
          <span
            v-else
            class="text-body-sm text-[var(--text-color)] truncate"
          >
            {{ entry.resourceName ?? entry.resourceId }}
          </span>
          <span class="font-mono text-body-xs text-[var(--text-color-secondary)] shrink-0">
            {{ entry.resourceVersion }}
          </span>
        </div>

        <span
          class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
        >
          <i class="pi pi-lock" /> Active release
        </span>
      </div>
    </template>
    <template v-else>
      <div
        v-for="resource in editableResources"
        :key="resource.key"
        class="flex flex-col gap-[var(--spacing-4)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-4)] py-[var(--spacing-4)]"
        :data-testid="`release-composition__composition-editable-${resource.resourceType}`"
      >
        <div class="flex items-center justify-between gap-[var(--spacing-3)]">
          <span class="flex items-center gap-[var(--spacing-2)]">
            <span
              class="inline-flex h-[var(--spacing-7)] w-[var(--spacing-7)] items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-section)]"
            >
              <i
                :class="[resolveResourceMeta(resource.resourceType).icon, 'text-[var(--text-color)]']"
              />
            </span>
            <span class="text-body-sm font-semibold text-[var(--text-color)]">
              {{ resolveResourceMeta(resource.resourceType).label }}
            </span>
          </span>
          <slot
            v-if="hasCardActions()"
            name="card-actions"
            :resource-type="resource.resourceType"
          />
          <span
            v-else-if="resource.optional"
            class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-2)] py-[2px] text-body-xs text-[var(--text-color-secondary)]"
            data-testid="release-composition__composition-optional"
          >
            Optional
          </span>
        </div>

        <p
          v-if="resource.optional && resource.enabled === false"
          class="text-body-sm text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__composition-disabled-${resource.resourceType}`"
        >
          Not included in this release.
        </p>

        <template v-else>
          <ResourceSelectField
            :model-value="resource.selectedId"
            :options="resource.options"
            :loading="resource.isLoadingOptions"
            :label="resolveResourceMeta(resource.resourceType).label"
            :placeholder="`Select a ${resolveResourceMeta(resource.resourceType).label}`"
            :required="!resource.optional"
            :clearable="resource.optional"
            @update:model-value="emit('update:resourceId', { key: resource.key, value: $event })"
          />

          <ResourceVersionField
            v-if="resource.versioned && resource.selectedId != null"
            :model-value="resource.selectedVersionId"
            :show-resource="false"
            :versions="resource.versionOptions"
            :disabled="resource.isLoadingVersions"
            :invalid="invalid"
            @update:model-value="emit('update:resourceVersion', { key: resource.key, value: $event })"
          />

          <slot
            name="dependencies"
            :resource-type="resource.resourceType"
          />
        </template>
      </div>
    </template>
  </div>
</template>
