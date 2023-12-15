<script setup>
  import { ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsDrawerOrigin from '@/views/EdgeApplicationsOrigins/FormFields/FormFieldsEdgeApplicationsOrigins'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { refDebounced } from '@vueuse/core'
  defineOptions({ name: 'drawer-origin' })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    createOriginService: {
      type: Function,
      required: true
    },
    editOriginService: {
      type: Function,
      required: true
    },
    loadOriginService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()
  const showCreateOriginDrawer = ref(false)
  const showEditOriginDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateOriginDrawer = refDebounced(showCreateOriginDrawer, debouncedDrawerAnimate)
  const loadEditOriginDrawer = refDebounced(showEditOriginDrawer, debouncedDrawerAnimate)
  const selectedOriginToEdit = ref('')
  const ORIGIN_TYPES_OPTIONS = [
    {
      label: 'Single Origin',
      value: 'single_origin',
      disabled: false
    },
    {
      label: 'Load Balancer',
      value: 'load_balancer',
      disabled: false
    }
  ]

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
    hmacSecretKey: ''
  })
  
  const originKey = ref('')
  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    originType: yup.string().required().label('Origin Type'),
    hostHeader: yup.string().required().label('Host Header'),
    addresses: yup.array().of(
      yup.object().shape({
        address: yup.string().required().label('Address'),
        weight: yup.number().required().label('Weight'),
        isActive: yup.boolean()
      })
    ),
    originPath: yup
      .string()
      .test('valid', 'Use a valid origin path.', (value) => {
        return /^(\/\.?[\w][\w.-]*)+$/.test(value) || !value
      })
      .label('Origin Path'),
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
      .label('Secret Key')
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

  const closeDrawerEdit = () => {
    showEditOriginDrawer.value = false
  }

  const copyToKey = async (originKey) => {
    props.clipboardWrite(originKey)

    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Origin key copied to clipboard!'
    })
  }

  const handleCreateOrigin = (feedback) => {
    originKey.value = feedback.originKey
    emit('onSuccess')
  }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateOriginDrawer"
    v-model:visible="showCreateOriginDrawer"
    :createService="props.createOriginService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateOrigin"
    :showBarGoBack="true"
    title="Create Origin"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerOrigin
        :disabledFields="disabledFields"
        :listOrigins="ORIGIN_TYPES_OPTIONS"
        :copyToClipboard="copyToKey"
        :generatedOriginKey="originKey"
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
    @onSuccess="emit('onSuccess')"
    :showBarGoBack="true"
    @onError="closeDrawerEdit"
    title="Edit Resource"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerOrigin
        :disabledFields="disabledFields"
        :listOrigins="ORIGIN_TYPES_OPTIONS"
        :copyToClipboard="copyToKey"
      />
    </template>
  </EditDrawerBlock>
</template>
