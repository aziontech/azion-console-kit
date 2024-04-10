<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsEdgeApplicationCacheSettings from '../FormFields/FormFieldsEdgeApplicationCacheSettings'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref, inject } from 'vue'
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
    createService: {
      type: Function,
      required: true
    },
    loadService: {
      type: Function,
      required: true
    },
    editService: {
      type: Function,
      required: true
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
        otherwise: (schema) => schema.min(60).max(MAX_TTL_ONE_YEAR_IN_SECONDS).required()
      }),
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
    emit('onSuccess')
    closeCreateDrawer()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Edge Application',
        tab: 'cacheSettings'
      })
      .track()
  }

  const handleEditedCacheSettings = () => {
    emit('onSuccess')
    handleTrackSuccessEdit()
    closeCreateDrawer()
  }

  defineExpose({
    openCreateDrawer,
    openEditDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateCacheSettingsDrawer"
    :createService="createServiceWithEdgeApplicationIdDecorator"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCacheSettings"
    title="Create Cache Settings"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationCacheSettings :showTieredCache="props.showTieredCache" />
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
    title="Edit Cache Settings"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationCacheSettings :showTieredCache="props.showTieredCache" />
    </template>
  </EditDrawerBlock>
</template>
