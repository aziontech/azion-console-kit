<script setup>
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsStatusCode from '../FormFields/FormFieldsStatusCode'
  import { refDebounced } from '@vueuse/core'
  import { ref, computed } from 'vue'
  import { pageSchema } from '../config/validation'
  import ActionBarBlock from '@templates/action-bar-block'

  defineOptions({
    name: 'custom-pages-drawer'
  })

  const emit = defineEmits(['onSuccess'])
  const itemStatusCode = ref({})
  const showEditCustomPagesDrawer = ref(false)
  const selectedCustomPageToEdit = ref('')
  const debouncedDrawerAnimate = 300

  const showEditDrawer = refDebounced(showEditCustomPagesDrawer, debouncedDrawerAnimate)

  const loadService = () => {
    return Promise.resolve(itemStatusCode.value)
  }

  const openEditDrawer = (statusCodeItem) => {
    itemStatusCode.value = statusCodeItem
    showEditCustomPagesDrawer.value = true
  }

  const title = computed(() => {
    const item = itemStatusCode.value
    if (!item || !item.name) return 'Edit Status Code'

    const code = item.name !== 'Default' ? `${item.code}:` : ''
    return `${code} ${item.name}`.trim()
  })

  const applyStatusCodes = async (handleSubmit, onCancel, scrollToErrorInDrawer) => {
    const submit = await handleSubmit(
      (values) => {
        emit('onSuccess', values)
        onCancel()
      },
      ({ errors }) => {
        scrollToErrorInDrawer(errors)
      }
    )
    await submit()
  }

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
    :schema="pageSchema"
    :title="title"
  >
    <template #formFields>
      <FormFieldsStatusCode :itemStatusCode="itemStatusCode" />
    </template>
    <template #action-bar="{ handleSubmit, onCancel, formValid, scrollToErrorInDrawer }">
      <ActionBarBlock
        primaryActionLabel="Apply"
        @onSubmit="applyStatusCodes(handleSubmit, onCancel, scrollToErrorInDrawer)"
        @onCancel="onCancel"
        :disabled="!formValid"
      />
    </template>
  </EditDrawerBlock>
</template>
