<script setup>
  import { ref } from 'vue'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import FormFieldsDrawerDeviceGroup from '@/views/EdgeApplicationsDeviceGroups/FormFields/FormFieldsEdgeApplicationsDeviceGroups'

  defineOptions({ name: 'drawer-device-groups' })
  
  const emit = defineEmits(['onSuccess'])
  const showCreateDeviceGroupDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateDeviceGroupDrawer = refDebounced(showCreateDeviceGroupDrawer, debouncedDrawerAnimate)

  const props = defineProps({
    edgeApplicationId: {
      required: true,
      type: String
    },
    createDeviceGroupsService: {
      required: true,
      type: Function
    },
    documentationService: {
      type: Function,
      required: true
    },
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    userAgent: yup.string().required().label('User Agent'),
  })
  const initialValues = ref({
    name: '',
    userAgent: ''
  })

  const handleCreateDeviceGroup = () => {
    emit('onSuccess')
  }

  const openDrawerCreate = () => {
    showCreateDeviceGroupDrawer.value = true
  }

  defineExpose({
    openDrawerCreate,
  })

</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateDeviceGroupDrawer"
    v-model:visible="showCreateDeviceGroupDrawer"
    :createService="props.createDeviceGroupsService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateDeviceGroup"
    :showBarGoBack="true"
    title="Create Device Group"
  >
    <template>
      <FormFieldsDrawerDeviceGroup/>
    </template>
  </CreateDrawerBlock>
</template>
