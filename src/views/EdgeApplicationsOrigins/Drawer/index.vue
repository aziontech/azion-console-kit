<script setup>
  import FormFieldsDrawerOrigin from '@/views/EdgeApplicationsOrigins/FormFields/FormFieldsEdgeApplicationsOrigins'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import CopyKeyDialog from '@templates/dialog-copy-key'
  import { refDebounced } from '@vueuse/core'
  import { useToast } from 'primevue/usetoast'
  import { onMounted } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { loadProductsListService } from '@/services/contract-services'
  import { useDialog } from 'primevue/usedialog'
  import { createOriginService } from '@/services/edge-application-origins-services'
  import { inject, ref } from 'vue'
  import * as yup from 'yup'
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')
  defineOptions({ name: 'drawer-origin' })

  const emit = defineEmits(['onSuccess'])
  const dialog = useDialog()

  const props = defineProps({
    showBarGoBack: {
      type: Boolean,
      default: true
    },
    edgeApplicationId: {
      type: String,
      required: true
    },
    editOriginService: {
      type: Function
    },
    loadOriginService: {
      type: Function
    },
    documentationService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    isLoadBalancerEnabled: {
      type: Boolean,
      required: true
    }
  })

  onMounted(async () => {
    const products = await loadProductsListService({ clientId: accountStore.account.client_id })
    if (products.slugs.includes('live_ingest')) {
      hasLiveIngest.value = true
    }
    originTypesOptions.value.push({
      label: 'Live Ingest',
      value: 'live_ingest',
      disabled: !hasLiveIngest.value
    })
  })

  const accountStore = useAccountStore()
  const toast = useToast()
  const showCreateOriginDrawer = ref(false)
  const hasLiveIngest = ref(false)
  const showEditOriginDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateOriginDrawer = refDebounced(showCreateOriginDrawer, debouncedDrawerAnimate)
  const loadEditOriginDrawer = refDebounced(showEditOriginDrawer, debouncedDrawerAnimate)
  const selectedOriginToEdit = ref('')
  const originTypesOptions = ref([
    {
      label: 'Single Origin',
      value: 'single_origin',
      disabled: false
    },
    {
      label: 'Load Balancer',
      value: 'load_balancer',
      disabled: !props.isLoadBalancerEnabled
    },
    {
      label: 'Edge Storage',
      value: 'object_storage',
      disabled: false
    }
  ])

  const initialValues = ref({
    id: props.edgeApplicationId,
    originKey: '',
    name: '',
    hostHeader: '${host}',
    addresses: [
      {
        address: '',
        weight: 1,
        serverRole: 'primary',
        isActive: true
      }
    ],
    originType: 'single_origin',
    originProtocolPolicy: 'preserve',
    method: 'ip_hash',
    originPath: '',
    connectionTimeout: 60,
    timeoutBetweenBytes: 120,
    hmacAuthentication: false,
    hmacRegionName: '',
    hmacAccessKey: '',
    hmacSecretKey: '',
    bucketName: null,
    prefix: ''
  })

  const createFormDrawer = ref('')
  const originKey = ref('')

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    originType: yup.string().required().label('Origin Type'),
    hostHeader: yup
      .string()
      .label('Host Header')
      .when('originType', {
        is: (originType) => originType !== 'object_storage' && originType !== 'live_ingest',
        then: (schema) => schema.required()
      }),
    addresses: yup.array().when('originType', {
      is: (originType) => originType === 'object_storage' || originType === 'live_ingest',
      then: (schema) => schema.optional(),
      otherwise: (schema) =>
        schema.of(
          yup.object().shape({
            address: yup.string().label('Address').required(),
            weight: yup.number().nullable().label('Weight'),
            isActive: yup.boolean().default(true).label('Active')
          })
        )
    }),
    originPath: yup
      .string()
      .test('valid', 'Use a valid origin path.', (value) => {
        return /^(\/\.?[\w][\w.-]*)+$/.test(value) || !value
      })
      .label('Origin Path'),
    streamingEndpoint: yup
      .string()
      .label('Streaming Endpoint')
      .when('originType', {
        is: (originType) => originType === 'live_ingest',
        then: (schema) => schema.required()
      }),
    hmacAuthentication: yup.boolean(),
    hmacRegionName: yup
      .string()
      .when('hmacAuthentication', {
        is: true,
        then: (schema) => schema.required()
      })
      .label('Region Name'),
    hmacAccessKey: yup
      .string()
      .when('hmacAuthentication', {
        is: true,
        then: (schema) => schema.required()
      })
      .label('Access Key'),
    hmacSecretKey: yup
      .string()
      .when('hmacAuthentication', {
        is: true,
        then: (schema) => schema.required()
      })
      .label('Secret Key'),
    bucketName: yup
      .string()
      .when('originType', {
        is: 'object_storage',
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.notRequired()
      })
      .label('Bucket Name')
  })

  const editService = async (payload) => {
    payload.id = payload.originKey
    return await props.editOriginService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const loadService = async (payload) => {
    const edgeNode = await props.loadOriginService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
    return edgeNode
  }

  const openDrawerCreate = () => {
    showCreateOriginDrawer.value = true
  }

  const openDrawerEdit = (id) => {
    if (id) {
      selectedOriginToEdit.value = id.toString()
      showEditOriginDrawer.value = true
    }
  }

  const handleTrackEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Origin'
      })
      .product.productEdited({
        productName: 'Edge Application',
        tab: 'origins'
      })
      .track()

    emit('onSuccess')
  }

  const closeDrawerEdit = () => {
    showEditOriginDrawer.value = false
  }

  const handleTrackCreation = () => {
    tracker.product
      .productCreated({
        productName: 'Origin'
      })
      .track()
  }

  const copyToKey = async (originKey) => {
    props.clipboardWrite(originKey)

    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  const handleFailedEditOrigin = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Origin',
        errorMessage: message,
        fieldName: fieldName,
        errorType: 'api'
      })
      .track()

    closeDrawerEdit()
  }

  const handleFailedCreateOrigin = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Origin',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleCreateOrigin = (feedback) => {
    handleTrackCreation()

    dialog.open(CopyKeyDialog, {
      data: {
        title: 'Origin Key',
        key: feedback.originKey,
        copy: copyToKey
      }
    })

    originKey.value = feedback.originKey
    emit('onSuccess')
  }

  defineExpose({
    showCreateOriginDrawer,
    openDrawerCreate,
    openDrawerEdit
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateOriginDrawer"
    v-model:visible="showCreateOriginDrawer"
    :createService="createOriginService"
    drawerId="create-origin-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateOrigin"
    @onError="handleFailedCreateOrigin"
    title="Create Origin"
  >
    <template #formFields="{ disabledFields, errors }">
      {{ errors }}
      <FormFieldsDrawerOrigin
        ref="createFormDrawer"
        :disabledFields="disabledFields"
        :listOrigins="originTypesOptions"
        :copyToClipboard="copyToKey"
      />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditOriginDrawer"
    :id="selectedOriginToEdit"
    v-model:visible="showEditOriginDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="handleTrackEdit"
    showBarGoBack
    @onError="handleFailedEditOrigin"
    title="Edit Origin"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerOrigin
        isEditMode
        :disabledFields="disabledFields"
        :listOrigins="originTypesOptions"
        :copyToClipboard="copyToKey"
      />
    </template>
  </EditDrawerBlock>
</template>
