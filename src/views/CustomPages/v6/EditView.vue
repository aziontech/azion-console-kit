<script setup>
  // v6 EditView — the Custom Page screen, gated by `use_v6_configurations`.
  // Two outer tabs: Versions (the listing) and Settings (Main Settings of the
  // latest version). The flag check stays in the router; this view owns the toast
  // and tab/route navigation.
  import { computed, ref, watch, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'

  import { VERSION_ACTIONS, VERSION_STATES } from '@/composables/versioning/version-machine'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionsTab from '@/views/CustomPages/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/CustomPages/v6/tabs/MainSettingsTab.vue'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

  defineOptions({ name: 'custom-pages-v6-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const TAB = { VERSIONS: 0, SETTINGS: 1 }

  const customPageId = computed(() => String(route.params.id))

  const customPage = ref(null)
  const isLoadingCustomPage = ref(true)
  const loadError = ref(null)

  provide('customPage', customPage)

  const loadCustomPage = async () => {
    if (!customPage.value) isLoadingCustomPage.value = true
    loadError.value = null
    try {
      customPage.value = await customPageService.loadCustomPagesService({ id: customPageId.value })
    } catch (err) {
      loadError.value = err
      customPage.value = null
    } finally {
      isLoadingCustomPage.value = false
    }
  }

  watch(customPageId, loadCustomPage, { immediate: true })

  const versionsQuery = customPageVersionService.useListVersionsQuery(customPageId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const latestVersionId = computed(() => {
    const list = rawVersions.value
    if (!list.length) return null
    const sorted = [...list].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
    return sorted[0]?.id ?? null
  })

  const activeTab = computed({
    get: () => (String(route.params.tab) === 'settings' ? TAB.SETTINGS : TAB.VERSIONS),
    set: (index) => {
      const params = { id: customPageId.value }
      if (index === TAB.SETTINGS) params.tab = 'settings'
      router.replace({ name: 'edit-custom-pages', params })
    }
  })

  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

  const readyVersionOptions = computed(() =>
    rawVersions.value
      .filter((version) => version.state === VERSION_STATES.READY)
      .map((version) => ({
        label: version.comment || `Versão ${version.id}`,
        value: version.id
      }))
  )

  const deployVersionId = computed(() =>
    activeTab.value === TAB.SETTINGS ? latestVersionId.value : null
  )
  const deployResourceContext = computed(() => ({
    resourceType: 'custom_page',
    resourceId: Number(customPageId.value),
    resourceName: customPage.value?.name ?? '',
    version: deployVersionId.value ? { id: deployVersionId.value } : null,
    versions: readyVersionOptions.value
  }))

  const customPageTitle = computed(() => customPage.value?.name ?? '')
  const pageDescription =
    'Cada versão é um snapshot isolado da configuração desta Custom Page. Edite um rascunho e construa-o para publicar uma versão imutável.'

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Versão salva',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build iniciado',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelado',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Rascunho criado',
    [VERSION_ACTIONS.ARCHIVE]: 'Versão arquivada',
    [VERSION_ACTIONS.DELETE]: 'Versão excluída'
  }

  const goToVersionsList = () => {
    activeTab.value = TAB.VERSIONS
  }

  const handleCancel = () => goToVersionsList()

  const handleCommandSuccess = ({ action, result }) => {
    if (action === VERSION_ACTIONS.DEPLOY) {
      openDeployDrawer()
      return
    }

    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Concluído'
    })

    switch (action) {
      case VERSION_ACTIONS.DELETE:
        goToVersionsList()
        return
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        goToVersionsList()
        return
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        router.push({
          name: 'edit-custom-pages-version',
          params: { id: customPageId.value, versionId: result.id }
        })
        return
      case VERSION_ACTIONS.SAVE:
        loadCustomPage()
        return
      default:
    }
  }

  const handleCommandError = ({ error }) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }

    const detail = error?.message ?? (typeof error === 'string' ? error : 'Algo deu errado')

    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Erro',
      detail
    })
  }
</script>

<template>
  <div
    v-if="isLoadingCustomPage"
    class="flex items-center justify-center p-8"
    data-testid="custom-pages-v6-edit__loading"
  >
    <ProgressSpinner
      class="w-10 h-10 text-color"
      strokeWidth="4"
    />
  </div>

  <InlineMessage
    v-else-if="loadError"
    class="w-full"
    severity="error"
    data-testid="custom-pages-v6-edit__error"
  >
    Falha ao carregar a Custom Page. Tente atualizar a página.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="custom-pages-v6-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="customPageTitle"
        :description="pageDescription"
        :entityName="customPage?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <div
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        v-model:activeIndex="activeTab"
        :pt="{ root: { class: 'flex flex-col gap-4' } }"
      >
        <TabPanel
          header="Versions"
          :pt="{ root: { 'data-testid': 'custom-pages-v6-edit__tab__versions' } }"
        >
          <VersionsTab
            v-if="activeTab === TAB.VERSIONS"
            :custom-page-id="customPageId"
          />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'custom-pages-v6-edit__tab__settings' } }"
        >
          <template v-if="activeTab === TAB.SETTINGS">
            <MainSettingsTab
              v-if="latestVersionId"
              :key="latestVersionId"
              :custom-page="customPage"
              :resource-id="customPageId"
              :version-id="latestVersionId"
              @command-success="handleCommandSuccess"
              @command-error="handleCommandError"
              @cancel="handleCancel"
            />
            <div
              v-else
              class="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-16 text-center text-[var(--text-color-secondary)]"
              data-testid="custom-pages-v6-edit__settings-empty"
            >
              <i class="pi pi-file-edit text-2xl text-[var(--text-color-secondary)]" />
              <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
                Nenhuma versão para editar ainda
              </h3>
              <p class="m-0 max-w-md text-sm leading-6">
                Crie uma versão na aba Versions para começar a configurar esta Custom Page.
              </p>
              <PrimeButton
                label="Nova Versão"
                icon="pi pi-plus"
                size="small"
                data-testid="custom-pages-v6-edit__settings-empty__cta"
                @click="activeTab = TAB.VERSIONS"
              />
            </div>
          </template>
        </TabPanel>
      </TabView>

      <DeployDrawerBlock
        v-model:visible="isDeployDrawerOpen"
        :resource-context="deployResourceContext"
      />
    </template>
  </ContentBlock>
</template>
