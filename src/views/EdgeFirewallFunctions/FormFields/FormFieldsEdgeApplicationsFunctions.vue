<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Drawer from '@/views/EdgeFunctions/Drawer/index.vue'
  import { useField } from 'vee-validate'
  import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
  import { computed, ref, watch } from 'vue'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader.vue'
  import { edgeFunctionService } from '@/services/v2'

  const emit = defineEmits(['toggleDrawer'])

  const drawerRef = ref('')
  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleDrawerSuccess = (functionId) => {
    edgeFunctionID.value = functionId
  }

  const changeArgs = async (target) => {
    if (target?.defaultArgs) {
      args.value = target.defaultArgs
    }
  }

  const listEdgeFunctionsServiceDecorator = (queryParams) => {
    return edgeFunctionService.listEdgeFunctionsDropdown({
      executionEnvironment: 'firewall',
      fields: ['id', 'name', 'default_args', 'execution_environment'],
      ...queryParams
    })
  }

  const loadEdgeFunctionServiceDecorator = (queryParams) => {
    return edgeFunctionService.loadEdgeFunction({
      ...queryParams,
      fields: ['id', 'name', 'default_args']
    })
  }

  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args, errorMessage: argsError } = useField('args')

  const hasArgsError = computed(() => {
    return !!argsError.value
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
    description="Instantiate a function within your Firewall. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          v-model="name"
          description="Give a unique and descriptive name to identify the Firewall function instance."
          placeholder="My Firewall function instance"
          data-testid="edge-firewall-functions-form__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Function"
    description="Select an existing Function and customize the arguments. Only Functions previously created in the Functions module can be instantiated."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <Drawer
          ref="drawerRef"
          @onSuccess="handleDrawerSuccess"
        />
        <FieldDropdownLazyLoader
          label="Function"
          name="edgeFunctionID"
          required
          :service="listEdgeFunctionsServiceDecorator"
          :loadService="loadEdgeFunctionServiceDecorator"
          :value="edgeFunctionID"
          :moreOptions="['defaultArgs']"
          disableEmitFirstRender
          @onSelectOption="changeArgs"
          optionLabel="name"
          optionValue="id"
          appendTo="self"
          data-testid="edge-firewall-functions-form__edge-function-dropdown"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  data-testid="edge-firewall-functions-form__create-function-button"
                  text
                  @click="openDrawer"
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Function"
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
        <CodeEditor
          v-model="args"
          runtime="json"
          class="min-h-[200px] overflow-clip surface-border border rounded-md"
          :errors="hasArgsError"
          :minimap="false"
        />
        <small
          v-if="argsError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ argsError }}
        </small>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Customize the arguments in JSON format. Once set, they can be called in code using
          <code>event.args("arg_name")</code>.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>
