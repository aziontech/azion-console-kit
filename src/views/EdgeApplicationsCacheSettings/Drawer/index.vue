<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsEdgeApplicationCacheSettings from '../FormFields/FormFieldsEdgeApplicationCacheSettings'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref, inject, computed } from 'vue'
  import { CDN_MAXIMUM_TTL_MAX_VALUE, CDN_MAXIMUM_TTL_MIN_VALUE } from '@/utils/constants'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'edge-application-cache-settings-drawer'
  })
  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
    },
    createService: {
      type: Function
    },
    loadService: {
      type: Function
    },
    editService: {
      type: Function
    },
    showTieredCache: {
      type: Boolean,
      required: true
    }
  })

  const showCreateCacheSettingsDrawer = ref(false)
  const showEditCacheSettingsDrawer = ref(false)
  const selectedCacheSettingsToEdit = ref('')
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateCacheSettingsDrawer, debouncedDrawerAnimate)
  const showEditDrawer = refDebounced(showEditCacheSettingsDrawer, debouncedDrawerAnimate)

  const MAX_TTL_ONE_YEAR_IN_SECONDS = 31536000
  const LOCKED_SLICE_RANGE_IN_KBYTES = 1024

  const initialValues = ref({
    name: '',
    browserCacheSettings: 'honor',
    browserCacheSettingsMaximumTtl: 0,
    cdnCacheSettings: 'honor',
    cdnCacheSettingsMaximumTtl: 60,
    sliceConfigurationEnabled: false,
    sliceConfigurationRange: LOCKED_SLICE_RANGE_IN_KBYTES,
    cacheByQueryString: 'ignore',
    queryStringFields: '',
    enableQueryStringSort: false,
    enableCachingForPost: false,
    enableCachingForOptions: false,
    enableStaleCache: true,
    cacheByCookies: 'ignore',
    cookieNames: '',
    adaptiveDeliveryAction: 'ignore',
    deviceGroup: [],
    l2CachingEnabled: false,
    isSliceL2CachingEnabled: false,
    isSliceEdgeCachingEnabled: false
  })

  const minimumAcceptableValue = computed(() =>
    props.isApplicationAcceleratorEnabled || props.showTieredCache
      ? CDN_MAXIMUM_TTL_MIN_VALUE
      : CDN_MAXIMUM_TTL_MAX_VALUE
  )
  const minimumAcceptableValueWhenIsHonor = ref(minimumAcceptableValue.value)
  const l2CachingEnabled = ref()

  const setNewMinimumValue = (value) => {
    l2CachingEnabled.value = value
    if (l2CachingEnabled.value || props.isApplicationAcceleratorEnabled) {
      minimumAcceptableValueWhenIsHonor.value = CDN_MAXIMUM_TTL_MIN_VALUE
    } else {
      minimumAcceptableValueWhenIsHonor.value = CDN_MAXIMUM_TTL_MAX_VALUE
    }
  }

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    browserCacheSettings: yup.string().required().label('Browser cache settings'),
    browserCacheSettingsMaximumTtl: yup
      .number()
      .label('Maximum TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('browserCacheSettings', {
        is: 'honor',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.min(0).max(MAX_TTL_ONE_YEAR_IN_SECONDS).required()
      }),
    cdnCacheSettings: yup.string().required().label('Edge cache settings'),
    cdnCacheSettingsMaximumTtl: yup
      .number()
      .label('Edge Maximum TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('cdnCacheSettings', {
        is: 'honor',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) =>
          schema
            .min(minimumAcceptableValueWhenIsHonor.value)
            .max(MAX_TTL_ONE_YEAR_IN_SECONDS)
            .required()
      })
      .min(minimumAcceptableValue.value)
      .max(MAX_TTL_ONE_YEAR_IN_SECONDS)
      .required(),
    sliceConfigurationEnabled: yup.boolean().required(),
    sliceConfigurationRange: yup
      .number()
      .label('Large File Optimization Fragment Size')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('sliceConfigurationEnabled', {
        is: false,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) =>
          schema.required().min(LOCKED_SLICE_RANGE_IN_KBYTES).max(LOCKED_SLICE_RANGE_IN_KBYTES)
      }),
    cacheByQueryString: yup.string().required().label('Cache by query string'),
    queryStringFields: yup
      .string()
      .label('Query string fields')
      .when('cacheByQueryString', {
        is: (value) => ['whitelist', 'blacklist'].includes(value),
        then: (schema) => schema.required()
      }),
    enableQueryStringSort: yup.boolean(),
    enableCachingForPost: yup.boolean(),
    enableCachingForOptions: yup.boolean(),
    enableStaleCache: yup.boolean(),
    cacheByCookies: yup.string().required().label('Cache by cookies'),
    cookieNames: yup
      .string()
      .label('Cookie Names')
      .when('cacheByCookies', {
        is: (value) => ['whitelist', 'blacklist'].includes(value),
        then: (schema) => schema.required()
      }),
    adaptiveDeliveryAction: yup.string().label('Adaptive Delivery Action'),
    deviceGroup: yup.array().of(
      yup.object().shape({
        id: yup.string().required().label('Device group id')
      })
    )
  })

  const closeCreateDrawer = () => {
    showCreateCacheSettingsDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateCacheSettingsDrawer.value = true
  }
  const openEditDrawer = (cacheSettingsId) => {
    selectedCacheSettingsToEdit.value = `${cacheSettingsId}`
    showEditCacheSettingsDrawer.value = true
  }

  const createServiceWithEdgeApplicationIdDecorator = async (payload) => {
    const result = await props.createService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
    return result
  }

  const loadCacheSettingsServiceWithDecorator = async (payload) => {
    return props.loadService({
      edgeApplicationId: props.edgeApplicationId,
      id: payload.id
    })
  }
  const editCacheSettingsServiceWithDecorator = async (payload) => {
    return props.editService({
      edgeApplicationId: props.edgeApplicationId,
      ...payload
    })
  }

  const handleCreateCacheSettings = () => {
    handleTrackCreation()
    emit('onSuccess')
    closeCreateDrawer()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product.productEdited({
      productName: 'Cache Settings'
    })
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'cacheSettings'
      })
      .track()
  }

  const handleTrackCreation = () => {
    tracker.product
      .productCreated({
        productName: 'Cache Settings'
      })
      .track()
  }

  const handleEditedCacheSettings = () => {
    emit('onSuccess')
    handleTrackSuccessEdit()
    closeCreateDrawer()
  }

  const handleFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Cache Settings',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleFailedToEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Cache Settings',
        errorMessage: message,
        fieldName: fieldName,
        errorType: 'api'
      })
      .track()

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
    v-model:visible="showCreateCacheSettingsDrawer"
    :createService="createServiceWithEdgeApplicationIdDecorator"
    id="create-cache-settings-drawer"
    drawerId="create-cache-settings-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCacheSettings"
    @onError="handleFailedToCreate"
    title="Create Cache Settings"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationCacheSettings
        :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
        :showTieredCache="props.showTieredCache"
        @l2-caching-enabled="setNewMinimumValue"
      />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedCacheSettingsToEdit"
    v-model:visible="showEditCacheSettingsDrawer"
    :loadService="loadCacheSettingsServiceWithDecorator"
    :editService="editCacheSettingsServiceWithDecorator"
    :schema="validationSchema"
    @onSuccess="handleEditedCacheSettings"
    @onError="handleFailedToEdit"
    title="Edit Cache Settings"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationCacheSettings
        :isApplicationAcceleratorEnabled="isApplicationAcceleratorEnabled"
        :showTieredCache="props.showTieredCache"
        @l2-caching-enabled="setNewMinimumValue"
      />
    </template>
  </EditDrawerBlock>
</template>
