<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@templates/page-heading-block'
  import EditView from '@/views/EdgeDNS/EditView.vue'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import PrimeButton from '@aziontech/webkit/button'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { computed, ref, onMounted, inject, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsRecords from './FormFields/FormFieldsRecords'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { TTL_MAX_VALUE_RECORDS, TTL_DEFAULT } from '@/utils/constants'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
  import { edgeDNSRecordsService } from '@/services/v2/edge-dns/edge-dns-records-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { useTableDefinitionsStore } from '@/stores/table-definitions'
  import ListTable from '@/components/list-table/ListTable.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    updatedRedirect: { type: String, required: true },
    documentationService: { type: Function, required: true }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const edgeDNSId = ref(route.params.id)
  const edgeDNS = ref()
  const activeTab = ref(0)

  const showCreateRecordDrawer = ref(false)
  const showEditRecordDrawer = ref(false)
  const selectedEdgeDnsRecordToEdit = ref(0)
  const listTableRef = ref(null)

  const defaultTabs = {
    mainSettings: 0,
    records: 1
  }

  const mapTabs = ref({ ...defaultTabs })

  const RECORD_TYPE_WITHOUT_TTL = 'ANAME'

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
      component: (columnData) => {
        return columnBuilder({
          data: Array.isArray(columnData) ? columnData : columnData?.content,
          columnAppearance: 'text-array-with-popup',
          dependencies: {
            showCopy: true
          }
        })
      }
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

  const title = computed(() => {
    return edgeDNS.value?.name || ''
  })

  const shouldShowSkeleton = computed(() => {
    if (!edgeDNS.value) return true
    return false
  })

  const showMainSettings = computed(() => {
    return activeTab.value === mapTabs.value.mainSettings
  })

  const showRecords = computed(() => {
    return activeTab.value === mapTabs.value.records
  })

  const addButtonController = computed(() => {
    if (activeTab.value === mapTabs.value.records) {
      return {
        showAddButtonTab: true,
        label: 'Record',
        click: openCreateDrawerEDNSResource
      }
    }
    return {
      showAddButtonTab: false,
      label: '',
      click: () => {}
    }
  })

  // --- Load & Prefetch ---

  const loaderEdgeDNS = async () => {
    try {
      return await edgeDNSService.loadEdgeDNSService({ id: edgeDNSId.value })
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })

      return router.push({ name: props.updatedRedirect })
    }
  }

  const preloadTabData = () => {
    if (!edgeDNS.value) return

    const tableDefinitions = useTableDefinitionsStore()
    const pageSize = tableDefinitions.getNumberOfLinesPerPage || 10

    edgeDNSRecordsService.prefetchRecordsList(edgeDNSId.value, pageSize)
  }

  const renderTabCurrentRouter = async () => {
    const { tab } = route.params

    let selectedTab = tab
    if (!selectedTab) selectedTab = 'mainSettings'

    const activeTabIndexByRoute = mapTabs.value[selectedTab]
    changeTab(activeTabIndexByRoute)

    edgeDNS.value = { ...edgeDNS.value, ...(await loaderEdgeDNS()) }

    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeDNS.value?.name)
    preloadTabData()
  }

  // --- Cache from listing ---

  const cachedEdgeDNS = edgeDNSService.getZoneFromCache(edgeDNSId.value)

  if (cachedEdgeDNS?.name) {
    edgeDNS.value = cachedEdgeDNS
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, cachedEdgeDNS.name)
  }

  // --- Records services ---

  const listRecordsServiceEdgeDNSDecorator = async (query) => {
    const params = { ...query }
    return await edgeDNSRecordsService.listRecords(edgeDNSId.value, params)
  }

  const deleteRecordsServiceEdgeDNSDecorator = async (recordID) => {
    return await edgeDNSRecordsService.deleteRecord({
      recordID: recordID,
      edgeDNSID: edgeDNSId.value
    })
  }

  const loadRecordServiceWithEDNSIdDecorator = async (payload) => {
    return await edgeDNSRecordsService.loadRecord({
      id: payload.id,
      edgeDNSId: edgeDNSId.value
    })
  }

  const editRecordServiceWithEDNSIdDecorator = async (payload) => {
    return await edgeDNSRecordsService.editRecordsService({
      edgeDNSId: edgeDNSId.value,
      ...payload
    })
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'record',
      icon: 'pi pi-trash',
      service: deleteRecordsServiceEdgeDNSDecorator
    }
  ]

  // --- Drawer handlers ---

  const openCreateDrawerEDNSResource = () => {
    showCreateRecordDrawer.value = true
    handleTrackEventGoToCreate()
  }

  const openEditDrawerEDNSResource = (event) => {
    selectedEdgeDnsRecordToEdit.value = event.id
    showEditRecordDrawer.value = true
  }

  const handleCreatedSuccessfully = () => {
    listTableRef.value?.reload()
    handleTrackSuccessCreated()
  }

  const handleEditedSuccessfully = () => {
    listTableRef.value?.reload()
    handleTrackSuccessEdit()
  }

  // --- DataTable setup ---

  const frozenColumns = ['name']

  const handleBeforeGoToEdit = () => {
    handleTrackEventGoToEdit()
  }

  // --- Tab navigation ---

  const changeTab = (index) => {
    activeTab.value = index
    const tabNames = Object.keys(mapTabs.value)
    const tab = tabNames.find((tabName) => mapTabs.value[tabName] === index)

    router.push({
      name: 'edit-edge-dns',
      params: { id: edgeDNSId.value, tab },
      query: route.query
    })
  }

  const { unsaved, requestTabChange } = provideTabUnsaved(changeTab)

  const tabViewRef = ref(null)

  const handleTabClick = ({ index = 0 }) => {
    requestTabChange(activeTab.value, index)
    if (unsaved.isDialogVisible.value && tabViewRef.value) {
      nextTick(() => {
        tabViewRef.value.d_activeIndex = activeTab.value
      })
    }
  }

  onMounted(() => {
    renderTabCurrentRouter()
  })

  // --- Analytics ---

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
</script>

