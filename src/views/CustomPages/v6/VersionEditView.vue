<script setup>
  // VersionEditView — the FULL version editor screen for a Custom Page, gated by
  // `use_v6_configurations`. Loads the Custom Page (for the title) and mounts
  // VersionEditorTabs keyed by versionId. Redirects to the listing if versionId
  // is missing. Owns the toast + navigation; commands bubble up from the tabs.
  import { computed, ref, watch, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'

  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionEditorTabs from '@/views/CustomPages/v6/tabs/VersionEditorTabs.vue'

  import { customPageService } from '@/services/v2/custom-page/custom-page-service'

  defineOptions({ name: 'custom-pages-v6-version-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const customPageId = computed(() => String(route.params.id))
  const versionId = computed(() => (route.params.versionId ? String(route.params.versionId) : null))

  if (!versionId.value) {
    router.replace({ name: 'edit-custom-pages', params: { id: customPageId.value } })
  }

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

  const customPageTitle = computed(() => {
    const name = customPage.value?.name ?? ''
    const vid = versionId.value
    if (!name || !vid) return name
    return `${name} — Version ${vid}`
  })

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Version saved',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
    [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
    [VERSION_ACTIONS.DELETE]: 'Version deleted'
  }

  const editorTabsRef = ref(null)

  const goToVersionsList = () =>
    router.push({ name: 'edit-custom-pages', params: { id: customPageId.value } })

  const handleCancel = () => goToVersionsList()

  const handleCommandSuccess = ({ action, result }) => {
    if (action === VERSION_ACTIONS.DEPLOY) {
      editorTabsRef.value?.openDeployDrawer()
      return
    }

    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Done'
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

    const detail = error?.message ?? (typeof error === 'string' ? error : 'Something went wrong')

    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail
    })
  }
</script>

<template>
  <div
    v-if="isLoadingCustomPage"
    class="flex items-center justify-center p-8"
    data-testid="custom-pages-v6-version-edit__loading"
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
    data-testid="custom-pages-v6-version-edit__error"
  >
    Failed to load custom page. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="custom-pages-v6-version-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="customPageTitle"
        :entityName="customPage?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <div
              id="version-tab-add-action"
              class="flex items-center"
            />
            <div
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorTabsRef"
        :key="versionId"
        :custom-page="customPage"
        :resource-id="customPageId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ContentBlock>
</template>
