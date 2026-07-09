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
  import ConfigurationTab from './ConfigurationTab.vue'
  import VersionHistoryTab from './VersionHistoryTab.vue'
  import { variablesV6Service } from '@/services/v2/variables/v6/variables-v6-service'
  import { provideTabUnsaved } from '@/composables/useTabUnsaved'

  defineOptions({ name: 'variables-edit-view-v6' })

  const TAB_ORDER = ['configuration', 'version-history']
  const TAB_TO_INDEX = TAB_ORDER.reduce((acc, name, index) => {
    acc[name] = index
    return acc
  }, {})

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const variableId = ref(route.params.id)
  const variable = ref(null)
  const isLoading = ref(true)
  const refreshKey = ref(0)

  const activeTab = computed(() => {
    const tabName = TAB_ORDER.includes(route.params.tab) ? route.params.tab : 'configuration'
    return TAB_TO_INDEX[tabName]
  })

  const tabViewRef = ref(null)

  const indexToTabName = (index) => TAB_ORDER[index] || TAB_ORDER[0]

  const changeTab = (index) => {
    router.replace({
      name: 'edit-variables',
      params: {
        id: variableId.value,
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

  const variableKey = computed(() => variable.value?.key || '')

  const secretTag = computed(() =>
    variable.value?.secret === true
      ? { value: 'Secret', severity: 'secondary', icon: 'pi pi-lock' }
      : null
  )

  const showLoadError = (error) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail: error || 'Failed to load the variable'
    })
  }

  const loadVariable = async () => {
    isLoading.value = true
    try {
      variable.value = await variablesV6Service.load({ id: variableId.value })
    } catch (error) {
      showLoadError(error)
      variable.value = null
    } finally {
      isLoading.value = false
    }
  }

  const refreshVariable = async () => {
    try {
      variable.value = await variablesV6Service.load({ id: variableId.value })
      refreshKey.value += 1
    } catch (error) {
      showLoadError(error)
    }
  }

  loadVariable()
</script>

<template>
  <EditViewSkeleton v-if="isLoading" />

  <ContentBlock v-else-if="variable">
    <template #heading>
      <PageHeadingBlock
        :pageTitle="variableKey"
        :entityName="variableKey"
        :tag="secretTag"
        description="Configure variable names, values, and settings for use across Azion's products."
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
          header="Configuration"
          :pt="{ root: { 'data-testid': 'variables-tabs__tab__configuration' } }"
        >
          <ConfigurationTab
            v-if="activeTab === TAB_TO_INDEX.configuration"
            :key="refreshKey"
            :variable="variable"
            @updated="refreshVariable"
          />
        </TabPanel>
        <TabPanel
          header="Version history"
          :pt="{ root: { 'data-testid': 'variables-tabs__tab__version-history' } }"
        >
          <VersionHistoryTab
            v-if="activeTab === TAB_TO_INDEX['version-history']"
            :variable="variable"
            @rolled-back="refreshVariable"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
