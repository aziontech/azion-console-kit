<script setup>
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsStatusCode from '../FormFields/FormFieldsStatusCode'
  import { refDebounced } from '@vueuse/core'
  import { ref, computed } from 'vue'
  import { customPageService } from '@/services/v2'
  import ActionBarBlock from '@templates/action-bar-block'

  defineOptions({
    name: 'custom-pages-drawer'
  })

  const emit = defineEmits(['onSuccess'])
  const itemStatusCode = ref({})
  const showCreateCustomPagesDrawer = ref(false)
  const showEditCustomPagesDrawer = ref(false)
  const selectedCustomPageToEdit = ref('')
  const debouncedDrawerAnimate = 300

  const showEditDrawer = refDebounced(showEditCustomPagesDrawer, debouncedDrawerAnimate)

  const loadService = () => {
    return Promise.resolve(itemStatusCode.value)
  }
  const validationSchema = {}

  const closeCreateDrawer = () => {
    showCreateCustomPagesDrawer.value = false
  }

  const openEditDrawer = (statusCodeItem) => {
    itemStatusCode.value = statusCodeItem
    showEditCustomPagesDrawer.value = true
  }

  const handleEditedCustomPages = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  const title = computed(() => {
    const item = itemStatusCode.value
    if (!item || !item.name) return 'Edit Status Code'

    const code = item.name !== 'Default' ? `${item.code}:` : ''
    return `${code} ${item.name}`.trim()
  })

  defineExpose({
    openEditDrawer
  })
</script>

<template>
  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedCustomPageToEdit"
    v-model:visible="showEditCustomPagesDrawer"
    :loadService="loadService"
    :editService="customPageService.editCustomPagesService"
    :schema="validationSchema"
    @onSuccess="handleEditedCustomPages"
    :title="title"
  >
    <template #formFields>
      {{ itemStatusCode }}
      <FormFieldsStatusCode
        :itemStatusCode="itemStatusCode"
        @onSuccess="handleEditedCustomPages"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel }">
      <ActionBarBlock
        primaryActionLabel="Apply"
        @onSubmit="onSubmit"
        @onCancel="onCancel"
      />
    </template>
  </EditDrawerBlock>
</template>
