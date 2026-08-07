<script setup>
  import { computed } from 'vue'
  import Dropdown from '@aziontech/webkit/inputs/dropdown'
  import { convertToRelativeTime } from '@/helpers/convert-date'
  import { LATEST_READY } from '@/templates/release-composition/version-options'

  defineOptions({ name: 'release-resource-version-field' })

  const props = defineProps({
    resourceName: {
      type: String,
      default: ''
    },
    showResource: {
      type: Boolean,
      default: true
    },
    label: {
      type: String,
      default: 'Version'
    },
    required: {
      type: Boolean,
      default: true
    },
    versions: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    invalid: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    buildRoute: {
      type: Object,
      default: null
    },
    resourceLabel: {
      type: String,
      default: 'resource'
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const onChange = (value) => emit('update:modelValue', value)

  const hasVersions = computed(() => Array.isArray(props.versions) && props.versions.length > 0)

  const showBuildLink = computed(
    () => !props.loading && !hasVersions.value && Boolean(props.buildRoute)
  )

  const dropdownOptions = computed(() => [
    { label: '', items: [{ value: LATEST_READY, label: 'Track latest Ready', isLatest: true }] },
    { label: 'Pin a Ready version', items: props.versions }
  ])

  const isLatest = computed(() => props.modelValue === LATEST_READY)

  const selectedOption = computed(
    () => props.versions.find((option) => option.value === props.modelValue) ?? null
  )
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]">
    <div
      v-if="showResource"
      class="flex flex-col gap-[var(--spacing-2)]"
    >
      <label
        class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
      >
        Resource
        <span
          class="text-[var(--color-orange-500)]"
          aria-hidden="true"
          >*</span
        >
      </label>
      <span
        class="flex min-w-0 items-center gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
        data-testid="release-composition__resource-name"
      >
        <i class="pi pi-box shrink-0 text-[var(--text-color-secondary)]" />
        <span class="truncate">{{ resourceName }}</span>
      </span>
    </div>

    <div class="flex flex-col gap-[var(--spacing-2)]">
      <label
        class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
      >
        {{ label }}
        <span
          v-if="required"
          class="text-[var(--color-orange-500)]"
          aria-hidden="true"
          >*</span
        >
      </label>
      <template v-if="!showBuildLink">
        <Dropdown
          :modelValue="modelValue"
          :options="dropdownOptions"
          optionLabel="label"
          optionValue="value"
          optionGroupLabel="label"
          optionGroupChildren="items"
          placeholder="Select a version"
          :disabled="disabled"
          :class="['release-composition-control', 'w-full', { 'p-invalid': invalid }]"
          data-testid="release-composition__version-select"
          @update:modelValue="onChange"
        >
          <template #value>
            <span
              v-if="isLatest"
              class="flex items-center gap-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
            >
              <i class="pi pi-sync text-[var(--text-primary)]" />
              latest Ready
            </span>
            <span
              v-else-if="selectedOption"
              class="text-body-sm text-[var(--text-color)]"
            >
              {{ selectedOption.label }}
            </span>
            <span
              v-else-if="modelValue"
              class="text-body-sm text-[var(--text-color)]"
            >
              {{ modelValue }}
            </span>
            <span
              v-else
              class="text-body-sm text-[var(--text-color-secondary)]"
              >Select a version</span
            >
          </template>
          <template #option="{ option }">
            <div
              v-if="option.isLatest"
              class="flex w-full flex-col gap-[var(--spacing-1)]"
              data-testid="release-composition__version-latest"
            >
              <span
                class="flex w-full items-center gap-[var(--spacing-2)] text-body-sm text-[var(--text-color)]"
              >
                <i class="pi pi-sync text-[var(--text-primary)]" />
                Track latest Ready
                <i
                  v-if="isLatest"
                  class="pi pi-check ml-auto text-[var(--text-primary)]"
                />
              </span>
              <span class="text-body-xs text-[var(--text-color-secondary)]">
                Always the newest Ready version
              </span>
            </div>
            <div
              v-else
              class="flex w-full items-center gap-[var(--spacing-3)]"
              :data-testid="`release-composition__version-option-${option.value}`"
            >
              <span class="flex min-w-0 flex-col gap-[var(--spacing-1)]">
                <span class="flex items-center gap-[var(--spacing-2)]">
                  <span class="text-body-sm text-[var(--text-color)]">{{ option.label }}</span>
                  <span
                    v-if="option.isCurrent"
                    class="inline-flex items-center rounded-[var(--shape-elements)] bg-[var(--surface-200)] px-[var(--spacing-2)] py-[var(--spacing-1)] text-tag-sm text-[var(--text-color-secondary)]"
                  >
                    Current
                  </span>
                </span>
                <span
                  v-if="option.createdAt || option.author"
                  class="text-body-xs text-[var(--text-color-secondary)]"
                >
                  <template v-if="option.createdAt">{{
                    convertToRelativeTime(option.createdAt)
                  }}</template>
                  <template v-if="option.createdAt && option.author"> · </template>
                  <template v-if="option.author">{{ option.author }}</template>
                </span>
              </span>
              <i
                v-if="option.value === modelValue"
                class="pi pi-check ml-auto text-[var(--text-primary)]"
              />
            </div>
          </template>
        </Dropdown>
        <small
          v-if="invalid"
          class="p-error text-body-xs font-normal"
          data-testid="release-composition__version-error"
        >
          Select a version.
        </small>
      </template>
      <template v-else>
        <div
          class="flex items-start gap-[var(--spacing-2)] rounded-[var(--shape-elements)] border border-[var(--warning-border)] bg-[var(--warning)] px-[var(--spacing-3)] py-[var(--spacing-2)]"
          data-testid="release-composition__version-build"
        >
          <i class="pi pi-exclamation-triangle mt-[2px] shrink-0 text-[var(--warning-contrast)]" />
          <span class="text-body-xs text-[var(--warning-contrast)]">
            No Ready version available for this {{ resourceLabel }}.
            <RouterLink
              :to="buildRoute"
              class="font-medium underline"
              data-testid="release-composition__version-build-link"
              >Build a version</RouterLink
            >
            to deploy.
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  :deep(.release-composition-control) {
    background: var(--surface-section) !important;
    border-color: var(--surface-border) !important;
  }
</style>
