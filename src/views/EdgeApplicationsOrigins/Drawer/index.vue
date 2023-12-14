<script setup>
  import { ref } from 'vue'
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
    createResourcesServices: {
      type: Function,
      required: true
    },
    editResourcesServices: {
      type: Function,
      required: true
    },
    loadResourcesServices: {
      type: Function,
      required: true
    }
  })

  const showCreateResourceDrawer = ref(false)
  const showEditResourceDrawer = ref(false)
  const debouncedDrawerEdit = 300
  const loadEditResourceDrawer = refDebounced(showEditResourceDrawer, debouncedDrawerEdit)
  const selectedOriginToEdit = ref('')

  const initialValues = ref({
    id: props.edgeApplicationId,
    name: '',
    hostHeader: '${host}',
    method: 'ip_hash',
    originPath: '',
    addresses: [
      {
        address: '',
        weight: 1,
        serverRole: 'primary',
        isActive: true
      }
    ],
    originProtocolPolicy: 'preserve',
    originType: 'load_balancer',
    key: '',
    hmacAuthentication: false,
    hmacRegionName: '',
    hmacAccessKey: '',
    hmacSecretKey: '',
    connectionTimeout: 60,
    timeoutBetweenBytes: 120
  })

  const validationSchema = yup.object({
    name: yup.string().required(),
    addresses: yup.array().of(
      yup.object().shape({
        address: yup.string().required(),
        isActive: yup.boolean()
      })
    )
  })

  const editService = async (payload) => {
    return await props.editResourcesServices({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const loadService = async (payload) => {
    const edgeNode = await props.loadResourcesServices({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
    return edgeNode
  }

  const openDrawerCreate = () => {
    showCreateResourceDrawer.value = true
  }

  const openDrawerEdit = (id) => {
    if (id) {
      selectedOriginToEdit.value = id.toString()
      showEditResourceDrawer.value = true
    }
  }

  const closeDrawerEdit = () => {
    showEditResourceDrawer.value = false
  }

  // const props = defineProps({
  //   createOriginService: {
  //     type: Function,
  //     required: true
  //   }
  // })

  // async function createOriginWithEdgeApplicationIdDecorator(formValues) {
  //   const { id } = route.params
  //   return await props.createOriginService(formValues, id)
  // }

  // async function editOriginWithEdgeApplicationIdDecorator(formValues) {
  //   const { id } = route.params
  //   return await props.editOriginService(formValues, id)
  // }
  // async function loadOrigin() {
  //   const { id, originKey } = route.params
  //   return await props.loadOriginService({ id, originKey })
  // }

  defineExpose({
    openDrawerCreate,
    openDrawerEdit
  })
</script>

<template>
  <CreateDrawerBlock
    v-model:visible="showCreateResourceDrawer"
    :createService="createResourcesServices"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="emit('onSuccess')"
    title="Create Resource"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerOrigin :disabledFields="disabledFields" />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditResourceDrawer"
    :id="selectedOriginToEdit"
    v-model:visible="showEditResourceDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="emit('onSuccess')"
    @onError="closeDrawerEdit"
    title="Edit Resource"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerOrigin :disabledFields="disabledFields" />
    </template>
  </EditDrawerBlock>
</template>
