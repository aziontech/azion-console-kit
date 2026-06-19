<script setup>
  // MainSettingsTab — the "Settings" outer tab of EditView for a Custom Page.
  // Wraps FormFieldsCustomPages in VersionShell → CustomPageVersionAdapter so the
  // form binds to the latest version and lifecycle actions work. Owns no routing
  // or toast: commands bubble up; EditView decides navigation + toast.
  import CustomPageVersionAdapter from '@/views/CustomPages/v6/CustomPageVersionAdapter.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import FormFieldsCustomPages from '@/views/CustomPages/FormFields/CustomPages.vue'
  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
  import { useDeployResourceContext } from '@/composables/versioning/use-deploy-resource-context'

  defineOptions({ name: 'custom-pages-v6-main-settings-tab' })

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

  const useVersionQuery = () =>
    customPageVersionService.useLoadVersionQuery(props.resourceId, props.versionId)

  const { resourceContext } = useDeployResourceContext({
    resourceType: 'custom_page',
    injectionKey: 'customPage',
    versionService: customPageVersionService,
    currentVersionId: () => props.versionId
  })
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    data-testid="custom-pages-v6-main-settings__shell"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <CustomPageVersionAdapter
      :resource="customPage"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="relative">
        <FormFieldsCustomPages class="flex gap-4" />
        <VersionHeadingActions :resource-context="resourceContext" />
      </div>
    </CustomPageVersionAdapter>
  </VersionShell>
</template>
