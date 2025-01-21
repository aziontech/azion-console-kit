<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import Drawer from '@/views/EdgeApplications/Drawer'
  import DrawerEdgeFirewall from '@/views/EdgeFirewall/Drawer'
  import PrimeButton from 'primevue/button'

  import { useField } from 'vee-validate'
  import { ref } from 'vue'
  const drawerRef = ref('')

  const openDrawer = () => {
    drawerRef.value.openCreateDrawer()
  }

  const handleEdgeApplicationCreated = (id) => {
    edgeApplication.value = id
  }

  defineOptions({ name: 'form-fields-variables' })
  const emit = defineEmits(['edgeFirewallCreated'])

  const { value: edgeApplication } = useField('edgeApplication')
  const { value: edgeFirewall } = useField('edgeFirewall')
  const drawerEdgeFirewallRef = ref('')

  const openDrawerEdgeFirewall = () => {
    drawerEdgeFirewallRef.value.openCreateDrawer()
  }

  const handleEdgeFirewallCreated = (id) => {
    edgeFirewall.value = id
    emit('edgeFirewallCreated')
  }

  defineProps({
    listEdgeApplicationsService: {
      type: Function,
      required: true
    },
    loadEdgeApplicationsService: {
      type: Function,
      required: true
    },
    listEdgeFirewallService: {
      type: Function,
      required: true
    },
    loadEdgeFirewallService: {
      type: Function,
      required: true
    }
  })
</script>

<template>
  <FormHorizontal
    title="Deployment Settings"
    description="Select the edge application and edge firewall to be associated with the domain."
  >
    <template #inputs>
      <Drawer
        ref="drawerRef"
        @onEdgeApplicationCreated="handleEdgeApplicationCreated"
      />
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          label="Edge Application"
          required
          data-testid="domains-form__edge-application-field"
          name="edgeApplication"
          :service="listEdgeApplicationsService"
          :loadService="loadEdgeApplicationsService"
          optionLabel="name"
          optionValue="value"
          :value="edgeApplication"
          appendTo="self"
          placeholder="Select an edge application"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawer"
                  class="w-full whitespace-nowrap flex"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="domains-form__create-edge-application-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Application"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <DrawerEdgeFirewall
          ref="drawerEdgeFirewallRef"
          @onSuccess="handleEdgeFirewallCreated"
        />
        <FieldDropdownLazyLoader
          label="Edge Firewall"
          enableClearOption
          data-testid="domains-form__edge-firewall-field"
          name="edgeFirewall"
          :service="listEdgeFirewallService"
          :loadService="loadEdgeFirewallService"
          optionLabel="name"
          optionValue="value"
          :value="edgeFirewall"
          appendTo="self"
          placeholder="Select an edge firewall"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawerEdgeFirewall"
                  class="w-full whitespace-nowrap flex"
                  data-testid="domains-form__create-edge-firewall-button"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Firewall"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
    </template>
  </FormHorizontal>
</template>
