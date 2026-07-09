<script setup>
  import { computed } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from '@aziontech/webkit/inputtext'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import { useScopeNames } from '@/views/Variables/v6/use-scope-names'

  defineOptions({ name: 'scope-readonly-card' })

  const props = defineProps({
    scopes: {
      type: Array,
      default: () => []
    }
  })

  const { resolveName } = useScopeNames(() => props.scopes)

  const displayScopes = computed(() => {
    const list =
      Array.isArray(props.scopes) && props.scopes.length ? props.scopes : [{ type: 'global' }]

    return list.map((item) => {
      const type = item?.type ?? 'global'
      const isGlobal = type === 'global'

      return {
        type,
        label: type ? type.charAt(0).toUpperCase() + type.slice(1) : '',
        isGlobal,
        name: resolveName(item),
        resourceId: isGlobal ? '' : (item?.[`${type}_id`] ?? '')
      }
    })
  })
</script>

<template>
  <FormHorizontal title="Scope">
    <template #description>
      <span>Defines where this variable is available.</span>
      <div class="w-fit">
        <PrimeTag
          icon="pi pi-lock"
          severity="info"
          value="Set at creation · read-only"
          data-testid="variables-form__scope-readonly-badge"
        />
      </div>
    </template>
    <template #inputs>
      <div
        v-for="(scope, index) in displayScopes"
        :key="`${scope.type}-${scope.resourceId || index}`"
        class="flex gap-[var(--spacing-3)] w-full"
        :data-testid="`variables-form__scope-readonly-item-${index}`"
      >
        <div class="flex flex-col gap-[var(--spacing-2)] w-full">
          <label
            v-if="index === 0"
            class="text-body-sm font-medium text-[var(--text-color)]"
            >Type</label
          >
          <InputText
            :value="scope.label"
            disabled
            class="w-full"
            :data-testid="`variables-form__scope-readonly-type-${index}`"
          />
        </div>

        <div
          v-if="!scope.isGlobal && (scope.name || scope.resourceId)"
          class="flex flex-col gap-[var(--spacing-2)] w-full"
        >
          <label
            v-if="index === 0"
            class="text-body-sm font-medium text-[var(--text-color)]"
            >Linked resource</label
          >
          <InputText
            :value="scope.name || scope.resourceId"
            disabled
            class="w-full"
            :data-testid="`variables-form__scope-readonly-resource-${index}`"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
