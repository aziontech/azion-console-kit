<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsEdgeFirewallRulesEngine from '../FormFields/FormFieldsEdgeFirewallRulesEngine.vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { onMounted, ref, inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import {
    edgeFirewallRulesEngineService,
    edgeFirewallFunctionService,
    wafService
  } from '@/services/v2'

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'edge-application-cache-settings-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeFirewallId: {
      type: String,
      required: true
    },
    createService: {
      type: Function,
      required: true
    },
    loadService: {
      type: Function,
      required: true
    },
    listFunctionsService: {
      type: Function,
      required: true
    },
    editService: {
      type: Function,
      required: true
    },
    edgeFirewallModules: {
      type: Object,
      required: true
    },
    listNetworkListService: {
      type: Function,
      required: true
    },
    loadNetworkListService: {
      type: Function,
      required: true
    }
  })

  const showCreateRulesEngineDrawer = ref(false)
  const showEditRulesEngineDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const selectedRulesEngineToEdit = ref('')
  const edgeFirewallFunctionsOptions = ref([])

  const showCreateDrawer = refDebounced(showCreateRulesEngineDrawer, DEBOUNCE_TIME_IN_MS)
  const showEditDrawer = refDebounced(showEditRulesEngineDrawer, DEBOUNCE_TIME_IN_MS)

  const initialValues = ref({
    name: '',
    description: '',
    active: true,
    criteria: [
      [
        {
          variable: '',
          operator: '',
          conditional: 'if',
          argument: ''
        }
      ]
    ],
    behaviors: [
      {
        name: ''
      }
    ]
  })

  const hasEdgeFunctionsProductAccess = ref(true)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    description: yup
      .string()
      .max(1000, 'Description should not exceed 1000 characters')
      .label('Description'),
    active: yup.bool(),
    criteria: yup.array().of(
      yup
        .array()
        .of(
          yup.object().shape({
            variable: yup.string().required().label('variable'),
            operator: yup.string().required().label('operator'),
            conditional: yup.string().required().label('conditional'),
            argument: yup.string().when('operator', {
              is: (operator) => operator !== 'exists' && operator !== 'does_not_exist',
              then: (schema) => schema.required().label('criteria argument'),
              otherwise: (schema) => schema.notRequired()
            })
          })
        )
        .required()
    ),
    behaviors: yup.array().of(
      yup.object().shape({
        name: yup.string().required().label('behavior')
      })
    )
  })

  const closeCreateDrawer = () => {
    showCreateRulesEngineDrawer.value = false
  }

  const openCreateDrawer = () => {
    showCreateRulesEngineDrawer.value = true
  }
  const openEditDrawer = (rulesEngineId) => {
    selectedRulesEngineToEdit.value = `${rulesEngineId}`
    showEditRulesEngineDrawer.value = true
  }
  const closeEditDrawer = () => {
    showEditRulesEngineDrawer.value = false
  }

  const handleCreateWithSuccess = () => {
    emit('onSuccess')
    handleTrackCreation()
    closeCreateDrawer()
  }

  const handleEditWithSuccess = () => {
    emit('onSuccess')
    handleTrackSuccessEdit()
    closeEditDrawer()
  }

  const handleTrackCreation = () => {
    tracker.product
      .productCreated({
        productName: 'Rule',
        product: 'edgeFirewall'
      })
      .track()
  }

  const handleFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Rule',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message,
        product: 'edgeFirewall'
      })
      .track()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Rule',
        product: 'edgeFirewall'
      })
      .track()

    tracker.product
      .productEdited({
        productName: 'Edge Firewall',
        tab: 'rulesEngine'
      })
      .track()
  }

  const handleFailedEditEdgeFirewallRules = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Rule',
        errorType: 'api',
        fieldName: fieldName.trim(),
        product: 'edgeFirewall',
        errorMessage: message
      })
      .track()
  }

  const listFunctionsServiceWithDecorator = async () => {
    return await edgeFirewallFunctionService.listFunctionsService(props.edgeFirewallId, {
      pageSize: 100,
      fields: 'id,name',
      ordering: 'active'
    })
  }

  const listEdgeFirewallFunctionsOptions = async () => {
    try {
      const result = await listFunctionsServiceWithDecorator()
      edgeFirewallFunctionsOptions.value = result.body
    } catch {
      hasEdgeFunctionsProductAccess.value = false
    }
  }

  const createEdgeFirewallRulesEngineServiceWithDecorator = async (payload) => {
    return await edgeFirewallRulesEngineService.createEdgeFirewallRulesEngineService(
      props.edgeFirewallId,
      payload
    )
  }

  const loadEdgeFirewallRulesEngineServiceWithDecorator = async (payload) => {
    return await edgeFirewallRulesEngineService.loadEdgeFirewallRulesEngineService({
      edgeFirewallId: props.edgeFirewallId,
      id: payload.id
    })
  }
  const editEdgeFirewallRulesEngineServiceWithDecorator = async (payload) => {
    return await edgeFirewallRulesEngineService.editEdgeFirewallRulesEngineService(
      props.edgeFirewallId,
      payload
    )
  }
  onMounted(async () => {
    await Promise.all([listEdgeFirewallFunctionsOptions()])
  })

  defineExpose({
    openCreateDrawer,
    openEditDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateRulesEngineDrawer"
    :createService="createEdgeFirewallRulesEngineServiceWithDecorator"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    @onError="handleFailedToCreate"
    title="Create Rule"
  >
    <template #formFields>
      <FormFieldsEdgeFirewallRulesEngine
        :enabledModules="edgeFirewallModules"
        :hasEdgeFunctionsProductAccess="hasEdgeFunctionsProductAccess"
        :edgeFirewallFunctionsOptions="edgeFirewallFunctionsOptions"
        :listWafRulesService="wafService.listWafRules"
        :listNetworkListService="listNetworkListService"
        :loadNetworkListService="loadNetworkListService"
        :loadWafRulesService="wafService.loadWafRule"
      />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedRulesEngineToEdit"
    v-model:visible="showEditRulesEngineDrawer"
    :loadService="loadEdgeFirewallRulesEngineServiceWithDecorator"
    :editService="editEdgeFirewallRulesEngineServiceWithDecorator"
    :schema="validationSchema"
    @onError="handleFailedEditEdgeFirewallRules"
    @onSuccess="handleEditWithSuccess"
    title="Edit Rule"
  >
    <template #formFields>
      <FormFieldsEdgeFirewallRulesEngine
        :enabledModules="edgeFirewallModules"
        :hasEdgeFunctionsProductAccess="hasEdgeFunctionsProductAccess"
        :edgeFirewallFunctionsOptions="edgeFirewallFunctionsOptions"
        :listWafRulesService="wafService.listWafRules"
        :listNetworkListService="listNetworkListService"
        :loadNetworkListService="loadNetworkListService"
        :loadWafRulesService="wafService.loadWafRule"
      />
    </template>
  </EditDrawerBlock>
</template>
