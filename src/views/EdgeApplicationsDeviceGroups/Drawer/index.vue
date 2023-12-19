<script setup>
  import { ref } from 'vue'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import FormFieldsDrawerDeviceGroup from '@/views/EdgeApplicationsDeviceGroups/FormFields/FormFieldsEdgeApplicationsDeviceGroups'

  defineOptions({ name: 'drawer-device-groups' })

  const emit = defineEmits(['onSuccess'])
  const showCreateDeviceGroupDrawer = ref(false)
  const showEditDeviceGroupDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateDeviceGroupDrawer = refDebounced(
    showCreateDeviceGroupDrawer,
    debouncedDrawerAnimate
  )
  const loadEditDeviceGroupDrawer = refDebounced(showEditDeviceGroupDrawer, debouncedDrawerAnimate)
  const selectedDeviceGroupToEdit = ref()

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    createDeviceGroupService: {
      required: true,
      type: Function
    },
    loadDeviceGroupService: {
      required: true,
      type: Function
    },
    editDeviceGroupService: {
      required: true,
      type: Function
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup
      .string()
      .required()
      .label('Name')
      .test('validName', 'Name should be alphanumeric', function (value) {
        return /^[a-zA-Z0-9]+$/.test(value)
      }),
    userAgent: yup.string().required().label('User Agent')
  })
  const initialValues = ref({
    id: '',
    edgeApplicationId: props.edgeApplicationId,
    name: '',
    userAgent: ''
  })

  const handleSuccess = () => {
    emit('onSuccess')
  }

  const closeDrawer = () => {
    showCreateDeviceGroupDrawer.value = false
    showEditDeviceGroupDrawer.value = false
  }

  const loadService = async (payload) => {
    const deviceGroup = await props.loadDeviceGroupService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
    return deviceGroup
  }

  const editService = async (payload) => {
    return await props.editDeviceGroupService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const openDrawerCreate = () => {
    showCreateDeviceGroupDrawer.value = true
  }

  const openDrawerEdit = (id) => {
    if (id) {
      selectedDeviceGroupToEdit.value = id.toString()
      showEditDeviceGroupDrawer.value = true
    }
  }

  const closeDrawerEdit = () => {
    showEditDeviceGroupDrawer.value = false
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit,
    closeDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateDeviceGroupDrawer"
    v-model:visible="showCreateDeviceGroupDrawer"
    :createService="props.createDeviceGroupService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleSuccess"
    :showBarGoBack="true"
    title="Create Device Group"
  >
    <template #formFields>
      <FormFieldsDrawerDeviceGroup />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="loadEditDeviceGroupDrawer"
    :id="selectedDeviceGroupToEdit"
    v-model:visible="showEditDeviceGroupDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="handleSuccess"
    :showBarGoBack="true"
    @onError="closeDrawerEdit"
    title="Edit Resource"
  >
    <template #formFields>
      <FormFieldsDrawerDeviceGroup />
    </template>
  </EditDrawerBlock>
</template>
