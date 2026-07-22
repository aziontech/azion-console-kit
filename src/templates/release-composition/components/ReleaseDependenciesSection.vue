<script setup>
  /**
   * ReleaseDependenciesSection — presentational owned dependencies nested inside
   * a parent resource card (Application → Functions/Connectors; Firewall →
   * Network Lists/WAF). Renders one collapsible group per collection; each open
   * group lists its instances as a `LazyResourceSelectField` (instance) +
   * `ResourceVersionField` (version). Instances are usually seeded automatically
   * from their source (the application's function instances / the active release).
   * When `allowAdd` is set (the "Additional dependencies" section) each group also
   * renders an "Add" button so the user can append manual instances.
   *
   * Fully controlled: every value (including each group's `open` flag) comes
   * from props; all mutation flows back through events. No fetching, no
   * derivation, no business logic. The disable cascade (hiding the section when
   * the parent resource is toggled off) is the PARENT's responsibility via
   * `v-if`; this component only renders what it is given.
   *
   * @prop collections — array of `{ type, label, icon, count, open, instances }`
   *   where each instance is `{ id, resourceId, name, nameService, nameLoadService,
   *   version, versionOptions, locked?, required?, buildRoute?, sharedWith? }`. A
   *   `locked` instance is app-managed: its resource is fixed (rendered as a label,
   *   no dropdown) and it offers no remove. A `required` instance marks its version
   *   selector as required, and signals when no version is selectable (empty
   *   `versionOptions`); in that state it links to `buildRoute` (the dependency's
   *   edit page) so the user can build a Ready version for it. `sharedWith` is the
   *   list of OTHER parent labels that reference this same dependency instance —
   *   when non-empty the row shows a "Shared" badge + a hint, because the same
   *   Connector/Network List pins ONE version across every parent that uses it, so
   *   picking a version here also sets it there (and vice versa).
   * @event toggle-group(type) — request to collapse/expand a collection group.
   * @event update:instance-resource({ type, id, value }) — instance selection.
   * @event update:instance-version({ type, id, value }) — version selection.
   * @event remove-instance({ type, id }) — remove an instance from a group.
   * @event add-instance(type) — request to append a manual instance (allowAdd only).
   */
  import PrimeButton from '@aziontech/webkit/button'

  import LazyResourceSelectField from '@/templates/release-composition/components/LazyResourceSelectField.vue'
  import ResourceVersionField from '@/templates/release-composition/components/ResourceVersionField.vue'

  defineOptions({ name: 'release-dependencies-section' })

  defineProps({
    collections: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingMessage: {
      type: String,
      default: 'Detecting dependencies…'
    },
    allowAdd: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits([
    'toggle-group',
    'update:instance-resource',
    'update:instance-version',
    'remove-instance',
    'add-instance'
  ])

  const onToggleGroup = (type) => emit('toggle-group', type)

  const onAdd = (type) => emit('add-instance', type)

  const onResourceChange = (type, id, value) =>
    emit('update:instance-resource', { type, id, value })

  const onVersionChange = (type, id, value) => emit('update:instance-version', { type, id, value })

  const onRemove = (type, id) => emit('remove-instance', { type, id })
</script>

<template>
  <section
    class="flex flex-col gap-[var(--spacing-3)]"
    data-testid="release-composition__deps-section"
  >
    <span
      class="text-tag-sm uppercase text-[var(--text-color-secondary)]"
      data-testid="release-composition__deps-eyebrow"
    >
      Dependencies
    </span>

    <Transition name="deps-loading-fade">
      <div
        v-if="loading"
        class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
        data-testid="release-composition__deps-loading"
      >
        <i class="pi pi-spinner animate-spin motion-reduce:animate-none" />
        <span>{{ loadingMessage }}</span>
      </div>
    </Transition>

    <div
      class="flex flex-col gap-[var(--spacing-3)] ml-[var(--spacing-2)] border-l border-[var(--surface-border)] pl-[var(--spacing-3)]"
      data-testid="release-composition__deps-rail"
    >
      <div
        v-for="collection in collections"
        :key="collection.type"
        class="flex flex-col overflow-hidden rounded-[var(--shape-elements)] border border-[var(--surface-border)]"
        :data-testid="`release-composition__deps-group-${collection.type}`"
      >
        <div
          class="flex w-full items-center gap-[var(--spacing-2)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
        >
          <button
            type="button"
            class="flex flex-1 items-center gap-[var(--spacing-2)] text-left bg-transparent border-0 cursor-pointer min-w-0"
            :aria-expanded="collection.open"
            :data-testid="`release-composition__deps-group-header-${collection.type}`"
            @click="onToggleGroup(collection.type)"
          >
            <i
              :class="[collection.icon, 'shrink-0 text-body-md text-[var(--text-color-secondary)]']"
            />
            <span class="text-body-sm font-medium text-[var(--text-color)] truncate">{{
              collection.label
            }}</span>
          </button>
          <span
            class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
            :data-testid="`release-composition__deps-count-${collection.type}`"
          >
            {{ collection.count }}
          </span>
          <i
            :class="[
              'pi text-[var(--text-color-secondary)] transition-transform',
              collection.open ? 'pi-chevron-down' : 'pi-chevron-right'
            ]"
          />
        </div>

        <div
          class="[display:grid] transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none"
          :class="collection.open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
          :aria-hidden="!collection.open"
          :data-testid="`release-composition__deps-panel-${collection.type}`"
        >
          <div class="min-h-0 overflow-hidden">
            <div
              class="flex flex-col gap-[var(--spacing-2)] border-t border-[var(--surface-border)] p-[var(--spacing-3)]"
              :data-testid="`release-composition__deps-body-${collection.type}`"
            >
              <p
                v-if="!collection.instances.length"
                class="text-body-sm text-[var(--text-color-secondary)]"
                :data-testid="`release-composition__deps-empty-${collection.type}`"
              >
                No {{ collection.label }} instances in this release.
              </p>

              <template v-else>
                <div
                  v-for="instance in collection.instances"
                  :key="instance.id"
                  class="flex flex-col gap-[var(--spacing-2)]"
                  :data-testid="`release-composition__deps-row-${collection.type}-${instance.id}`"
                >
                  <div class="flex w-full items-end gap-[var(--spacing-3)]">
                    <div
                      v-if="instance.locked"
                      class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]"
                    >
                      <label
                        class="flex items-center gap-[var(--spacing-2)] text-body-sm font-medium text-[var(--text-color-secondary)]"
                      >
                        {{ collection.label }}
                        <span
                          v-if="instance.sharedWith && instance.sharedWith.length"
                          class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm font-normal text-[var(--text-color-secondary)]"
                          :data-testid="`release-composition__deps-shared-badge-${collection.type}-${instance.id}`"
                        >
                          <i class="pi pi-link" />
                          Shared
                        </span>
                      </label>
                      <div
                        class="flex justify-between items-center gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
                        :data-testid="`release-composition__deps-fixed-${collection.type}-${instance.id}`"
                      >
                        <span class="truncate">{{ instance.name }}</span>
                        <i class="pi pi-lock text-[var(--text-color-secondary)]" />
                      </div>
                    </div>
                    <LazyResourceSelectField
                      v-else
                      :modelValue="instance.resourceId"
                      :service="instance.nameService"
                      :load-service="instance.nameLoadService"
                      :label="collection.label"
                      :required="false"
                      :placeholder="`Select a ${collection.label}`"
                      @update:modelValue="onResourceChange(collection.type, instance.id, $event)"
                    />

                    <ResourceVersionField
                      :modelValue="instance.version"
                      :versions="instance.versionOptions"
                      :showResource="false"
                      label="Version"
                      :required="Boolean(instance.required)"
                      :disabled="instance.required && !instance.versionOptions.length"
                      @update:modelValue="onVersionChange(collection.type, instance.id, $event)"
                    />

                    <PrimeButton
                      v-if="!instance.locked"
                      type="button"
                      icon="pi pi-trash"
                      severity="secondary"
                      text
                      :aria-label="`Remove ${instance.name || collection.label} instance`"
                      class="shrink-0"
                      :data-testid="`release-composition__deps-remove-${collection.type}-${instance.id}`"
                      @click="onRemove(collection.type, instance.id)"
                    />
                  </div>

                  <div
                    v-if="instance.sharedWith && instance.sharedWith.length"
                    class="grid gap-[var(--spacing-3)]"
                    :class="
                      instance.locked
                        ? 'grid-cols-[1fr_1fr]'
                        : 'grid-cols-[1fr_1fr_var(--spacing-8)] max-[600px]:grid-cols-[1fr_1fr_auto]'
                    "
                  >
                    <span aria-hidden="true" />
                    <div
                      class="flex items-center mt-[var(--spacing-2)] gap-[var(--spacing-1)] text-body-xs text-[var(--text-color-secondary)]"
                      :data-testid="`release-composition__deps-shared-hint-${collection.type}-${instance.id}`"
                    >
                      <i class="pi pi-link" />
                      <span>
                        Shared with {{ instance.sharedWith.join(', ') }} — one version applies to
                        all.
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="instance.required && !instance.versionOptions.length"
                    class="grid gap-[var(--spacing-3)]"
                    :class="
                      instance.locked
                        ? 'grid-cols-[1fr_1fr]'
                        : 'grid-cols-[1fr_1fr_var(--spacing-8)] max-[600px]:grid-cols-[1fr_1fr_auto]'
                    "
                  >
                    <span aria-hidden="true" />
                    <div
                      class="flex items-center gap-[var(--spacing-1)] text-body-xs text-[var(--color-orange-500)] mt-[var(--spacing-2)]"
                      :data-testid="`release-composition__deps-no-versions-${collection.type}-${instance.id}`"
                    >
                      <div class="flex gap-[var(--spacing-1)]">
                        <i class="pi pi-exclamation-triangle" />
                        <span>No Ready version available — publish is blocked.</span>
                      </div>
                      <router-link
                        v-if="instance.buildRoute"
                        :to="instance.buildRoute"
                        rel="noopener"
                        class="inline-flex items-center gap-[var(--spacing-1)] font-medium text-[var(--text-color-link)] hover:text-[var(--text-color-link-hover)] cursor-pointer hover:underline"
                        :data-testid="`release-composition__deps-build-link-${collection.type}-${instance.id}`"
                      >
                        Build a version
                        <i class="pi pi-external-link" />
                      </router-link>
                    </div>
                  </div>
                </div>
              </template>

              <PrimeButton
                v-if="allowAdd"
                type="button"
                icon="pi pi-plus"
                size="small"
                outlined
                :label="`Add ${collection.label}`"
                class="self-start"
                :data-testid="`release-composition__deps-add-${collection.type}`"
                @click="onAdd(collection.type)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .deps-loading-fade-enter-active,
  .deps-loading-fade-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
  .deps-loading-fade-enter-from,
  .deps-loading-fade-leave-to {
    opacity: 0;
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    .deps-loading-fade-enter-active,
    .deps-loading-fade-leave-active {
      transition: none;
    }
  }
</style>
