<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'
  import SettingsTab from './SettingsTab.vue'
  import VersionHistoryTab from './VersionHistoryTab.vue'
  import { digitalCertificatesV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-service'
  import { digitalCertificatesCRLV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-service'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'

  defineOptions({ name: 'digital-certificates-edit-view-v6' })

  const props = defineProps({
    resourceKind: {
      type: String,
      default: 'certificate',
      validator: (value) => ['certificate', 'crl'].includes(value)
    }
  })

  const TAB_ORDER = ['settings', 'version-history']
  const TAB_TO_INDEX = TAB_ORDER.reduce((acc, name, index) => {
    acc[name] = index
    return acc
  }, {})

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const resourceId = ref(route.params.id)
  const resource = ref(null)
  const isLoading = ref(true)
  const refreshKey = ref(0)

  const service = computed(() =>
    props.resourceKind === 'crl' ? digitalCertificatesCRLV6Service : digitalCertificatesV6Service
  )

  const routeName = computed(() =>
    props.resourceKind === 'crl' ? 'edit-crl-digital-certificates' : 'edit-digital-certificates'
  )

  const activeTab = computed(() => {
    const tabName = TAB_ORDER.includes(route.params.tab) ? route.params.tab : 'settings'
    return TAB_TO_INDEX[tabName]
  })

  const tabViewRef = ref(null)

  const indexToTabName = (index) => TAB_ORDER[index] || TAB_ORDER[0]

  const changeTab = (index) => {
    router.replace({
      name: routeName.value,
      params: {
        id: resourceId.value,
        tab: indexToTabName(index)
      },
      query: route.query
    })
  }

  const { unsaved, requestTabChange } = provideTabUnsaved(changeTab)

  const handleTabClick = ({ index = 0 }) => {
    if (index === activeTab.value) return
    requestTabChange(activeTab.value, index)
    if (unsaved.isDialogVisible.value && tabViewRef.value) {
      nextTick(() => {
        tabViewRef.value.d_activeIndex = activeTab.value
      })
    }
  }

  const showLoadError = (error) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail: error || 'Failed to load the resource'
    })
  }

  const loadResource = async () => {
    isLoading.value = true
    try {
      resource.value = await service.value.load({ id: resourceId.value })
    } catch (error) {
      showLoadError(error)
      resource.value = null
    } finally {
      isLoading.value = false
    }
  }

  const refreshResource = async () => {
    try {
      resource.value = await service.value.load({ id: resourceId.value })
      refreshKey.value += 1
    } catch (error) {
      showLoadError(error)
    }
  }

  loadResource()
</script>

<template>
  <EditViewSkeleton v-if="isLoading" />

  <ContentBlock v-else-if="resource">
    <template #heading>
      <PageHeadingBlock
        :pageTitle="resource.name"
        :entityName="resource.name"
        description="Manage certificate settings and version history."
      />
    </template>
    <template #content>
      <DialogUnsaved
        :visible="unsaved.isDialogVisible.value"
        @leave="unsaved.confirmLeave"
        @stay="unsaved.cancelLeave"
      />
      <TabView
        ref="tabViewRef"
        :activeIndex="activeTab"
        class="w-full h-full"
        @tab-click="handleTabClick"
      >
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'digital-certificates-tabs__tab__settings' } }"
        >
          <SettingsTab
            v-if="activeTab === TAB_TO_INDEX.settings"
            :key="refreshKey"
            :resource="resource"
            :resourceKind="resourceKind"
            @updated="refreshResource"
          />
        </TabPanel>
        <TabPanel
          header="Version history"
          :pt="{ root: { 'data-testid': 'digital-certificates-tabs__tab__version-history' } }"
        >
          <VersionHistoryTab
            v-if="activeTab === TAB_TO_INDEX['version-history']"
            :resource="resource"
            :resourceKind="resourceKind"
            @reverted="refreshResource"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
