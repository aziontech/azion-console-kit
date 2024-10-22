<script setup>
  import { useAccountStore } from '@/stores/account'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  import CreateEdgeServiceDrawer from '@/views/EdgeServices/CreateEdgeServiceDrawer'

  import { useField } from 'vee-validate'
  import { computed, ref, onMounted, watch } from 'vue'
  defineOptions({ name: 'form-fields-drawer-service' })
  const emit = defineEmits(['toggleDrawer'])

  const props = defineProps({
    listServicesHandle: {
      type: Function,
      required: true
    },
    disabledFields: {
      type: Boolean,
      default: false
    },
    edgeNodeId: {
      type: String,
      required: true
    },
    bound: {
      type: Boolean
    },
    reloadServices: {
      type: Function,
      required: true
    }
  })

  const listService = ref([])
  const drawerRef = ref('')
  const loadingOptionsServices = ref(false)
  const toast = useToast()

  const getServices = async () => {
    try {
      loadingOptionsServices.value = true
      listService.value = await props.listServicesHandle({
        edgeNodeId: props.edgeNodeId,
        bound: props.bound
      })
    } catch (error) {
      showToast('error', error)
    } finally {
      loadingOptionsServices.value = false
    }
  }

  const { value: variables, errorMessage: variablesError } = useField('variables')
  const { value: serviceId } = useField('serviceId')

  const showToast = (severity, summary) => {
    toast.add({
      closable: true,
      severity,
      summary
    })
  }

  const editorOptions = computed(() => {
    return {
      minimap: { enabled: false },
      tabSize: 2,
      formatOnPaste: true,
      readOnly: props.disabledFields
    }
  })

  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const store = useAccountStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  watch(
    () => drawerRef.value.showCreateDrawer,
    () => {
      emit('toggleDrawer', drawerRef.value.showCreateDrawer)
    }
  )

  const handleDrawerSuccess = (id) => {
    getServices()
    serviceId.value = id
  }

  onMounted(() => {
    getServices()
  })
</script>

<template>
  <form-horizontal
    :isDrawer="true"
    title="Services"
    description="Provision services created in the Edge Service library and customize variables."
  >
    <template #inputs>
      <CreateEdgeServiceDrawer
        ref="drawerRef"
        @onSuccess="handleDrawerSuccess"
      />
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <div class="flex w-80 sm:max-w-lg flex-col items-start gap-2">
            <FieldDropdown
              label="Service"
              required
              name="serviceId"
              :options="listService"
              :loading="loadingOptionsServices"
              :disabled="props.bound"
              optionLabel="name"
              optionValue="serviceId"
              :value="serviceId"
              filter
              appendTo="self"
              class="w-full"
              description="Select the service to be provisioned."
            >
              <template #footer>
                <ul class="p-2">
                  <li>
                    <PrimeButton
                      class="w-full whitespace-nowrap flex"
                      data-testid="edge-applications-rules-engine-form__create-cache-policy-button"
                      text
                      @click="openDrawer"
                      size="small"
                      icon="pi pi-plus-circle"
                      :pt="{
                        label: { class: 'w-full text-left' },
                        root: { class: 'p-2' }
                      }"
                      label="Create Edge Service"
                    />
                  </li>
                </ul>
              </template>
            </FieldDropdown>
          </div>
        </div>
      </div>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col w-full gap-2">
            <label class="text-color text-sm not-italic font-medium leading-5">Variables</label>
            <div class="flex flex-col h-full gap-2">
              <vue-monaco-editor
                v-model:value="variables"
                language="shell"
                :theme="theme"
                class="min-h-[200px] overflow-clip surface-border border rounded-md"
                :class="{ 'border-red-500 border': variablesError }"
                :options="editorOptions"
              />
              <small
                v-if="variablesError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ variablesError }}
              </small>
              <small class="text-xs text-color-secondary font-normal leading-5">
                Customize or keep the default values of the variables required to run the service.
              </small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </form-horizontal>
</template>
