<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  import CreateEdgeServiceDrawer from '@/views/EdgeServices/CreateEdgeServiceDrawer'

  import { useField } from 'vee-validate'
  import { ref, onMounted, watch } from 'vue'
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
      listService.value = await props.listServicesHandle()
    } catch (error) {
      showToast('error', error)
    } finally {
      loadingOptionsServices.value = false
    }
  }

  const { value: serviceId } = useField('serviceId')

  const showToast = (severity, summary) => {
    toast.add({
      closable: true,
      severity,
      summary
    })
  }

  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

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
              optionValue="id"
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
    </template>
  </form-horizontal>
</template>
