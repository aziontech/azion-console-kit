<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import EditFormBlock from '@templates/edit-form-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination'
  import PageHeadingBlock from '@templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { computed, onBeforeMount, ref, watch, reactive, provide, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsEdgeDnsEdit from './FormFields/FormFieldsEditEdgeDns.vue'
  import FormFieldsRecords from './FormFields/FormFieldsRecords'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { TTL_MAX_VALUE_RECORDS, TTL_DEFAULT } from '@/utils/constants'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { edgeDNSRecordsService } from '@/services/v2/edge-dns/edge-dns-records-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    editRecordsService: { type: Function, required: true },

    clipboardWrite: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    documentationService: { type: Function, required: true },
    createRecordsService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()
  const showCreateRecordDrawer = ref(false)
  const showEditRecordDrawer = ref(false)
  const listEDNSResourcesRef = ref('')
  const edgeDNSID = ref(0)
  const activeTab = ref(0)
  const selectedEdgeDnsRecordToEdit = ref(0)
  const recordListColumns = ref([
    {
      field: 'name',
      header: 'Name',
      type: 'component',
      style: 'max-width: 300px',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'id',
      header: 'ID'
    },
    {
      field: 'type',
      header: 'Type'
    },
    {
      field: 'value',
      header: 'Value',
      sortField: 'answers_list',
      filterPath: 'value.content',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup',
          dependencies: { showCopy: !!props.clipboardWrite }
        })
    },
    {
      field: 'ttl',
      header: 'TTL (seconds)',
      sortField: 'ttl'
    },
    {
      field: 'policy',
      header: 'Policy',
      sortField: 'policy'
    },
    {
      field: 'weight',
      header: 'Weight',
      sortField: 'weight'
    },
    {
      field: 'description',
      header: 'Description',
      sortField: 'description'
    }
  ])
  const RECORD_TYPE_WITHOUT_TTL = 'ANAME'

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)
  const visibleOnSaved = ref(false)
  const edgeDNSName = ref('')

  const defaultTabs = {
    mainSettings: 0,
    records: 1
  }

  const mapTabs = ref({ ...defaultTabs })

  const validationSchemaEditEDNS = yup.object({
    name: yup.string().required(),
    domain: yup
      .string()
      .required()
      .test('valid-domain', 'Invalid domain', function (value) {
        const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
        return domainRegex.test(value)
      }),
    isActive: yup.boolean().required(),
    dnssec: yup.boolean()
  })

  const validationSchemaEDNSRecords = yup.object({
    name: yup.string().required(),
    selectedRecordType: yup.string().required('Select an option'),
    value: yup.string().required(),
    ttl: yup
      .number()
      .label('TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('selectedRecordType', {
        is: RECORD_TYPE_WITHOUT_TTL,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.min(0).max(TTL_MAX_VALUE_RECORDS).required()
      }),
    selectedPolicy: yup.string().required('Please select an option').default('simple'),
    weight: yup
      .number()
      .label('Weight')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('selectedPolicy', {
        is: 'weighted',
        then: (schema) => schema.min(0).max(255).required()
      }),
    description: yup.string().label('Description'),
    edgeDNSID: yup.number()
  })

  const EDGE_DNS_RECORDS_FIELDS = [
    'id',
    'name',
    'type',
    'rdata',
    'ttl',
    'policy',
    'weight',
    'description'
  ]

  const initialValuesCreateRecords = {
    name: '',
    selectedRecordType: 'A',
    value: '',
    ttl: TTL_DEFAULT,
    selectedPolicy: 'simple',
    weight: '100',
    description: '',
    edgeDNSID: route.params.id
  }

  const handleCreatedSuccessfully = () => {
    reloadResourcesList()
    handleTrackSuccessCreated()
  }

  const handleEditedSuccessfully = () => {
    reloadResourcesList()
    handleTrackSuccessEdit()
  }

  const reloadResourcesList = () => {
    listEDNSResourcesRef.value.reload()
  }

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Edge DNS Zone'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge DNS Zone',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const listRecordsServiceEdgeDNSDecorator = async (query) => {
    const params = { ...query }
    return await edgeDNSRecordsService.listRecords(edgeDNSID.value, params)
  }

  const deleteRecordsServiceEdgeDNSDecorator = async (recordID) => {
    return await edgeDNSRecordsService.deleteRecord({
      recordID: recordID,
      edgeDNSID: edgeDNSID.value
    })
  }

  const openCreateDrawerEDNSResource = () => {
    showCreateRecordDrawer.value = true
    handleTrackEventGoToCreate()
  }
  const openEditDrawerEDNSResource = (event) => {
    selectedEdgeDnsRecordToEdit.value = event.id
    showEditRecordDrawer.value = true
  }

  const renderTabByRouterPath = () => {
    if (route.name === 'edge-dns-records') {
      activeTab.value = 1
    } else {
      activeTab.value = 0
    }
  }

  const changeRouteByClickingOnTab = (tabEvent) => {
    changeTab(tabEvent.index)
  }

  const handleCopy = (nameserver) => {
    props.clipboardWrite(nameserver)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  const showEditFormWithActionTab = computed(() => {
    return activeTab.value === 0
  })

  const showRecords = computed(() => {
    return activeTab.value === mapTabs.value?.records
  })

  const loadRecordServiceWithEDNSIdDecorator = async (payload) => {
    return await edgeDNSRecordsService.loadRecord({
      id: payload.id,
      edgeDNSId: edgeDNSID.value
    })
  }

  const editRecordServiceWithEDNSIdDecorator = async (payload) => {
    return await edgeDNSRecordsService.editRecordsService({
      edgeDNSId: edgeDNSID.value,
      ...payload
    })
  }

  watch(route, () => {
    renderTabByRouterPath()
  })

  onBeforeMount(() => {
    edgeDNSID.value = route.params.id
    renderTabByRouterPath()
  })

  const changeTab = (index) => {
    activeTab.value = index
    if (index === 0) {
      router.push({ name: 'edit-edge-dns', params: { id: edgeDNSID.value } })
    } else {
      router.push({
        name: 'edge-dns-records',
        params: { id: edgeDNSID.value }
      })
    }
  }

  provide('unsaved', {
    changeTab,
    tabHasUpdate,
    formHasUpdated,
    visibleOnSaved
  })

  watch(activeTab, (newValue, oldValue) => {
    if (visibleOnSaved.value) {
      return
    } else {
      tabHasUpdate.oldTab = oldValue
      tabHasUpdate.nextTab = newValue
      tabHasUpdate.updated = generateCurrentTimestamp()
    }
  })

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'record',
      icon: 'pi pi-trash',
      service: deleteRecordsServiceEdgeDNSDecorator
    }
  ]

  const handleTrackEventGoToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'Record'
      })
      .track()
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'Record'
      })
      .track()
  }

  const handleTrackSuccessCreated = () => {
    tracker.product
      .productCreated({
        productName: 'Record'
      })
      .track()
  }

  const handleTrackFailCreated = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Record',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Record'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Record',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const loadEdgeDNS = async (id) => {
    const edgeDNS = await edgeDNSService.loadEdgeDNSService(id)
    edgeDNSName.value = edgeDNS.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeDNS.name)

    try {
      const dnssecData = await edgeDNSService.loadEdgeDNSZoneDNSSEC(edgeDNS.id)
      edgeDNS.dnssec = dnssecData?.enabled ?? false
    } catch {
      edgeDNS.dnssec = false
    }

    return edgeDNS
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="edgeDNSName" description="Configure DNS records and zone settings used for authoritative domain resolution." />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel
          header="Main Settings"
          :pt="{
            root: {
              'data-testid': 'edge-dns-edit-view__main-settings__tab-panel'
            }
          }"
        >
          <EditFormBlock
            :editService="edgeDNSService.editEdgeDNSService"
            :loadService="loadEdgeDNS"
            :schema="validationSchemaEditEDNS"
            :updatedRedirect="updatedRedirect"
            :isTabs="true"
            @on-edit-success="handleTrackEditEvent"
            @on-edit-fail="handleTrackFailEditEvent"
          >
            <template #form>
              <FormFieldsEdgeDnsEdit :handleCopy="handleCopy" />
            </template>
            <template #action-bar="{ onSubmit, onCancel, loading }">
              <ActionBarTemplate
                v-if="showEditFormWithActionTab"
                @onSubmit="onSubmit"
                @onCancel="onCancel"
                :loading="loading"
              />
            </template>
          </EditFormBlock>
        </TabPanel>
        <TabPanel
          header="Records"
          :pt="{
            root: {
              'data-testid': 'edge-dns-edit-view__records__tab-panel'
            }
          }"
        >
          <div v-if="showRecords">
            <FetchListTableBlock
              ref="listEDNSResourcesRef"
              addButtonLabel="Record"
              defaultOrderingFieldName="id"
              :editInDrawer="openEditDrawerEDNSResource"
              :columns="recordListColumns"
              :listService="listRecordsServiceEdgeDNSDecorator"
              emptyListMessage="No records found."
              :actions="actions"
              isTabs
              :apiFields="EDGE_DNS_RECORDS_FIELDS"
              exportFileName="Edge DNS Records"
              @on-before-go-to-edit="handleTrackEventGoToEdit"
              hideLastModifiedColumn
              :emptyBlock="{
                title: 'No record has been created',
                description: 'Click the button below to create your first record.',
                createButtonLabel: 'Record',
                createPagePath: 'records/create',
                documentationService: documentationService,
                inTabs: true
              }"
            >
              <template #addButton>
                <PrimeButton
                  icon="pi pi-plus"
                  label="Record"
                  @click="openCreateDrawerEDNSResource"
                  data-testid="create_Record_button"
                />
              </template>
              <template #emptyBlockButton>
                <PrimeButton
                  class="max-md:w-full w-fit"
                  severity="secondary"
                  icon="pi pi-plus"
                  label="Record"
                  @click="openCreateDrawerEDNSResource"
                  data-testid="create_Record_button"
                />
              </template>
            </FetchListTableBlock>

            <CreateDrawerBlock
              v-if="showCreateRecordDrawer"
              v-model:visible="showCreateRecordDrawer"
              :createService="edgeDNSRecordsService.createRecord"
              :schema="validationSchemaEDNSRecords"
              :initialValues="initialValuesCreateRecords"
              @onSuccess="handleCreatedSuccessfully"
              @onError="handleTrackFailCreated"
              title="Create Record"
            >
              <template #formFields>
                <FormFieldsRecords />
              </template>
            </CreateDrawerBlock>

            <EditDrawerBlock
              v-if="showEditRecordDrawer"
              :id="selectedEdgeDnsRecordToEdit"
              v-model:visible="showEditRecordDrawer"
              :loadService="loadRecordServiceWithEDNSIdDecorator"
              :editService="editRecordServiceWithEDNSIdDecorator"
              :schema="validationSchemaEDNSRecords"
              @onSuccess="handleEditedSuccessfully"
              @onError="handleTrackFailEdit"
              title="Edit Record"
            >
              <template #formFields>
                <FormFieldsRecords />
              </template>
            </EditDrawerBlock>
          </div>
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </ContentBlock>
</template>
