<script setup>
  /**
   * ResourceVersionField — dumb/presentational pairing of the source resource
   * (read-only) with the version dropdown to publish. The parent block decides
   * the prefilled version (from the resource context) and the required/invalid
   * state; this component only renders and emits the chosen version.
   */
  import Dropdown from '@aziontech/webkit/dropdown'
  import LabelBlock from '@aziontech/webkit/label'

  defineOptions({ name: 'deploy-drawer-resource-version-field' })

  defineProps({
    resourceName: {
      type: String,
      default: ''
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
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const onChange = (value) => emit('update:modelValue', value)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <LabelBlock label="Resource" />
      <span
        class="rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] px-3 py-2 text-sm text-[var(--text-color)]"
        data-testid="deploy-drawer__resource-name"
      >
        {{ resourceName }}
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <LabelBlock
        label="Version"
        name="deploy-drawer-version-select"
        isRequired
      />
      <Dropdown
        inputId="deploy-drawer-version-select"
        :modelValue="modelValue"
        :options="versions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select a version"
        :disabled="disabled"
        :class="['w-full', { 'p-invalid': invalid }]"
        data-testid="deploy-drawer__version-select"
        @update:modelValue="onChange"
      />
      <small
        v-if="invalid"
        class="p-error text-xs font-normal leading-tight"
        data-testid="deploy-drawer__version-error"
      >
        Version is required
      </small>
    </div>
  </div>
</template>
