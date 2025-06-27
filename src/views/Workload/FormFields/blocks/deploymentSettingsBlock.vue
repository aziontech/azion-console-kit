<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import PrimeButton from 'primevue/button'
  import { useField } from 'vee-validate'
  import DrawerEdgeFirewall from '@/views/EdgeFirewall/Drawer'
  import DrawerCustomPages from '@/views/CustomPages/Drawer'
  import DrawerEdgeApplication from '@/views/EdgeApplications/Drawer'
  import { edgeAppService, edgeFirewallService, customPageService } from '@/services/v2'
  import { ref } from 'vue'

  // const props = defineProps({
  //   isEdit: { type: Boolean, default: false },
  //   isDrawer: { type: Boolean, default: false },
  //   noBorder: { type: Boolean, default: false },
  //   edgeApplicationServices: { type: Object, required: true },
  //   disabledEdgeApplicationDropdown: { type: Boolean, default: false }
  // })

  const { value: edgeApplication } = useField('edgeApplication')
  const { value: edgeFirewall } = useField('edgeFirewall')
  const { value: customPage } = useField('customPage')

  const drawerRef = ref('')
  const drawerEdgeFirewallRef = ref('')
  const drawerCustomPagesRef = ref(null)

  const hasEdgeFirewallAccess = ref(true)

  const handleEdgeFirewallClear = () => {
    edgeFirewall.value = null
  }

  const handleCustomPageClear = () => {
    customPage.value = null
  }

  const openDrawerEdgeApplication = () => {
    drawerRef.value.openCreateDrawer()
  }

  const openDrawerEdgeFirewall = () => {
    drawerEdgeFirewallRef.value.openCreateDrawer()
  }

  const openDrawerCustomPages = () => {
    drawerCustomPagesRef.value.openCreateDrawer()
  }

  const handleEdgeFirewallAccessDenied = () => {
    hasEdgeFirewallAccess.value = false
  }

  const handleEdgeApplicationCreated = (id) => {
    edgeApplication.value = id
  }

  const handleCustomPagesCreated = (id) => {
    customPage.value = id
  }

  const handleQuery = (queryParams) => {
    const query = {
      ...queryParams,
      fields: ['id', 'name']
    }
    return query
  }

  const listEdgeApplicationsDecorator = async (queryParams) => {
    return await edgeAppService.listEdgeApplicationsService({
      ...handleQuery(queryParams)
    })
  }

  const listEdgeFirewallDropdown = async (queryParams) => {
    return await edgeFirewallService.listEdgeFirewallService({
      ...handleQuery(queryParams)
    })
  }

  const handleListCustomPages = async () => {
    return await customPageService.listCustomPagesService({ fields: ['id', 'name'] })
  }

  const handleEdgeFirewallCreated = (id) => {
    edgeFirewall.value = id
  }
</script>
<template>
  <form-horizontal
    :isDrawer="isDrawer"
    :noBorder="noBorder"
    title="Deployment Settings"
    description="Configure the deployment of your workload by selecting the appropriate Edge Application and Edge Firewall. The Edge Application handles traffic routing and processing at the edge, while the Edge Firewall provides security by filtering and blocking malicious traffic."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <DrawerEdgeApplication
          ref="drawerRef"
          @onEdgeApplicationCreated="handleEdgeApplicationCreated"
        />
        <FieldDropdownLazyLoader
          label="Edge Application"
          required
          data-testid="domains-form__edge-application-field"
          name="edgeApplication"
          :service="listEdgeApplicationsDecorator"
          :loadService="edgeAppService.loadEdgeApplicationService"
          optionLabel="name"
          optionValue="value"
          :value="edgeApplication"
          :disabled="disabledEdgeApplicationDropdown"
          appendTo="self"
          placeholder="Select an edge application"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openDrawerEdgeApplication"
                  class="w-full whitespace-nowrap flex"
                  data-testid="domains-form__create-edge-application-button"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
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
          :enableClearOption="!!edgeFirewall"
          data-testid="domains-form__edge-firewall-field"
          name="edgeFirewall"
          @onClear="handleEdgeFirewallClear"
          :service="listEdgeFirewallDropdown"
          :loadService="edgeFirewallService.loadEdgeFirewallService"
          @onAccessDenied="handleEdgeFirewallAccessDenied"
          v-if="hasEdgeFirewallAccess"
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

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <DrawerCustomPages
          ref="drawerCustomPagesRef"
          @onSuccess="handleCustomPagesCreated"
        />
        <FieldDropdownLazyLoader
          label="Custom Page"
          :enableClearOption="!!customPage"
          data-testid="domains-form__custom-page-field"
          name="customPage"
          @onClear="handleCustomPageClear"
          :service="handleListCustomPages"
          :loadService="customPageService.loadCustomPagesService"
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
  </form-horizontal>
</template>
