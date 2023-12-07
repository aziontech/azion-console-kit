<script setup>
  import { computed, ref } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import FormFieldsDrawerService from '@/views/EdgeNode/FormFields/FormFieldsDrawerService'
  import CreateFormBlock from '@/templates/create-form-block'
  import * as ServiceEdgeNode from '@/services/edge-node-service-services'
  const emit = defineEmits(['update:visible', 'onSuccess'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    edgeNodeId: {
      type: String,
      required: true
    }
  })

  const loading = ref(false)
  const listService = ref([])
  const initialValues = {
    service: {},
    variables: ''
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
    variables: yup.string().test('validateFilePath', 'The format provided is invalid', validateCode)
  })

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const disabledFields = computed(() => {
    return loading.value
  })

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
  }

  const createService = async (payload) => {
    return await ServiceEdgeNode.addServiceEdgeNodeService({
      ...payload,
      id: props.edgeNodeId
    })
  }

  const listServiceEdgeNode = async () => {
    listService.value = await ServiceEdgeNode.listServiceEdgeNodeService({
      id: props.edgeNodeId,
      bound: false
    })
  }

  const handleSubmit = async (onSubmit) => {
    await onSubmit()
    emit('onSuccess')
    toggleDrawerVisibility(false)
  }

  listServiceEdgeNode()
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      header: { class: 'flex justify-between text-xl font-medium px-8' },
      closeButton: { class: 'border surface-border' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>Create New</div>
    </template>
    <div class="flex w-full md:p-8 pb-0">
      <CreateFormBlock
        :createService="createService"
        :disabledCallback="true"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsDrawerService
            :disabledFields="disabledFields"
            :listServices="listService"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, loading }">
          <ActionBarTemplate
            :id="'#action-bar-drawer'"
            @onSubmit="handleSubmit(onSubmit)"
            @onCancel="closeDrawer"
            :loading="loading"
            :submitDisabled="!formValid || disabledFields"
          />
        </template>
      </CreateFormBlock>
    </div>
    <div
      class="sticky bottom-0"
      id="action-bar-drawer"
    ></div>
  </Sidebar>
</template>
