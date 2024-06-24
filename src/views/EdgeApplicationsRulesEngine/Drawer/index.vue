<script setup>
  import { ref, inject } from 'vue'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsDrawerRulesEngine from '@/views/EdgeApplicationsRulesEngine/FormFields/FormFieldsEdgeApplicationsRulesEngine'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { refDebounced } from '@vueuse/core'
  defineOptions({ name: 'drawer-rules-engine' })
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    createRulesEngineService: {
      type: Function,
      required: true
    },
    editRulesEngineService: {
      type: Function,
      required: true
    },
    loadRulesEngineService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    },
    isApplicationAcceleratorEnabled: {
      type: Boolean,
      required: true
    },
    isDeliveryProtocolHttps: {
      type: Boolean,
      required: true
    },
    listEdgeApplicationFunctionsService: {
      type: Function,
      required: true
    },
    listCacheSettingsService: {
      required: true,
      type: Function
    },
    listOriginsService: {
      required: true,
      type: Function
    },
    hideApplicationAcceleratorInDescription: {
      type: Boolean
    },
    isImageOptimizationEnabled: {
      required: true,
      type: Boolean
    },
    isEdgeFunctionEnabled: {
      type: Boolean
    }
  })

  const showCreateRulesEngineDrawer = ref(false)
  const showEditRulesEngineDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateRulesEngineDrawer = refDebounced(
    showCreateRulesEngineDrawer,
    debouncedDrawerAnimate
  )
  const loadEditRulesEngineDrawer = refDebounced(showEditRulesEngineDrawer, debouncedDrawerAnimate)
  const selectedRulesEngineToEdit = ref({})

  const initialValues = ref({
    id: props.edgeApplicationId,
    name: '',
    description: '',
    phase: 'request',
    criteria: [
      [
        {
          variable: '${uri}',
          operator: 'is_equal',
          conditional: 'if',
          input_value: ''
        }
      ]
    ],
    behaviors: [
      {
        name: 'deliver',
        target: {}
      }
    ],
    isActive: true
  })

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
            input_value: yup.string().when('operator', {
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

  const createService = async (payload) => {
    return await props.createRulesEngineService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const editService = async (payload) => {
    return await props.editRulesEngineService({
      payload,
      id: props.edgeApplicationId
    })
  }

  const loadService = async () => {
    return await props.loadRulesEngineService({
      ...selectedRulesEngineToEdit.value,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const initialPhase = ref('request')
  const openDrawerCreate = (selectedPhase = 'request') => {
    initialPhase.value = selectedPhase
    showCreateRulesEngineDrawer.value = true
  }

  const openDrawerEdit = (rule) => {
    if (rule.id) {
      selectedRulesEngineToEdit.value = rule
      showEditRulesEngineDrawer.value = true
    }
  }

  const closeDrawerEdit = () => {
    showEditRulesEngineDrawer.value = false
  }
  const closeDrawerCreate = () => {
    showCreateRulesEngineDrawer.value = false
  }

  const handleCreateRulesEngine = () => {
    emit('onSuccess')
    closeDrawerCreate()
  }
  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'rulesEngine'
      })
      .track()
  }
  const handleEditRulesEngine = () => {
    emit('onSuccess')
    handleTrackSuccessEdit()
    closeDrawerEdit()
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit,
    closeDrawerEdit
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateRulesEngineDrawer"
    v-model:visible="showCreateRulesEngineDrawer"
    :createService="createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateRulesEngine"
    :showBarGoBack="true"
    title="Create Rule"
  >
    <template #formFields>
      <FormFieldsDrawerRulesEngine
        :initialPhase="initialPhase"
        :edgeApplicationId="props.edgeApplicationId"
        :isApplicationAcceleratorEnabled="props.isApplicationAcceleratorEnabled"
        :isDeliveryProtocolHttps="props.isDeliveryProtocolHttps"
        :listEdgeApplicationFunctionsService="props.listEdgeApplicationFunctionsService"
        :listOriginsService="props.listOriginsService"
        :listCacheSettingsService="props.listCacheSettingsService"
        :hideApplicationAcceleratorInDescription="props.hideApplicationAcceleratorInDescription"
        :isImageOptimizationEnabled="props.isImageOptimizationEnabled"
        :isEdgeFunctionEnabled="props.isEdgeFunctionEnabled"
      />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditRulesEngineDrawer"
    :id="selectedRulesEngineToEdit.id.toString()"
    v-model:visible="showEditRulesEngineDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="handleEditRulesEngine"
    :showBarGoBack="true"
    @onError="closeDrawerEdit"
    title="Edit Rule"
  >
    <template #formFields>
      <FormFieldsDrawerRulesEngine
        :selectedRulesEngineToEdit="selectedRulesEngineToEdit"
        :edgeApplicationId="props.edgeApplicationId"
        :isApplicationAcceleratorEnabled="props.isApplicationAcceleratorEnabled"
        :isDeliveryProtocolHttps="props.isDeliveryProtocolHttps"
        :listEdgeApplicationFunctionsService="props.listEdgeApplicationFunctionsService"
        :listOriginsService="props.listOriginsService"
        :isImageOptimizationEnabled="props.isImageOptimizationEnabled"
        :listCacheSettingsService="props.listCacheSettingsService"
        :hideApplicationAcceleratorInDescription="props.hideApplicationAcceleratorInDescription"
        :isEdgeFunctionEnabled="props.isEdgeFunctionEnabled"
      />
    </template>
  </EditDrawerBlock>
</template>
