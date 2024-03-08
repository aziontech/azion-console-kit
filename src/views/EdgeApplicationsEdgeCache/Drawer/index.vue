<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsEdgeApplicationEdgeCache from '../FormFields/FormFieldsEdgeApplicationEdgeCache'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'

  defineOptions({
    name: 'edge-application-edge-cache-drawer'
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
    }
  })

  const showCreateEdgeCacheDrawer = ref(false)
  const showEditEdgeCacheDrawer = ref(false)
  const selectedEdgeCacheToEdit = ref('')
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateEdgeCacheDrawer, debouncedDrawerAnimate)
  const showEditDrawer = refDebounced(showEditEdgeCacheDrawer, debouncedDrawerAnimate)

  const MAX_TTL_ONE_YEAR_IN_SECONDS = 31536000
  const LOCKED_SLICE_RANGE_IN_KBYTES = 1024

  const initialValues = ref({
    name: '',
    browserEdgeCache: 'honor',
    browserEdgeCacheMaximumTtl: 0,
    cdnEdgeCache: 'honor',
    cdnEdgeCacheMaximumTtl: 60,
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
    deviceGroup: []
  })
  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    browserEdgeCache: yup.string().required().label('Browser edge cache'),
    browserEdgeCacheMaximumTtl: yup
      .number()
      .label('Maximum TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('browserEdgeCache', {
        is: 'honor',
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.min(0).max(MAX_TTL_ONE_YEAR_IN_SECONDS).required()
      }),
    cdnEdgeCache: yup.string().required().label('Edge cache'),
    cdnEdgeCacheMaximumTtl: yup
      .number()
      .label('Edge Maximum TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('cdnEdgeCache', {
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
    showCreateEdgeCacheDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateEdgeCacheDrawer.value = true
  }
  const openEditDrawer = (edgeCacheId) => {
    selectedEdgeCacheToEdit.value = `${edgeCacheId}`
    showEditEdgeCacheDrawer.value = true
  }

  const createServiceWithEdgeApplicationIdDecorator = async (payload) => {
    const result = await props.createService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
    return result
  }

  const loadEdgeCacheServiceWithDecorator = async (payload) => {
    return props.loadService({
      edgeApplicationId: props.edgeApplicationId,
      id: payload.id
    })
  }
  const editEdgeCacheServiceWithDecorator = async (payload) => {
    return props.editService({
      edgeApplicationId: props.edgeApplicationId,
      ...payload
    })
  }

  const handleCreateEdgeCache = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  const handleEditedEdgeCache = () => {
    emit('onSuccess')
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
    v-model:visible="showCreateEdgeCacheDrawer"
    :createService="createServiceWithEdgeApplicationIdDecorator"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateEdgeCache"
    title="Create Edge Cache"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationEdgeCache />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedEdgeCacheToEdit"
    v-model:visible="showEditEdgeCacheDrawer"
    :loadService="loadEdgeCacheServiceWithDecorator"
    :editService="editEdgeCacheServiceWithDecorator"
    :schema="validationSchema"
    @onSuccess="handleEditedEdgeCache"
    title="Edit Edge Cache"
  >
    <template #formFields>
      <FormFieldsEdgeApplicationEdgeCache />
    </template>
  </EditDrawerBlock>
</template>
