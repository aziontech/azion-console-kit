<script setup>
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsStatusCode from '../FormFields/DrawerStatusCode'
  import { refDebounced } from '@vueuse/core'
  import { ref, computed } from 'vue'
  import { pageSchema } from '@/views/CustomPages/ConfigForm/validationSchema'
  import ActionBarBlock from '@templates/action-bar-block'
  import { CODE_OPTIONS } from '@/views/CustomPages/ConfigForm/listStatusCode'
  defineOptions({
    name: 'custom-pages-drawer'
  })

  const emit = defineEmits(['onSuccess'])
  const itemStatusCode = ref({})
  const showEditCustomPagesDrawer = ref(false)
  const selectedCustomPageToEdit = ref('')
  const debouncedDrawerAnimate = 300

  const showEditDrawer = refDebounced(showEditCustomPagesDrawer, debouncedDrawerAnimate)

  const loadService = () => itemStatusCode.value

  const openEditDrawer = (statusCodeItem) => {
    itemStatusCode.value = statusCodeItem
    showEditCustomPagesDrawer.value = true
  }

  const title = computed(() => {
    const item = itemStatusCode.value
    if (!item || !item.code) return 'Create Custom Page Code'
    const name = CODE_OPTIONS.find((option) => option.value === item.code.value)?.label
    return `Edit Page Code: ${name}`.trim()
  })

  const applyStatusCodes = async (handleSubmit, onCancel, scrollToErrorInDrawer) => {
    const submit = await handleSubmit(
      (values) => {
        const transformedValues = transformValuesByType(values)
        emit('onSuccess', transformedValues)
        onCancel()
      },
      ({ errors }) => {
        scrollToErrorInDrawer(errors)
      }
    )
    await submit()
  }

  const transformValuesByType = (values) => {
    switch (values.type) {
      case 'PageDefault':
        return {
          id: values.id,
          code: values.code,
          type: values.type,
          contentType: values.contentType || 'text/html',
          response: values.response || '<html>...</html>',
          customStatusCode: values.customStatusCode,
          ttl: 0
        }
      case 'PageCustom':
        return {
          id: values.id,
          code: values.code,
          type: values.type,
          contentType: values.contentType || 'text/html',
          response: values.response || '<html>...</html>',
          ttl: 0,
          customStatusCode: values.customStatusCode
        }
      case 'PageConnector':
        return {
          id: values.id,
          code: values.code,
          type: values.type,
          connector: values.connector,
          ttl: values.ttl,
          uri: values.uri,
          customStatusCode: values.customStatusCode
        }

      default:
        return values
    }
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
