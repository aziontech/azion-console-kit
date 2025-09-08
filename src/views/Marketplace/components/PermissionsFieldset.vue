<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'

  const props = defineProps({
    permissions: {
      type: Array,
      required: true,
      default: () => []
    },
    windowOpen: {
      type: Function,
      required: true
    }
  })

  const formatActions = (allow) => {
    let output = ''
    const actions = []

    if (allow.read) actions.push('read')
    if (allow.write) actions.push('write')
    if (allow.edit) actions.push('edit')
    if (allow.delete) actions.push('delete')

    if (actions.length === 1) {
      output = actions.pop()
    }

    if (actions.length === 2) {
      output = `${actions[0]} and ${actions[1]}`
    }

    if (actions.length > 2) {
      const last = actions.pop()
      output = `${actions.join(', ')}, and ${last}`
    }

    const firstLetter = output[0].toUpperCase()
    output = firstLetter + output.slice(1)

    return output
  }

  const permissions = props.permissions.map((permission) => {
    const actions = formatActions(permission.allow)
    return {
      name: permission.name,
      description: `${actions} ${permission.description}`
    }
  })

  const handleOpenPermissionsDoc = () => {
    props.windowOpen(
      'https://www.azion.com/en/documentation/products/marketplace/permissions-marketplace/',
      '_blank'
    )
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Permissions"
    description="Azion Marketplace requires the following privileges on the selected application."
  >
    <template #inputs>
      <div class="text-sm text-color-secondary flex flex-col gap-4">
        <div
          class="flex flex-row items-center gap-3"
          v-for="permission in permissions"
          :key="permission.name"
        >
          <span class="text-success-check pi pi-check"></span>
          <span class="text-color-secondary">{{ permission.description }}</span>
        </div>
        <div class="text-sm text-color-secondary h-8 flex flex-row items-center">
          <span class="">Read more about</span>
          <PrimeButton
            label="Marketplace's Permissions"
            link
            icon-pos="right"
            icon="pi pi-external-link"
            size="small"
            class="p-0 ml-4"
            type="button"
            @click="handleOpenPermissionsDoc"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
