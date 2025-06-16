<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import DrawerEdgeConnector from '@/views/EdgeConnectors/Drawer'
  import { useField, useFieldArray } from 'vee-validate'
  import { onMounted, ref } from 'vue'
  // import { edgeConnectorsService } from '@/services/v2'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { STATUS_CODE_OPTIONS } from '../config/statusCode'
  // const getEdgeConnectors = async (query) => {
  //   return await edgeConnectorsService.listEdgeConnectorsService({
  //     fields: 'id,name',
  //     ...query
  //   })
  // }

  const { value: name } = useField('name')
  const { value: edgeConnectorId } = useField('edgeConnectorId')
  const { value: isActive } = useField('isActive')
  const { value: isDefault } = useField('isDefault')
  const { push: pushPage, remove: removePage, fields: pages } = useFieldArray('pages')

  const pageInitialState = {
    code: 400,
    ttl: 0,
    uri: '',
    customStatusCode: 0
  }

  const drawerEdgeConnectorRef = ref()

  const addNewPage = () => {
    pushPage(pageInitialState)
  }

  onMounted(async () => {
    addNewPage()
  })

  const removePageFromList = async (index) => {
    await removePage(index)
  }

  const isDefaultPage = (index) => index === 0

  const openEdgeConnectorDrawer = () => {
    drawerEdgeConnectorRef.value.openCreateDrawer()
  }

  const handleEdgeConnectorSuccess = (data) => {
    edgeConnectorId.value = data.id
  }
</script>

<template>
  <FormHorizontal
    isDrawer
    title="Custom Page"
    description="Create custom pages to handle errors and cache TTL based on the HTTP status code received from the edge connectors."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          placeholder="Custom Page name"
          data-testid="custom-page-form__name"
          required
          description="Name of the custom page."
          name="name"
          :value="name"
        />
      </div>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <DrawerEdgeConnector
          ref="drawerEdgeConnectorRef"
          @onSuccess="handleEdgeConnectorSuccess"
        />
        <FieldDropdownLazyLoader
          label="Edge Connector"
          data-testid="custom-page-form__edge-connector"
          name="edgeConnectorId"
          enableClearOption
          :service="getEdgeConnectors"
          :loadService="edgeConnectorsService.loadEdgeConnectorsService"
          optionLabel="name"
          optionValue="id"
          :value="edgeConnectorId"
          appendTo="self"
          placeholder="Select an Edge Connector to link to the Custom Page."
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  @click="openEdgeConnectorDrawer"
                  class="w-full whitespace-nowrap flex"
                  data-testid="domains-form__create-edge-application-button"
                  text
                  size="small"
                  icon="pi pi-plus-circle"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Edge Connector"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>

      <div class="w-full flex flex-col gap-2">
        <FieldSwitchBlock
          title="Active"
          nameField="isActive"
          name="isActive"
          data-testid="custom-page__isActive-field"
          :value="isActive"
          auto
          description="Enable or disable the custom page."
          :isCard="false"
        />
      </div>
      <div class="w-full flex flex-col gap-2">
        <FieldSwitchBlock
          title="Default"
          nameField="isDefault"
          name="isDefault"
          :value="isDefault"
          :isCard="false"
          description="Enable or disable the Custom Page as default."
          auto
          data-testid="custom-page__isDefault-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    isDrawer
    title="Pages"
    description="Customize error pages and cache TTL based on the HTTP status code received from the edge connectors."
  >
    <template #inputs>
      <div
        v-for="(page, index) in pages"
        :key="index"
      >
        <div class="flex flex-col gap-6">
          <div v-if="isDefaultPage(index)">
            <Divider
              align="left"
              type="dashed"
            >
              Default Page
            </Divider>
          </div>
          <div
            class="flex"
            v-else
          >
            <Divider
              align="left"
              type="dashed"
            >
              Custom Page
            </Divider>
            <PrimeButton
              @click="removePageFromList(index)"
              outlined
              icon="pi pi-trash"
            />
          </div>

          <div class="flex flex-wrap gap-6">
            <div class="flex flex-col w-full sm:max-w-xs gap-2">
              <FieldText
                v-if="isDefaultPage(index)"
                label="Custom Status Code"
                disabled
                :value="'Default'"
                :name="`pages[${index}].code`"
                placeholder="Default"
                :data-testid="`custom-page-form__name__${index}__status-code`"
                description="Set a custom status code for the custom page."
              />
              <FieldDropdown
                v-else
                label="Status Code"
                :data-testid="`custom-page-form__name__${index}__status-code`"
                required
                :options="STATUS_CODE_OPTIONS"
                optionLabel="name"
                optionValue="code"
                :value="pages[index].value.code"
                :name="`pages[${index}].code`"
                description="Select the HTTP status code to be customized."
              />
            </div>
            <div class="flex flex-col w-full sm:max-w-xs gap-2">
              <FieldNumber
                label="Custom Response TTL"
                :data-testid="`custom-page-form__page__${index}__ttl`"
                required
                :value="pages[index].value.ttl"
                :name="`pages[${index}].ttl`"
                :min="0"
                :max="31536000"
                description="Set a TTL for the custom response."
              />
            </div>
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="!isDefaultPage(index)"
          >
            <FieldText
              label="Page Path (URI)"
              placeholder="/example/path/another_path~file@name"
              :data-testid="`custom-page-form__page__${index}__path`"
              :name="`pages[${index}].uri`"
              :value="pages[index].value.uri"
              description="Customize the status code page path."
            />
          </div>
          <div
            class="flex flex-col w-full sm:max-w-xs gap-2"
            v-if="!isDefaultPage(index)"
          >
            <FieldNumber
              label="Response Custom Status Code"
              :data-testid="`custom-page-form__page__${index}__custom-status`"
              :value="pages[index].value.customStatusCode"
              :name="`pages[${index}].customStatusCode`"
              :min="100"
              :max="599"
              description="Change the status code sent in the response."
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-8 sm:items-start">
        <Divider />
        <PrimeButton
          @click="addNewPage"
          data-testid="custom-page-form__add-button"
          label="Add Page"
          outlined
          icon="pi pi-plus-circle"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
