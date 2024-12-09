<script setup>
  import { useAccountStore } from '@/stores/account'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import PrimeButton from 'primevue/button'
  import Drawer from '@/views/EdgeFunctions/Drawer/index.vue'

  import { useField } from 'vee-validate'
  import { computed, ref, watch } from 'vue'

  const emit = defineEmits(['toggleDrawer'])

  const props = defineProps({
    listEdgeFunctionsService: {
      type: Function,
      required: true
    },
    loadEdgeFunctionService: {
      type: Function,
      required: true
    }
  })

  const drawerRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleDrawerSuccess = (response) => {
    edgeFunctionID.value = response.functionId
  }

  const store = useAccountStore()

  const changeArgs = (target) => {
    if (target?.args) {
      args.value = target?.args
    }
  }

  const listEdgeFunctionsServiceDecorator = (queryParams) => {
    return props.listEdgeFunctionsService({
      initiatorType: 'edge_application',
      ...queryParams
    })
  }

  const editorOptions = computed(() => {
    return {
      minimap: { enabled: false },
      tabSize: 2,
      formatOnPaste: true
    }
  })
  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args } = useField('args')

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  watch(
    () => drawerRef.value.showCreateDrawer,
    () => {
      emit('toggleDrawer', drawerRef.value.showCreateDrawer)
    }
  )
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Instantiate a serverless function created with Edge Functions within the edge application. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="edge-application-function-instance-form__name-field"
          label="Name"
          required
          name="name"
          v-model="name"
          placeholder="My edge application function instance"
          description="Give a unique and descriptive name to identify the function instance."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Edge Function"
    description="Select an existing edge function and customize the arguments. Only edge functions previously created in the Edge Functions module can be instantiated."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <Drawer
          ref="drawerRef"
          @onSuccess="handleDrawerSuccess"
        />
        <FieldDropdownLazyLoader
          data-testid="edge-application-function-instance-form__edge-function"
          label="Edge Function"
          required
          name="edgeFunctionID"
          :service="listEdgeFunctionsServiceDecorator"
          :loadService="loadEdgeFunctionService"
          :moreOptions="['args']"
          optionLabel="label"
          optionValue="value"
          :value="edgeFunctionID"
          inputId="edgeFunctionID"
          @onSelectOption="changeArgs"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-applications-functions-form__create-function-button"
                  text
                  @click="openDrawer"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Function"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="flex flex-col gap-2 w-full">
        <label
          for="arguments"
          class="text-color text-sm font-medium leading-5"
          >Arguments</label
        >
        <vue-monaco-editor
          v-model:value="args"
          language="json"
          :theme="theme"
          :options="editorOptions"
          class="min-h-[200px] overflow-clip surface-border border rounded-md"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Customize the arguments in JSON format. Once set, they can be called in code using
          <code>event.args("arg_name")</code>.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>
