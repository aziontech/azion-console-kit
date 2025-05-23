<script setup>
  import { ref } from 'vue'
  import { useField } from 'vee-validate'
  import PrimeButton from 'primevue/button'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import Drawer from '@/views/EdgeApplications/Drawer'
  import DrawerEdgeFirewall from '@/views/EdgeFirewall/Drawer'
  import DrawerCustomPages from '@/views/CustomPages/Drawer'

  const props = defineProps({
    listEdgeApplicationsService: { type: Function, required: true },
    loadEdgeApplicationsService: { type: Function, required: true },
    listEdgeFirewallService: { type: Function, required: true },
    loadEdgeFirewallService: { type: Function, required: true },
    listCustomPagesService: { type: Function, required: true },
    loadCustomPagesService: { type: Function, required: true }
  })

  const handleListCustomPages = async () => {
    return await props.listCustomPagesService({ fields: ['id', 'name'] })
  }

  defineOptions({ name: 'form-fields-variables' })
  const emit = defineEmits(['edgeFirewallCreated'])

  const drawerRef = ref(null)
  const drawerEdgeFirewallRef = ref(null)
  const drawerCustomPagesRef = ref(null)

  const { value: edgeApplication } = useField('edgeApplication')
  const { value: edgeFirewall } = useField('edgeFirewall')
  const { value: customPage } = useField('customPage')

  const openDrawer = () => drawerRef.value?.openCreateDrawer()
  const openDrawerEdgeFirewall = () => drawerEdgeFirewallRef.value?.openCreateDrawer()
  const openDrawerCustomPages = () => drawerCustomPagesRef.value?.openCreateDrawer()

  const handleEdgeApplicationCreated = (edgeApplicationId) => {
    edgeApplication.value = edgeApplicationId
  }

  const handleEdgeFirewallCreated = (edgeFirewallId) => {
    edgeFirewall.value = edgeFirewallId
    emit('edgeFirewallCreated')
  }

  const handleCustomPagesCreated = (customPageId) => {
    customPage.value = customPageId
    emit('customPageCreated')
  }
</script>

<template>
  <FormHorizontal
    title="Deployment Settings"
    description="Select the Edge Application and Edge Firewall to be associated with the Workload."
  >
    <template #inputs>
      <Drawer
        ref="drawerRef"
        @onEdgeApplicationCreated="handleEdgeApplicationCreated"
      />

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
          placeholder="Select an Edge Firewall"
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
          placeholder="Select an Edge Application"
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
        <DrawerCustomPages
          ref="drawerCustomPagesRef"
          @onSuccess="handleCustomPagesCreated"
        />
        <FieldDropdownLazyLoader
          label="Custom Page"
          enableClearOption
          data-testid="domains-form__custom-page-field"
          name="customPage"
          :service="handleListCustomPages"
          :loadService="loadCustomPagesService"
          optionLabel="name"
          optionValue="value"
          :value="customPage"
          appendTo="self"
          placeholder="Select a custom page"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawerCustomPages"
                  class="w-full whitespace-nowrap flex"
                  data-testid="domains-form__create-custom-pages-button"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Custom Page"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
    </template>
  </FormHorizontal>
</template>
