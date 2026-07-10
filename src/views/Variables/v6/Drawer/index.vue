<script setup>
  import { computed, ref } from 'vue'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsVariablesV6 from '../components/FormFieldsVariablesV6.vue'
  import ScopeReadonlyCard from '../components/ScopeReadonlyCard.vue'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'

  defineOptions({ name: 'variable-scoped-drawer' })

  const emit = defineEmits(['update:visible', 'onSuccess'])

  const props = defineProps({
    scopeType: {
      type: String,
      required: true,
      validator: (value) => ['application', 'firewall'].includes(value)
    },
    scopeId: {
      type: [String, Number],
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    },
    variableId: {
      type: String,
      default: null
    }
  })

  const keyRegex = /^[A-Z0-9_]*$/

  const isEditMode = computed(() => !!props.variableId)

  const schema = computed(() =>
    yup.object({
      key: yup
        .string()
        .test('key', 'Invalid key format', (value) => keyRegex.test(value))
        .required(),
      value: isEditMode.value ? yup.string() : yup.string().required(),
      secret: yup.boolean().required().default(false)
    })
  )

  const displayScope = computed(() => [
    { type: props.scopeType, [`${props.scopeType}_id`]: String(props.scopeId) }
  ])

  const scopeLockLabel = computed(
    () => `Locked to this ${props.scopeType === 'firewall' ? 'Firewall' : 'Application'}`
  )

  const createInitialValues = computed(() => ({
    scope: [{ type: 'resource', resourceType: props.scopeType, id: String(props.scopeId) }],
    secret: false
  }))

  const initialRef = ref(null)

  const secretLocked = computed(() => initialRef.value?.secret === true)

  const loadService = async ({ id }) => {
    const variable = await variablesV6Service.load({ id })
    initialRef.value = variable
    return variable
  }

  const editService = (values) =>
    variablesV6Service.edit({
      id: props.variableId,
      values,
      initialValues: initialRef.value
    })

  const visibleModel = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const handleSuccess = () => {
    emit('onSuccess')
  }
</script>

<template>
  <CreateDrawerBlock
    v-if="!variableId"
    v-model:visible="visibleModel"
    drawerId="variable-scoped-drawer"
    title="Create Variable"
    :createService="variablesV6Service.create"
    :schema="schema"
    :initialValues="createInitialValues"
    @onSuccess="handleSuccess"
  >
    <template #formFields>
      <FormFieldsVariablesV6 />
      <ScopeReadonlyCard
        :scopes="displayScope"
        :lock-label="scopeLockLabel"
      />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-else
    :key="variableId"
    :id="variableId"
    v-model:visible="visibleModel"
    title="Edit Variable"
    :loadService="loadService"
    :editService="editService"
    :schema="schema"
    @onSuccess="handleSuccess"
  >
    <template #formFields>
      <FormFieldsVariablesV6 :secretLocked="secretLocked" />
      <ScopeReadonlyCard
        :scopes="displayScope"
        :lock-label="scopeLockLabel"
      />
    </template>
  </EditDrawerBlock>
</template>
