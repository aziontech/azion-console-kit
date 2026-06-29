<script setup>
  /**
   * ReleaseDependenciesSection — presentational, editable owned dependencies
   * nested inside a parent resource card (Application → Functions/Connectors;
   * Firewall → Network Lists/WAF). Renders one collapsible group per collection;
   * each open group lists its instances as a `ResourceSelectField` (instance) +
   * `ResourceVersionField` (version) + remove control, and offers an "Add"
   * affordance to append a new instance.
   *
   * Fully controlled: every value (including each group's `open` flag) comes
   * from props; all mutation flows back through events. No fetching, no
   * derivation, no business logic. The disable cascade (hiding the section when
   * the parent resource is toggled off) is the PARENT's responsibility via
   * `v-if`; this component only renders what it is given.
   *
   * @prop collections — array of `{ type, label, icon, count, open, instances }`
   *   where each instance is `{ id, resourceId, name, options, version,
   *   versionOptions }`.
   * @event toggle-group(type) — request to collapse/expand a collection group.
   * @event add-instance(type) — append a blank instance to a group.
   * @event update:instance-resource({ type, id, value }) — instance selection.
   * @event update:instance-version({ type, id, value }) — version selection.
   * @event remove-instance({ type, id }) — remove an instance from a group.
   */
  import PrimeButton from '@aziontech/webkit/button'

  import ResourceSelectField from '@/templates/release-composition/components/ResourceSelectField.vue'
  import ResourceVersionField from '@/templates/release-composition/components/ResourceVersionField.vue'

  defineOptions({ name: 'release-dependencies-section' })

  defineProps({
    collections: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits([
    'toggle-group',
    'add-instance',
    'update:instance-resource',
    'update:instance-version',
    'remove-instance'
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
            class="flex flex-1 items-center gap-[var(--spacing-3)] text-left bg-transparent border-0 cursor-pointer min-w-0"
            :aria-expanded="collection.open"
            :data-testid="`release-composition__deps-group-header-${collection.type}`"
            @click="onToggleGroup(collection.type)"
          >
            <i
              :class="[
                'pi text-[var(--text-color-secondary)] transition-transform',
                collection.open ? 'pi-chevron-down' : 'pi-chevron-right'
              ]"
            />
            <i
              :class="[collection.icon, 'shrink-0 text-body-md text-[var(--text-color-secondary)]']"
            />
            <span class="text-body-sm font-medium text-[var(--text-color)] truncate">{{
              collection.label
            }}</span>
          </button>
          <PrimeButton
            type="button"
            icon="pi pi-plus"
            label="Add"
            severity="secondary"
            outlined
            size="small"
            class="shrink-0"
            :aria-label="`Add ${collection.label}`"
            :data-testid="`release-composition__deps-add-${collection.type}`"
            @click="onAdd(collection.type)"
          />
          <span
            class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
            :data-testid="`release-composition__deps-count-${collection.type}`"
          >
            {{ collection.count }}
          </span>
        </div>

        <div
          v-if="collection.open"
          class="flex flex-col gap-[var(--spacing-2)] border-t border-[var(--surface-border)] py-[var(--spacing-3)] pr-[var(--spacing-3)] pl-[var(--spacing-7)]"
          :data-testid="`release-composition__deps-body-${collection.type}`"
        >
          <p
            v-if="!collection.instances.length"
            class="text-body-sm text-[var(--text-color-secondary)]"
            :data-testid="`release-composition__deps-empty-${collection.type}`"
          >
            No {{ collection.label }} instances — Add one to include it.
          </p>

          <template v-else>
            <div
              v-for="instance in collection.instances"
              :key="instance.id"
              class="release-composition__deps-row grid items-end gap-[var(--spacing-3)]"
              :data-testid="`release-composition__deps-row-${collection.type}-${instance.id}`"
            >
              <ResourceSelectField
                :modelValue="instance.resourceId"
                :options="instance.options"
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
                :required="false"
                @update:modelValue="onVersionChange(collection.type, instance.id, $event)"
              />

              <PrimeButton
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
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  .release-composition__deps-row {
    grid-template-columns: 1fr 1fr var(--spacing-8);
  }

  @media (max-width: 600px) {
    .release-composition__deps-row {
      grid-template-columns: 1fr 1fr auto;
    }
  }
</style>
