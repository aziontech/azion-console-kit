<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import CredentialsView from './CredentialsView.vue'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import PrimeButton from 'primevue/button'
  import { computed, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  defineOptions({
    name: 'object-storage-edit'
  })
  const route = useRoute()
  const toast = useToast()
  const { findBucketById, selectedBucket, bucketTableNeedRefresh, validationSchema } =
    useEdgeStorage()

  const { openDeleteDialog } = useDeleteDialog()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()

  const isCreatePage = computed(() => route.name === 'object-storage-create')
  const title = computed(() => (isCreatePage.value ? 'Create Bucket' : 'Bucket settings'))

  const activeTab = ref(0)
  const componentsRefs = ref(null)
  const mapTabs = ref({
    'main-settings': 0,
    credentials: 1
  })

  const showTab = (tabName) => computed(() => activeTab.value === mapTabs.value?.[tabName])
  const showTabs = {
    mainSettings: showTab('main-settings'),
    credentials: showTab('credentials')
  }

  const tabs = ref([
    {
      header: 'Main Settings',
      show: showTabs.mainSettings,
      showAddButtonTab: false
    },
    {
      header: 'Credentials',
      show: showTabs.credentials,
      showAddButtonTab: true
    }
  ])

  const addButtonController = computed(() => {
    const tab = tabs.value[activeTab.value]
    return {
      showAddButtonTab: !!tab?.showAddButtonTab,
      label: 'Credential',
      click: () => componentsRefs.value?.handleCreateCredential?.()
    }
  })

  const getTabFromIndex = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByTab = (tab) => {
    const params = {
      id: route.params.id,
      tab
    }
    router.push({
      name: 'object-storage-edit',
      params,
      query: route.query
    })
  }

  const changeTab = (index) => {
    const tab = getTabFromIndex(index)
    activeTab.value = index
    changeRouteByTab(tab)
  }

  const renderTabByCurrentRouter = () => {
    const { tab } = route.params
    let selectedTab = tab
    if (!tab) selectedTab = 'main-settings'

    const activeTabIndexByRoute = mapTabs.value[selectedTab]
    if (activeTabIndexByRoute !== undefined) {
      activeTab.value = activeTabIndexByRoute
    }
  }

  if (!isCreatePage.value) {
    renderTabByCurrentRouter()
  }
  const createFormProps = computed(() => ({
    createService: edgeStorageService.createEdgeStorageBucket,
    schema: validationSchema,
    disableToast: true
  }))

  const editFormProps = computed(() => {
    return {
      editService: edgeStorageService.updateEdgeStorageBucket,
      loadService: loadService,
      schema: validationSchema,
      title: title,
      disableAfterCreateToastFeedback: true,
      updatedRedirect: route.params.id ? 'object-storage-view' : 'object-storage-list',
      disableNameEdit: true
    }
  })

  const handleResponse = (response) => {
    bucketTableNeedRefresh.value = true

    const toastConfig = {
      severity: 'success',
      summary: 'Success',
      detail: `Bucket "${response.data.name}" has been ${
        isCreatePage.value ? 'created' : 'updated'
      } successfully`,
      life: 5000
    }

    if (isCreatePage.value) {
      toastConfig.action = {
        link: {
          label: 'View Bucket',
          callback: () => {
            router.push({
              name: 'object-storage-view',
              params: { id: response.data.name }
            })
          }
        }
      }
    }

    toast.add(toastConfig)
  }

  const loadService = ({ id }) => {
    const bucket = findBucketById(id)

    return {
      name: bucket?.name,
      edge_access: bucket?.edgeAccess
    }
  }

  const handleDeleteBucket = () => {
    openDeleteDialog({
      title: 'Bucket',
      data: {
        deleteConfirmationText: selectedBucket.value.name
      },
      deleteService: () => edgeStorageService.deleteEdgeStorageBucket(selectedBucket.value.name),
      successCallback: () => {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Bucket "${selectedBucket.value.name}" has been deleted successfully`,
          life: 5000
        })
      },
      closeCallback: () => {
        selectedBucket.value = null
        bucketTableNeedRefresh.value = true
        router.push({ name: 'object-storage-list' })
      }
    })
  }

  onMounted(() => {
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route)
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <!-- Create Mode -->
      <CreateFormBlock
        v-if="isCreatePage"
        @on-edit-success="handleResponse"
        @on-response="handleResponse"
        v-bind="createFormProps"
      >
        <template #form>
          <FormFieldsEdgeStorage
            :show-danger-zone="!isCreatePage"
            @delete-bucket="handleDeleteBucket"
            :disable-name-edit="!isCreatePage"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>

      <!-- Edit Mode with Tabs -->
      <div
        v-else
        class="w-full h-full"
      >
        <div class="flex align-center justify-between relative">
          <TabView
            :activeIndex="activeTab"
            @tab-click="({ index = 0 }) => changeTab(index)"
            class="flex-1"
          >
            <TabPanel
              v-for="(tab, index) in tabs"
              :key="index"
              :header="tab.header"
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
              data-testid="create_credential_button_tab"
            />
          </div>
        </div>

        <div>
          <EditFormBlock
            v-if="showTabs.mainSettings.value"
            @on-edit-success="handleResponse"
            @on-response="handleResponse"
            v-bind="editFormProps"
          >
            <template #form>
              <FormFieldsEdgeStorage
                class="mt-4"
                :show-danger-zone="!isCreatePage"
                @delete-bucket="handleDeleteBucket"
                :disable-name-edit="!isCreatePage"
              />
            </template>
            <template #action-bar="{ onSubmit, onCancel, loading }">
              <ActionBarTemplate
                @onSubmit="onSubmit"
                @onCancel="onCancel"
                :loading="loading"
              />
            </template>
          </EditFormBlock>

          <CredentialsView
            v-if="showTabs.credentials.value"
            ref="componentsRefs"
            :bucket-id="route.params.id"
          />
        </div>
      </div>
    </template>
  </ContentBlock>
</template>