<template>
  <EditViewSkeleton v-if="shouldShowSkeleton" />
  <ContentBlock v-else>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :entityName="edgeDNS?.name"
        description="Configure DNS records and zone settings used for authoritative domain resolution."
      />
    </template>
    <template #content>
      <DialogUnsaved
        :visible="unsaved.isDialogVisible.value"
        @leave="unsaved.confirmLeave"
        @stay="unsaved.cancelLeave"
      />
      <div class="h-full w-full">
        <div class="flex align-center justify-between relative">
          <TabView
            ref="tabViewRef"
            :activeIndex="activeTab"
            @tab-click="handleTabClick"
            class="flex-1"
          >
            <TabPanel
              header="Main Settings"
              :pt="{
                root: {
                  'data-testid': 'edge-dns-edit-view__main-settings__tab-panel'
                }
              }"
            >
            </TabPanel>
            <TabPanel
              header="Records"
              :pt="{
                root: {
                  'data-testid': 'edge-dns-edit-view__records__tab-panel'
                }
              }"
            >
            </TabPanel>
          </TabView>
          <div
            v-if="addButtonController.showAddButtonTab"
            class="flex ml-4 items-center"
          >
            <PrimeButton
              :label="addButtonController.label"
              size="small"
              icon="pi pi-plus"
              @click="addButtonController.click"
              data-testid="data-table-actions-column-body-actions-menu-button"
            />
          </div>
        </div>

        <div>
          <EditView
            v-if="showMainSettings"
            :edgeDNS="edgeDNS"
            :updatedRedirect="updatedRedirect"
          />

          <div v-if="showRecords">
            <ListTable
              ref="listTableRef"
              :listService="listRecordsServiceEdgeDNSDecorator"
              :columns="recordListColumns"
              :actions="actions"
              :editInDrawer="openEditDrawerEDNSResource"
              defaultOrderingFieldName="id"
              exportFileName="Edge DNS Records"
              :lazy="true"
              :frozenColumns="frozenColumns"
              :isTabs="true"
              emptyListMessage="No records found."
              :emptyBlock="{
                title: 'No records yet',
                description:
                  'Create your first DNS record to control domain resolution and routing.',
                createButtonLabel: 'Record',
                createPagePath: 'records/create',
                documentationService: documentationService,
                inTabs: true
              }"
              @on-before-go-to-edit="handleBeforeGoToEdit"
            >
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
            </ListTable>

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
        </div>
      </div>
    </template>
  </ContentBlock>
</template>
