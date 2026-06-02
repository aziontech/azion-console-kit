<script setup>
  import { computed, ref, watch } from 'vue'
  import { useField } from 'vee-validate'
  import PrimeButton from '@aziontech/webkit/button'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import { environmentService } from '@/services/v2/environment/environment-service'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { SCOPE_TYPE_OPTIONS, idFieldForType } from './scope-schema'

  defineOptions({ name: 'scope-row' })

  const props = defineProps({
    index: { type: Number, required: true },
    canRemove: { type: Boolean, default: true }
  })

  defineEmits(['remove'])

  const typeFieldName = computed(() => `scope[${props.index}].type`)
  const { value: typeValue } = useField(typeFieldName.value)

  const idKey = computed(() => idFieldForType(typeValue.value))
  const idFieldName = computed(() => (idKey.value ? `scope[${props.index}].${idKey.value}` : null))
  const idFieldLabel = computed(() => {
    if (!idKey.value) return ''
    const base = idKey.value.replace(/_id$/, '')
    return base.charAt(0).toUpperCase() + base.slice(1)
  })

  const options = ref([])
  const loadingOptions = ref(false)

  const useDropdownForType = computed(
    () => typeValue.value === 'environment' || typeValue.value === 'deployment'
  )

  const fetchOptions = async (type) => {
    if (type === 'environment') return environmentService.listEnvironmentsService()
    if (type === 'deployment') return deploymentService.listDeploymentsService()
    return { body: [] }
  }

  watch(
    () => typeValue.value,
    async (type) => {
      if (!type || !useDropdownForType.value) {
        options.value = []
        return
      }
      loadingOptions.value = true
      try {
        const { body } = await fetchOptions(type)
        options.value = (body ?? []).map((item) => ({
          label: item.name ?? item.id,
          value: item.id
        }))
      } finally {
        loadingOptions.value = false
      }
    },
    { immediate: true }
  )
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex items-end gap-2">
      <div class="flex gap-3 w-full">
        <FieldDropdown
          :options="SCOPE_TYPE_OPTIONS"
          :name="typeFieldName"
          label="Type"
          placeholder="Select a scope type"
          optionLabel="label"
          optionValue="value"
          required
          :data-testid="`variables-form__scope-type-${index}`"
        />
        <FieldDropdown
          v-if="idFieldName && useDropdownForType"
          :options="options"
          :name="idFieldName"
          :label="idFieldLabel"
          :placeholder="loadingOptions ? 'Loading...' : `Select a ${idFieldLabel.toLowerCase()}`"
          optionLabel="label"
          optionValue="value"
          :loading="loadingOptions"
          :disabled="loadingOptions"
          required
          :data-testid="`variables-form__scope-id-${index}`"
        />
      </div>
      <PrimeButton
        v-if="canRemove"
        type="button"
        icon="pi pi-trash"
        severity="secondary"
        text
        :data-testid="`variables-form__scope-remove-${index}`"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>
