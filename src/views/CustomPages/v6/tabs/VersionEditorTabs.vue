<script setup>
  // VersionEditorTabs — the FULL version editor body for a Custom Page.
  // Custom Page is atomic, so there is a single "Main Settings" tab rendering the
  // existing FormFieldsCustomPages inside VersionShell → CustomPageVersionAdapter.
  // The tab structure is kept for header uniformity; Main Settings has no "+ Add".
  import { ref } from 'vue'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'

  import CustomPageVersionAdapter from '@/views/CustomPages/v6/CustomPageVersionAdapter.vue'
  import CustomPageVersionHeadingActions from '@/views/CustomPages/v6/CustomPageVersionHeadingActions.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsCustomPages from '@/views/CustomPages/FormFields/CustomPages.vue'

  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

  defineOptions({ name: 'custom-pages-v6-version-editor-tabs' })

  const props = defineProps({
    customPage: {
      type: Object,
      required: true
    },
    resourceId: {
      type: [String, Number],
      required: true
    },
    versionId: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  // Factory passed to VersionShell. Defined in setup (not inline in the template)
  // because refs are not auto-unwrapped inside template function literals.
  const useVersionQuery = () =>
    customPageVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const headingActionsRef = ref(null)
  const openDeployDrawer = () => headingActionsRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="custom-pages-v6-edit__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <CustomPageVersionAdapter
      :custom-page="customPage"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="flex align-center justify-between relative">
        <TabView class="flex-1">
          <TabPanel
            header="Main Settings"
            :pt="{ root: { 'data-testid': 'custom-pages-v6-edit__tab-panel__main-settings' } }"
          >
            <div class="flex flex-col gap-4 mt-4">
              <FormFieldsCustomPages />
            </div>
          </TabPanel>
        </TabView>
        <CustomPageVersionHeadingActions ref="headingActionsRef" />
      </div>
    </CustomPageVersionAdapter>
  </VersionShell>
</template>
