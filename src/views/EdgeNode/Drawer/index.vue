<script setup>
  import { ref } from 'vue'
  import * as yup from 'yup'
  import FormFieldsDrawerService from '@/views/EdgeNode/FormFields/FormFieldsDrawerService'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
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

  const listService = ref([])
  const showEditRecordDrawer = ref(false)
  const showCreateRecordDrawer = ref(false)
  const selectedServiceToEdit = ref('0')
  const initialValues = {
    service: {},
    variables: '',
    id: props.edgeNodeId
  }

  const validateCode = (val = '') => {
    const split = val.split(/\s*\n+\s*/).filter((row) => !!row)
    const isValid = split.every((row) => /^\w+\s*=[^]+$/.test(row))
    return isValid
  }

  const validationSchema = yup.object({
    service: yup.object().shape({
      serviceId: yup.number().required()
    }),
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
    listService.value = [edgeNode.service]
    return edgeNode
  }

  const listServiceEdgeNode = async () => {
    listService.value = await props.listServiceEdgeNodeService({
      edgeNodeId: props.edgeNodeId,
      bound: false
    })
  }

  const openDrawerCreate = () => {
    listService.value = []
    listServiceEdgeNode()
    showCreateRecordDrawer.value = true
  }

  const openDrawerEdit = (id) => {
    if (id) {
      listService.value = []
      selectedServiceToEdit.value = id.toString()
      showEditRecordDrawer.value = true
    }
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateRecordDrawer"
    v-model:visible="showCreateRecordDrawer"
    :createService="createServiceEdgeNodeService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="emit('onSuccess')"
    title="Create Service"
  >
    <template #formFields>
      <FormFieldsDrawerService :listServices="listService" />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditRecordDrawer"
    :id="selectedServiceToEdit"
    v-model:visible="showEditRecordDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="emit('onSuccess')"
    title="Edit Service"
  >
    <template #formFields>
      <FormFieldsDrawerService :listServices="listService" />
    </template>
  </EditDrawerBlock>
</template>
