<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdownLazyLoader from '@aziontech/webkit/field-dropdown-lazy-loader'

  import Button from '@aziontech/webkit/button'
  import { useField } from 'vee-validate'
  import DrawerEdgeFirewall from '@/views/EdgeFirewall/Drawer'
  import DrawerCustomPages from '@/views/CustomPages/Drawer'
  import DrawerEdgeApplication from '@/views/EdgeApplications/Drawer'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'

  import { ref } from 'vue'

  const { value: application } = useField('application')
  const { value: firewall } = useField('firewall')
  const { value: customPage } = useField('customPage')

  const drawerRef = ref('')
  const drawerEdgeFirewallRef = ref('')
  const drawerCustomPagesRef = ref(null)

  const hasEdgeFirewallAccess = ref(true)

  const handleEdgeFirewallClear = () => {
    firewall.value = null
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
    application.value = id
  }

  const handleCustomPagesCreated = (id) => {
    customPage.value = id
  }

  const handleQuery = (queryParams) => {
    const query = {
      ...queryParams,
      fields: ['id', 'name'],
      active: true
    }
    return query
  }

  const listEdgeApplicationsDecorator = async (queryParams) => {
    return await edgeAppService.listEdgeApplicationsServiceDropdown({
      ...handleQuery(queryParams)
    })
  }

  const listEdgeFirewallDropdown = async (queryParams) => {
    return await edgeFirewallService.listEdgeFirewallServiceDropdown({
      ...handleQuery(queryParams)
    })
  }

  const handleListCustomPages = async (queryParams) => {
    return await customPageService.listCustomPagesService({ ...handleQuery(queryParams) })
  }

  const handleEdgeFirewallCreated = (id) => {
    firewall.value = id
  }
</script>
<template>
  <form-horizontal
    title="Deployment Settings"
    description="Configure the deployment of your Workload by selecting the appropriate Application and Firewall. The Application handles traffic routing and processing at the edge, while the Firewall provides security by filtering and blocking malicious traffic."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <DrawerEdgeApplication
          ref="drawerRef"
          @onEdgeApplicationCreated="handleEdgeApplicationCreated"
        />
        <FieldDropdownLazyLoader
          label="Application"
          required
          data-testid="domains-form__edge-application-field"
          name="application"
          :service="listEdgeApplicationsDecorator"
          :loadService="edgeAppService.loadEdgeApplicationService"
          optionLabel="name"
          optionValue="value"
          :value="application"
          appendTo="self"
          placeholder="Select an Application"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <Button
                  kind="text"
                  @click="openDrawerEdgeApplication"
                  data-testid="domains-form__create-edge-application-button"
                  size="small"
                  icon="pi pi-plus-circle"
                  label="Create Application"
                  class="w-full whitespace-nowrap flex"
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
          label="Firewall"
          :enableClearOption="!!firewall"
          data-testid="domains-form__edge-firewall-field"
          name="firewall"
          @onClear="handleEdgeFirewallClear"
          :service="listEdgeFirewallDropdown"
          :loadService="edgeFirewallService.loadEdgeFirewallService"
          @onAccessDenied="handleEdgeFirewallAccessDenied"
          v-if="hasEdgeFirewallAccess"
          optionLabel="name"
          optionValue="value"
          :value="firewall"
          appendTo="self"
          placeholder="Select a Firewall"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <Button
                  kind="text"
                  @click="openDrawerEdgeFirewall"
                  data-testid="domains-form__create-edge-firewall-button"
                  size="small"
                  icon="pi pi-plus-circle"
                  label="Create Firewall"
                  class="w-full whitespace-nowrap flex"
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
                <Button
                  kind="text"
                  @click="openDrawerCustomPages"
                  data-testid="domains-form__create-custom-pages-button"
                  size="small"
                  icon="pi pi-plus-circle"
                  label="Create Custom Page"
                  class="w-full whitespace-nowrap flex"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
    </template>
  </form-horizontal>
</template>
