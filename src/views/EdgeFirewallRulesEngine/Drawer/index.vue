<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import CreateFormFields from '../FormFields/CreateFormFields.vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { ref } from 'vue'

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
    editService: {
      type: Function,
      required: true
    }
  })

  const showCreateRulesEngineDrawer = ref(false)
  const showEditRulesEngineDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const selectedRulesEngineToEdit = ref('')

  const showCreateDrawer = refDebounced(showCreateRulesEngineDrawer, DEBOUNCE_TIME_IN_MS)
  const showEditDrawer = refDebounced(showEditRulesEngineDrawer, DEBOUNCE_TIME_IN_MS)

  const initialValues = ref({
    name: '',
    description: '',
    active: true,
    criteria: [
      [
        {
          variable: 'header_accept',
          operator: 'matches',
          conditional: 'if',
          input_value: ''
        }
      ]
    ],
    behaviors: [
      {
        name: '',
        target: {}
      }
    ]
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
              then: (schema) => schema.required().label('conditional value'),
              otherwise: (schema) => schema.notRequired()
            })
          })
        )
        .required()
    ),
    behaviors: yup.array().of(
      yup.object({
        name: yup.string().required().label('behavior'),
        target: yup.object()
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

  const handleCreateWithSuccess = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  const handleEditWithSuccess = () => {
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
    v-model:visible="showCreateRulesEngineDrawer"
    :createService="props.createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateWithSuccess"
    title="Create Cache Settings"
  >
    <template #formFields>
      <CreateFormFields />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedRulesEngineToEdit"
    v-model:visible="showEditRulesEngineDrawer"
    :loadService="() => {}"
    :editService="() => {}"
    :schema="{}"
    @onSuccess="handleEditWithSuccess"
    title="Edit Rules Engine"
  >
    <template #formFields>
      <p>edit form fields, criar EditFormFields</p>
    </template>
  </EditDrawerBlock>
</template>
