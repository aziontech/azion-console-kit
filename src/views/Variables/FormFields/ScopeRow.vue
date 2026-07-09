<script setup>
  import { computed, ref, watch } from 'vue'
  import { useField } from 'vee-validate'
  import PrimeButton from '@aziontech/webkit/button'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import { environmentService } from '@/services/v2/environment/environment-service'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { RESOURCE_CATALOG_REGISTRY } from '@/services/v2/deployment/resource-catalog-registry'
  import { SCOPE_TYPE_OPTIONS, RESOURCE_TYPE_OPTIONS } from './scope-schema'

  defineOptions({ name: 'scope-row' })

  const props = defineProps({
    index: { type: Number, required: true },
    canRemove: { type: Boolean, default: true }
  })

  defineEmits(['remove'])

  const typeFieldName = computed(() => `scope[${props.index}].type`)
  const resourceTypeFieldName = computed(() => `scope[${props.index}].resourceType`)
  const idFieldName = computed(() => `scope[${props.index}].id`)

  const { value: typeValue } = useField(typeFieldName.value)
  const { value: resourceTypeValue } = useField(resourceTypeFieldName.value)
  const { value: idValue } = useField(idFieldName.value)

  const isResource = computed(() => typeValue.value === 'resource')
  const showResourceType = computed(() => isResource.value)
  const showInstance = computed(
    () =>
      typeValue.value === 'environment' ||
      typeValue.value === 'deployment' ||
      (isResource.value && !!resourceTypeValue.value)
  )

  const instanceLabel = computed(() => {
    if (typeValue.value === 'environment') return 'Environment'
    if (typeValue.value === 'deployment') return 'Deployment'
    const match = RESOURCE_TYPE_OPTIONS.find((option) => option.value === resourceTypeValue.value)
    return match?.label ?? 'Resource'
  })

  const options = ref([])
  const loadingOptions = ref(false)

  const fetchInstances = async () => {
    const type = typeValue.value
    if (type === 'environment') {
      const { body } = await environmentService.listEnvironmentsService()
      return body ?? []
    }
    if (type === 'deployment') {
      const { body } = await deploymentService.listDeploymentsService()
      return body ?? []
    }
    if (type === 'resource' && resourceTypeValue.value) {
      const entry = RESOURCE_CATALOG_REGISTRY[resourceTypeValue.value]
      return entry ? await entry.listCatalog() : []
    }
    return []
  }

  const reloadOptions = async () => {
    if (!showInstance.value) {
      options.value = []
      return
    }
    loadingOptions.value = true
    try {
      const body = await fetchInstances()
      options.value = (body ?? []).map((item) => ({
        label: item.name || item.id,
        value: item.id
      }))
    } finally {
      loadingOptions.value = false
    }
  }

  watch(
    () => typeValue.value,
    (type, previous) => {
      if (type === previous) return
      if (type !== 'resource') resourceTypeValue.value = ''
      idValue.value = ''
      reloadOptions()
    }
  )

  watch(
    () => resourceTypeValue.value,
    (value, previous) => {
      if (value === previous) return
      idValue.value = ''
      reloadOptions()
    }
  )

  reloadOptions()
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex items-end gap-2">
      <div class="flex flex-wrap gap-3 w-full">
        <FieldDropdown
          :options="SCOPE_TYPE_OPTIONS"
          :name="typeFieldName"
          label="Type"
          placeholder="Select a scope type"
          optionLabel="label"
          optionValue="value"
          required
          class="flex-1 min-w-[12rem]"
          :data-testid="`variables-form__scope-type-${index}`"
        />
        <FieldDropdown
          v-if="showResourceType"
          :options="RESOURCE_TYPE_OPTIONS"
          :name="resourceTypeFieldName"
          label="Resource type"
          placeholder="Select a resource type"
          optionLabel="label"
          optionValue="value"
          required
          class="flex-1 min-w-[12rem]"
          :data-testid="`variables-form__scope-resource-type-${index}`"
        />
        <FieldDropdown
          v-if="showInstance"
          :options="options"
          :name="idFieldName"
          :label="instanceLabel"
          :placeholder="loadingOptions ? 'Loading...' : `Select a ${instanceLabel.toLowerCase()}`"
          optionLabel="label"
          optionValue="value"
          filter
          :loading="loadingOptions"
          :disabled="loadingOptions"
          required
          class="flex-1 min-w-[12rem]"
          :pt="{
            panel: { style: 'max-width: 24rem' },
            item: { class: 'block overflow-hidden text-ellipsis whitespace-nowrap' }
          }"
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
