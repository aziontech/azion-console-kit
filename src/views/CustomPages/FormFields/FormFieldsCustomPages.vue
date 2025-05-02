<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import { useField, useFieldArray } from 'vee-validate'
  import { onMounted, ref } from 'vue'

  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineProps({
    listEdgeConnectorsService: {
      type: Function,
      required: true
    }
  })

  const STATUS_CODE_OPTIONS = [
    {
      code: '400',
      name: '400: Bad Request'
    },
    {
      code: '401',
      name: '401: Unauthorized'
    },
    {
      code: '403',
      name: '403: Forbidden'
    },
    {
      code: '404',
      name: '404: Not Found'
    },
    {
      code: '405',
      name: '405: Method Not Allowed'
    },
    {
      code: '406',
      name: '406: Not Acceptable'
    },
    {
      code: '408',
      name: '408: Request Timeout'
    },
    {
      code: '409',
      name: '409: Conflict'
    },
    {
      code: '410',
      name: '410: Gone'
    },
    {
      code: '411',
      name: '411: Length Required'
    },
    {
      code: '414',
      name: '414: URI Too Long'
    },
    {
      code: '415',
      name: '415: Unsupported Media Type'
    },
    {
      code: '416',
      name: '416: Range Not Satisfiable'
    },
    {
      code: '425',
      name: '425: Too Early'
    },
    {
      code: '426',
      name: '426: Upgrade Required'
    },
    {
      code: '429',
      name: '429: Too Many Requests'
    },
    {
      code: '431',
      name: '431: Request Header Fields Too Large'
    },
    {
      code: '500',
      name: '500: Internal Server Error'
    },
    {
      code: '501',
      name: '501: Not Implemented'
    },
    {
      code: '502',
      name: '502: Bad Gateway'
    },
    {
      code: '503',
      name: '503: Service Unavailable'
    },
    {
      code: '504',
      name: '504: Gateway Timeout'
    },
    {
      code: '505',
      name: '505: HTTP Version Not Supported'
    }
  ]

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

  const addNewPage = () => {
    pushPage(pageInitialState)
  }

  const edgeConnectorsList = ref([])

  // const getEdgeConnectors = async () => {
  //   edgeConnectorsList.value = await props.listEdgeConnectorsService()
  // }

  onMounted(async () => {
    // await getEdgeConnectors()
    addNewPage()
  })

  const removePageFromList = async (index) => {
    await removePage(index)
  }

  const isDefaultPage = (index) => index === 0
</script>

<template>
  <FormHorizontal
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
        <FieldDropdown
          label="Edge Connector"
          :required="false"
          :options="edgeConnectorsList"
          optionLabel="name"
          data-testid="custom-page-form__origin"
          optionValue="id"
          class="h-fit"
          name="edgeConnectorId"
          description="Select an Edge Connector to link to the Custom Page."
          :value="edgeConnectorId"
          scrollHeight="170px"
        />
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
              description="Select an origin to customize the error page path."
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
