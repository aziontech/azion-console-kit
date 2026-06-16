<script setup>
  /**
   * EnvironmentSelectionInput — dumb/presentational selection input rendering N
   * selectable cards (one RadioButton per environment, all sharing the same
   * `name`). Each card shows exactly: the environment name (title), its policy
   * (as a tag beside the name) and the associated deployment name. It does not
   * fetch, filter or resolve anything — `environments` arrive already derived
   * from the composable. Domains are intentionally NOT displayed.
   */
  import RadioButton from '@aziontech/webkit/radiobutton'
  import PrimeTag from '@aziontech/webkit/prime-tag'

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
    loading: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const onSelect = (value) => emit('update:modelValue', value)
</script>

<template>
  <div
    class="flex flex-col gap-3"
    data-testid="deploy-drawer__environment-selection"
  >
    <div
      v-if="!loading && environments.length === 0"
      class="rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-4 py-6 text-center text-sm text-[var(--text-color-secondary)]"
      data-testid="deploy-drawer__environment-empty"
    >
      No environment available for this workload.
    </div>

    <div
      v-for="env in environments"
      :key="env.id"
      class="flex items-start gap-3 rounded-md border px-4 py-3 transition-colors"
      :class="
        modelValue === env.id
          ? 'border-[var(--primary-color)] bg-[var(--surface-section)]'
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
        class="flex flex-1 flex-col gap-1 cursor-pointer"
      >
        <span class="flex items-center gap-2">
          <span class="text-sm font-medium text-[var(--text-color)]">{{ env.name }}</span>
          <PrimeTag
            v-if="env.policyLabel"
            severity="secondary"
            :value="env.policyLabel"
          />
        </span>
        <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
          Deployment: {{ env.deploymentName }}
        </span>
      </label>
    </div>
  </div>
</template>
