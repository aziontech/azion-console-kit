<script setup>
  // Shared chrome for the TABBED landing screen (Versions listing + Settings =
  // Main Settings of the latest version), used by Custom Pages and Firewall. Owns
  // the heading (with the version-lifecycle teleport target), the two-tab shell,
  // the "no version yet" empty state and the deploy drawer. The per-resource tab
  // bodies arrive through the `versions` and `settings` slots; logic lives in
  // useResourceVersionLanding.
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  defineOptions({ name: 'resource-version-landing' })

  const TAB = { VERSIONS: 0, SETTINGS: 1 }

  defineProps({
    isLoading: { type: Boolean, default: false },
    loadError: { type: [Object, Error], default: null },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    entityName: { type: String, default: '' },
    errorMessage: { type: String, default: 'Failed to load. Try refreshing the page.' },
    resourceContext: { type: Object, default: null },
    latestVersionId: { type: [String, Number], default: null },
    emptyStateDescription: {
      type: String,
      default: 'Create a version on the Versions tab to start configuring this resource.'
    },
    showSettings: { type: Boolean, default: true },
    testidPrefix: { type: String, required: true }
  })

  const activeTab = defineModel('activeTab', { type: Number, default: 0 })
  const deployVisible = defineModel('deployVisible', { type: Boolean, default: false })
</script>

<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center p-8"
    :data-testid="`${testidPrefix}__loading`"
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
    :data-testid="`${testidPrefix}__error`"
  >
    {{ errorMessage }}
  </InlineMessage>

  <ContentBlock
    v-else
    :data-testid="testidPrefix"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :description="description"
        :entityName="entityName"
      >
        <template #default>
          <div
            v-if="showSettings"
            class="flex items-center gap-3"
          >
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
        v-if="showSettings"
        v-model:activeIndex="activeTab"
        :pt="{ root: { class: 'flex flex-col gap-4' } }"
      >
        <TabPanel
          header="Versions"
          :pt="{ root: { 'data-testid': `${testidPrefix}__tab__versions` } }"
        >
          <slot
            v-if="activeTab === TAB.VERSIONS"
            name="versions"
          />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': `${testidPrefix}__tab__settings` } }"
        >
          <template v-if="activeTab === TAB.SETTINGS">
            <slot
              v-if="latestVersionId"
              name="settings"
            />
            <div
              v-else
              class="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-16 text-center text-[var(--text-color-secondary)]"
              :data-testid="`${testidPrefix}__settings-empty`"
            >
              <i class="pi pi-file-edit text-2xl text-[var(--text-color-secondary)]" />
              <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
                No version to edit yet
              </h3>
              <p class="m-0 max-w-md text-sm leading-6">
                {{ emptyStateDescription }}
              </p>
              <PrimeButton
                label="New Version"
                icon="pi pi-plus"
                size="small"
                :data-testid="`${testidPrefix}__settings-empty__cta`"
                @click="activeTab = TAB.VERSIONS"
              />
            </div>
          </template>
        </TabPanel>
      </TabView>

      <slot
        v-else
        name="versions"
      />

      <DeployDrawerBlock
        v-model:visible="deployVisible"
        :resource-context="resourceContext"
      />
    </template>
  </ContentBlock>
</template>
