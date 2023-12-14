<script setup>
  import { ref } from 'vue'
  import * as yup from 'yup'
  import FormFieldsDrawerResource from '@/views/EdgeServices/FormFields/FormFieldsDrawerResource'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import { refDebounced } from '@vueuse/core'

  defineOptions({ name: 'drawer-service' })

  const emit = defineEmits(['onSuccess'])
  const props = defineProps({
    edgeServiceId: {
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
  const selectedResourceToEdit = ref('')
  const defaultTrigger = 'Install'
  const debouncedDrawerEdit = 300
  const contentTypeShellScript = 'Shell Script'
  const showEditResourceDrawer = ref(false)
  const loadEditResourceDrawer = refDebounced(showEditResourceDrawer, debouncedDrawerEdit)
  const initialValues = {
    name: '',
    contentType: contentTypeShellScript,
    trigger: defaultTrigger,
    content: '',
    id: props.edgeServiceId
  }

  const validationSchema = yup.object({
    name: yup
      .string()
      .required()
      .test('validateFilePath', 'Must be a valid file path', (val) => {
        const isValid = /^(\/\.?[\w][\w.-]*)+$/.test(val)
        return isValid
      })
      .label('Path'),
    contentType: yup.string().required(),
    trigger: yup.string().when('contentType', {
      is: contentTypeShellScript,
      then: (schema) => schema.required()
    }),
    content: yup.string().required().label('Content'),
    id: yup.string().required()
  })

  const editService = async (payload) => {
    return await props.editResourcesServices({
      ...payload,
      edgeServiceId: props.edgeServiceId
    })
  }

  const loadService = async (payload) => {
    const edgeNode = await props.loadResourcesServices({
      ...payload,
      edgeServiceId: props.edgeServiceId
    })
    return edgeNode
  }

  const openDrawerCreate = () => {
    showCreateResourceDrawer.value = true
  }

  const openDrawerEdit = (id) => {
    if (id) {
      selectedResourceToEdit.value = id.toString()
      showEditResourceDrawer.value = true
    }
  }

  const closeDrawerEdit = () => {
    showEditResourceDrawer.value = false
  }

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
      <FormFieldsDrawerResource :disabledFields="disabledFields" />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="loadEditResourceDrawer"
    :id="selectedResourceToEdit"
    v-model:visible="showEditResourceDrawer"
    :loadService="loadService"
    :editService="editService"
    :schema="validationSchema"
    @onSuccess="emit('onSuccess')"
    @onError="closeDrawerEdit"
    title="Edit Resource"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDrawerResource :disabledFields="disabledFields" />
    </template>
  </EditDrawerBlock>
</template>
