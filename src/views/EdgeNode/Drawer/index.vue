<script setup>
  import { ref } from 'vue'
  import * as yup from 'yup'
  import FormFieldsDrawerService from '@/views/EdgeNode/FormFields/FormFieldsDrawerService'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { refDebounced } from '@vueuse/core'

  defineOptions({ name: 'drawer-service' })

  const emit = defineEmits(['onSuccess'])
  const props = defineProps({
    edgeNodeId: {
      type: String,
      required: true
    },
    createServiceEdgeNodeService: {
      type: Function,
      required: true
    },
    editServiceEdgeNodeService: {
      type: Function,
      required: true
    },
    loadServiceEdgeNodeService: {
      type: Function,
      required: true
    },
    listServiceEdgeNodeService: {
      type: Function,
      required: true
    }
  })

  const showEditServiceDrawer = ref(false)
  const showCreateServiceDrawer = ref(false)
  const isOverlapped = ref(false)
  const debouncedDrawerAnimate = 300
  const selectedServiceToEdit = ref('0')
  const loadCreateServiceDrawer = refDebounced(showCreateServiceDrawer, debouncedDrawerAnimate)
  const loadEditServiceDrawer = refDebounced(showEditServiceDrawer, debouncedDrawerAnimate)

  const initialValues = {
    serviceId: 0,
    variables: '',
    id: props.edgeNodeId
  }

  const validateCode = (val = '') => {
    const split = val.split(/\s*\n+\s*/).filter((row) => !!row)
    const isValid = split.every((row) => /^\w+\s*=[^]+$/.test(row))
    return isValid
  }

  const validationSchema = yup.object({
    serviceId: yup.number().required().label('Service'),
    variables: yup
      .string()
      .test('validateFilePath', 'The format provided is invalid', validateCode),
    id: yup.string().required()
  })

  const editService = async (payload) => {
    return await props.editServiceEdgeNodeService({
      ...payload,
      edgeNodeId: props.edgeNodeId
    })
  }

  const loadService = async (payload) => {
    const edgeNode = await props.loadServiceEdgeNodeService({
      ...payload,
      edgeNodeId: props.edgeNodeId
    })
    return edgeNode
  }

  const handleToggleDrawer = (value) => {
    isOverlapped.value = value
  }

  const openDrawerCreate = () => {
    showCreateServiceDrawer.value = true
  }

  const openDrawerEdit = (id) => {
    if (id) {
      selectedServiceToEdit.value = id.toString()
      showEditServiceDrawer.value = true
    }
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateServiceDrawer"
    v-model:visible="showCreateServiceDrawer"
    :createService="createServiceEdgeNodeService"
    :schema="validationSchema"
    :isOverlapped="isOverlapped"
    :initialValues="initialValues"
    @onSuccess="emit('onSuccess')"
    title="Bind Service"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerService
        :edgeNodeId="edgeNodeId"
        @toggleDrawer="handleToggleDrawer"
        :listServicesHandle="listServiceEdgeNodeService"
        :disabledFields="disabledFields"
        :bound="false"
      />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="loadEditServiceDrawer"
    :id="selectedServiceToEdit"
    v-model:visible="showEditServiceDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="emit('onSuccess')"
    title="Edit Service"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerService
        :edgeNodeId="edgeNodeId"
        @toggleDrawer="handleToggleDrawer"
        :listServicesHandle="listServiceEdgeNodeService"
        :disabledFields="disabledFields"
        bound
      />
    </template>
  </EditDrawerBlock>
</template>
