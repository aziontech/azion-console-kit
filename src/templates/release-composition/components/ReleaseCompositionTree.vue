<script setup>
  /**
   * ReleaseCompositionTree — the full-page "Review & deploy" composition renderer
   * (matches the authoritative `vue-preview.html` `resources` renderer). It is the
   * page-owned alternative to the drawer's `ReleaseCompositionField`: same shared
   * LEAVES (`LazyResourceSelectField`, `ResourceVersionField`, `ReleaseDependenciesSection`)
   * but the uniform-card tree structure of the new screen.
   *
   * Presentational only: every value comes in through `resources`, every mutation
   * flows back out as an event. No fetching, no derivation, no business logic — the
   * view builds the `resources` view-model from the store + composable and reacts to
   * the events here.
   *
   * Each entry of `resources` is:
   *   {
   *     type, label, icon,
   *     required,        // application — shows a "Required" tag, no toggle
   *     readonly,        // deploy case locks it — selectors render disabled + lock hint
   *     canToggle,       // optional, non-scoped — header ToggleSwitch (orange when on)
   *     enabled,         // included in the release
   *     name,            // selected resource id (singleton)
   *     version,         // selected version (LATEST sentinel | pinned id)
   *     nameService,     // (params) => { body, count } for LazyResourceSelectField
   *     nameLoadService, // (id) => { id, name } — resolves a pre-selected label
   *     versionOptions,  // version picker options for ResourceVersionField
   *     isLoadingVersions,
   *     lockReason,      // text for the read-only row
   *     hasOwned,        // render the nested Dependencies block
   *     ownedCollections, // collections for ReleaseDependenciesSection
   *     dependenciesLoading, // this card's own dependency discovery is in flight
   *     dependenciesLoadingMessage // text shown below the "Dependencies" title while loading
   *   }
   *
   * @event toggle(type)                       — flip an optional singleton on/off.
   * @event update:resource({ type, value })   — pick the singleton resource instance.
   * @event update:version({ type, value })    — pick the singleton version.
   * @event toggle-group({ type, group })      — collapse/expand a dependency group.
   * @event add-instance({ type, group })      — append a blank dependency instance.
   * @event update:instance-resource({ type, group, id, value })
   * @event update:instance-version({ type, group, id, value })
   * @event remove-instance({ type, group, id })
   */
  import InputSwitch from '@aziontech/webkit/inputswitch'

  import LazyResourceSelectField from '@/templates/release-composition/components/LazyResourceSelectField.vue'
  import ResourceVersionField from '@/templates/release-composition/components/ResourceVersionField.vue'
  import ReleaseDependenciesSection from '@/templates/release-composition/components/ReleaseDependenciesSection.vue'

  defineOptions({ name: 'release-composition-tree' })

  defineProps({
    resources: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits([
    'toggle',
    'update:resource',
    'update:version',
    'toggle-group',
    'add-instance',
    'update:instance-resource',
    'update:instance-version',
    'remove-instance'
  ])

  const onToggle = (type) => emit('toggle', type)
  const onResource = (type, value) => emit('update:resource', { type, value })
  const onVersion = (type, value) => emit('update:version', { type, value })

  // Re-tag the nested ReleaseDependenciesSection events with the owning parent
  // singleton `type` so the view's store mutations stay unambiguous per card.
  const onToggleGroup = (type, group) => emit('toggle-group', { type, group })
  const onAddInstance = (type, group) => emit('add-instance', { type, group })
  const onInstanceResource = (type, payload) =>
    emit('update:instance-resource', {
      type,
      group: payload.type,
      id: payload.id,
      value: payload.value
    })
  const onInstanceVersion = (type, payload) =>
    emit('update:instance-version', {
      type,
      group: payload.type,
      id: payload.id,
      value: payload.value
    })
  const onRemoveInstance = (type, payload) =>
    emit('remove-instance', { type, group: payload.type, id: payload.id })
</script>

<template>
  <div
    class="flex flex-col gap-[var(--spacing-4)]"
    data-testid="release-composition__tree"
  >
    <div
      v-for="resource in resources"
      :key="resource.type"
      class="flex flex-col gap-[var(--spacing-4)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-4)] py-[var(--spacing-5)]"
      :data-testid="`release-composition__card-${resource.type}`"
    >
      <div class="flex items-center gap-[var(--spacing-2)]">
        <i
          :class="[
            resource.icon,
            '-ml-[2px] shrink-0 text-body-md text-[var(--text-color-secondary)]'
          ]"
        />
        <span class="flex-1 text-body-sm font-semibold text-[var(--text-color)]">
          {{ resource.label }}
        </span>

        <span
          v-if="resource.required"
          class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--primary-mask)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm font-medium text-[var(--text-primary)]"
          :data-testid="`release-composition__tag-required-${resource.type}`"
        >
          Required
        </span>
        <span
          v-else-if="resource.readonly"
          class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__tag-readonly-${resource.type}`"
        >
          <i class="pi pi-lock" /> Read-only
        </span>
        <InputSwitch
          v-else-if="resource.canToggle"
          :model-value="resource.enabled"
          :input-id="`release-composition__toggle-input-${resource.type}`"
          :data-testid="`release-composition__toggle-${resource.type}`"
          :aria-label="`Include ${resource.label} in this release`"
          @update:model-value="onToggle(resource.type)"
        />
      </div>

      <div
        v-if="resource.enabled"
        class="flex flex-col gap-[var(--spacing-2)]"
      >
        <div
          class="flex w-full gap-[var(--spacing-3)]"
          :data-testid="`release-composition__fields-${resource.type}`"
        >
          <LazyResourceSelectField
            :model-value="resource.name"
            :service="resource.nameService"
            :load-service="resource.nameLoadService"
            :disabled="resource.readonly"
            label="Resource"
            :placeholder="`Select ${resource.label}`"
            :required="resource.required"
            @update:model-value="onResource(resource.type, $event)"
          />
          <ResourceVersionField
            :model-value="resource.version"
            :versions="resource.versionOptions"
            :show-resource="false"
            :required="resource.required"
            :loading="resource.isLoadingVersions"
            :disabled="resource.readonly || resource.isLoadingVersions"
            :build-route="resource.buildRoute"
            :resource-label="resource.label"
            @update:model-value="onVersion(resource.type, $event)"
          />
        </div>
        <p
          v-if="resource.readonly"
          class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
          :data-testid="`release-composition__readonly-${resource.type}`"
        >
          <i class="pi pi-lock" /> {{ resource.lockReason }}
        </p>
      </div>

      <p
        v-else
        class="text-body-xs text-[var(--text-color-secondary)]"
        :data-testid="`release-composition__not-included-${resource.type}`"
      >
        Not included in this release.
      </p>

      <ReleaseDependenciesSection
        v-if="resource.hasOwned"
        class="border-t border-[var(--surface-border)] pt-[var(--spacing-4)]"
        :collections="resource.ownedCollections"
        :loading="resource.dependenciesLoading"
        :loading-message="resource.dependenciesLoadingMessage"
        :data-testid="`release-composition__deps-${resource.type}`"
        @toggle-group="onToggleGroup(resource.type, $event)"
        @add-instance="onAddInstance(resource.type, $event)"
        @update:instance-resource="onInstanceResource(resource.type, $event)"
        @update:instance-version="onInstanceVersion(resource.type, $event)"
        @remove-instance="onRemoveInstance(resource.type, $event)"
      />
    </div>
  </div>
</template>
