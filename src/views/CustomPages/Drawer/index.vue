<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsCustomPages from '@/views/CustomPages/FormFields/CustomPages'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { edgeConnectorsService, customPageService } from '@/services/v2'
  defineOptions({
    name: 'custom-pages-drawer'
  })
  const emit = defineEmits(['onSuccess'])
  defineProps({
    loadService: {
      type: Function,
      required: false
    },
    editService: {
      type: Function,
      required: false
    }
  })
  const getEdgeConnectors = async (query) => {
    return await edgeConnectorsService.listEdgeConnectorsService({
      fields: 'id,name',
      ...query
    })
  }
  const showCreateCustomPagesDrawer = ref(false)
  const showEditCustomPagesDrawer = ref(false)
  const selectedCustomPageToEdit = ref('')
  const debouncedDrawerAnimate = 300
  const showCreateDrawer = refDebounced(showCreateCustomPagesDrawer, debouncedDrawerAnimate)
  const showEditDrawer = refDebounced(showEditCustomPagesDrawer, debouncedDrawerAnimate)
  const initialValues = ref({
    name: '',
    isActive: false,
    isDefault: false,
    edgeConnectorId: null,
    pages: []
  })
  const isUriValidRegex = /^\/[/a-zA-Z0-9\-_.~@:]*$/
  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    isActive: yup.boolean().required().label('Active'),
    isDefault: yup.boolean().required().label('Default'),
    edgeConnectorId: yup.string().nullable().label('Edge Connector'),
    pages: yup
      .array()
      .of(
        yup.object().shape({
          code: yup.string().required().label('Code'),
          ttl: yup.number().min(1).required().label('TTL'),
          uri: yup
            .string()
            .transform((value) => (value === '' ? null : value))
            .nullable()
            .matches(isUriValidRegex, 'Invalid URI')
            .label('URI'),
          custom_status_code: yup.number().label('Custom Status Code')
        })
      )
      .required()
      .label('Pages')
  })
  const closeCreateDrawer = () => {
    showCreateCustomPagesDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateCustomPagesDrawer.value = true
  }
  const openEditDrawer = (customPagesId) => {
    selectedCustomPageToEdit.value = `${customPagesId}`
    showEditCustomPagesDrawer.value = true
  }
  const handleCreateCustomPages = (response) => {
    emit('onSuccess', response.data.id)
    closeCreateDrawer()
  }
  const handleEditedCustomPages = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }
  defineExpose({
    openCreateDrawer,
    openEditDrawer,
    showCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateCustomPagesDrawer"
    :createService="customPageService.createCustomPagesService"
    id="create-custom-page-drawer"
    drawerId="create-custom-page-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCustomPages"
    title="Create Custom Page"
    isOverlapped
    expandable
    expandedDefault
  >
    <template #formFields>
      <FormFieldsCustomPages
        :loadEdgeConnectorsService="edgeConnectorsService.loadEdgeConnectorsService"
        :listEdgeConnectorsService="getEdgeConnectors"
      />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedCustomPageToEdit"
    v-model:visible="showEditCustomPagesDrawer"
    :loadService="customPageService.loadCustomPagesService"
    :editService="customPageService.editCustomPagesService"
    :schema="validationSchema"
    @onSuccess="handleEditedCustomPages"
    title="Edit Custom Page"
    isOverlapped
  >
    <template #formFields>
      <FormFieldsCustomPages
        :loadEdgeConnectorsService="edgeConnectorsService.loadEdgeConnectorsService"
        :listEdgeConnectorsService="getEdgeConnectors"
      />
    </template>
  </EditDrawerBlock>
</template>
