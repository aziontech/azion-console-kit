<template>
  <CreateDrawerBlock
    v-if="loadCreateFunctionDrawer"
    v-model:visible="showCreateFunctionDrawer"
    :createService="props.createFunctionService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateFunction"
    :showBarGoBack="true"
    title="Create Instance"
  >
    <template #formFields>
      <FormFieldsDrawerFunction :edgeFunctionsList="filteredEdgeFunctions" />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditFunctionDrawer"
    :id="selectedFunctionToEdit"
    v-model:visible="showEditFunctionDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="handleSuccessEdit"
    :showBarGoBack="true"
    @onError="closeDrawerEdit"
    title="Edit Instance"
  >
    <template #formFields>
      <FormFieldsDrawerFunction :edgeFunctionsList="filteredEdgeFunctions" />
    </template>
  </EditDrawerBlock>
</template>

<script setup>
  import { ref, onMounted, computed, inject } from 'vue'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsDrawerFunction from '@/views/EdgeFirewallFunctions/FormFields/FormFieldsEdgeApplicationsFunctions'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { refDebounced } from '@vueuse/core'
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  defineOptions({ name: 'drawer-origin' })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeFirewallID: {
      type: String,
      required: true
    },
    createFunctionService: {
      type: Function,
      required: true
    },
    editFunctionService: {
      required: true,
      type: Function
    },
    listEdgeFunctionsService: {
      type: Function,
      required: true
    },
    loadFunctionService: {
      type: Function,
      required: true
    }
  })

  const showCreateFunctionDrawer = ref(false)
  const showEditFunctionDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateFunctionDrawer = refDebounced(showCreateFunctionDrawer, debouncedDrawerAnimate)
  const loadEditFunctionDrawer = refDebounced(showEditFunctionDrawer, debouncedDrawerAnimate)
  const selectedFunctionToEdit = ref('')
  const edgeFunctionsList = ref([])
  const filteredEdgeFunctions = computed(() =>
    edgeFunctionsList.value.filter((element) => element.initiatorType === 'edge_firewall')
  )

  const initialValues = ref({
    id: props.edgeFirewallID,
    name: undefined,
    edgeFunctionID: undefined,
    args: '{}'
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    edgeFunctionID: yup
      .number()
      .transform((value) => (Number.isNaN(value) ? null : value))
      .required()
      .label('Edge Function')
  })

  onMounted(async () => {
    const response = await props.listEdgeFunctionsService({})
    edgeFunctionsList.value = response
  })

  const editService = async (payload) => {
    return await props.editFunctionService({
      ...payload,
      edgeFirewallID: props.edgeFirewallID
    })
  }

  const loadService = async () => {
    const functions = await props.loadFunctionService({
      edgeFirewallID: props.edgeFirewallID,
      functionID: selectedFunctionToEdit.value
    })
    return functions
  }

  const handleSuccessEdit = () => {
    showEditFunctionDrawer.value = false
    emit('onSuccess')
    handleTrackSuccessEdit()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Firewall',
        tab: 'functions'
      })
      .track()
  }

  const openDrawerCreate = () => {
    showCreateFunctionDrawer.value = true
  }

  const closeDrawerCreate = () => {
    showCreateFunctionDrawer.value = false
  }

  const openDrawerEdit = (functionID) => {
    if (functionID) {
      showEditFunctionDrawer.value = true
      selectedFunctionToEdit.value = functionID.toString()
    }
  }

  const handleFailedEditEdgeFirewallFunctions = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge Firewall',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const closeDrawerEdit = (error) => {
    handleFailedEditEdgeFirewallFunctions(error)
  }

  const handleCreateFunction = () => {
    closeDrawerCreate()
    handleTrackSuccessEdit()
    emit('onSuccess')
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit
  })
</script>
