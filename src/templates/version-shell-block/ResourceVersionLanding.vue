<script setup>
  import { computed } from 'vue'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({ name: 'resource-version-landing' })

  const props = defineProps({
    isLoading: { type: Boolean, default: false },
    loadError: { type: [Object, Error], default: null },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    entityName: { type: String, default: '' },
    errorMessage: { type: String, default: 'Failed to load. Try refreshing the page.' },
    latestVersionId: { type: [String, Number], default: null },
    emptyStateDescription: {
      type: String,
      default: 'Create a version on the Versions tab to start configuring this resource.'
    },
    showOverview: { type: Boolean, default: false },
    showSettings: { type: Boolean, default: true },
    showVariables: { type: Boolean, default: false },
    testidPrefix: { type: String, required: true }
  })

  const activeTab = defineModel('activeTab', { type: Number, default: 0 })

  const tabIndexes = computed(() => {
    let cursor = 0
    const map = {}
    if (props.showOverview) map.overview = cursor++
    map.versions = cursor++
    if (props.showSettings) map.settings = cursor++
    if (props.showVariables) map.variables = cursor++
    return map
  })

  const hasTabs = computed(() => props.showOverview || props.showSettings || props.showVariables)
</script>

<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center p-[var(--spacing-8)]"
    :data-testid="`${testidPrefix}__loading`"
  >
    <ProgressSpinner
      class="w-10 h-10 text-[var(--text-color)]"
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
          <div class="flex items-center gap-[var(--spacing-3)]">
            <slot name="heading-actions" />
            <div
              v-if="showSettings"
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        v-if="hasTabs"
        v-model:activeIndex="activeTab"
        :pt="{ root: { class: 'flex flex-col gap-[var(--spacing-4)]' } }"
      >
        <TabPanel
          v-if="showOverview"
          header="Overview"
          :pt="{ root: { 'data-testid': `${testidPrefix}__tab__overview` } }"
        >
          <slot
            v-if="activeTab === tabIndexes.overview"
            name="overview"
          />
        </TabPanel>
        <TabPanel
          header="Versions"
          :pt="{ root: { 'data-testid': `${testidPrefix}__tab__versions` } }"
        >
          <slot
            v-if="activeTab === tabIndexes.versions"
            name="versions"
          />
        </TabPanel>
        <TabPanel
          v-if="showSettings"
          header="Settings"
          :pt="{ root: { 'data-testid': `${testidPrefix}__tab__settings` } }"
        >
          <template v-if="activeTab === tabIndexes.settings">
            <slot
              v-if="latestVersionId"
              name="settings"
            />
            <div
              v-else
              class="flex w-full flex-col items-center justify-center gap-[var(--spacing-3)] rounded-[var(--shape-elements)] border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-6)] py-[var(--spacing-16)] text-center text-[var(--text-color-secondary)]"
              :data-testid="`${testidPrefix}__settings-empty`"
            >
              <i class="pi pi-file-edit text-heading-md text-[var(--text-color-secondary)]" />
              <h3 class="m-[0] text-body-md font-semibold text-[var(--text-color)]">
                No version to edit yet
              </h3>
              <p class="m-[0] max-w-[var(--container-md)] text-body-sm">
                {{ emptyStateDescription }}
              </p>
              <PrimeButton
                label="New Version"
                icon="pi pi-plus"
                size="small"
                :data-testid="`${testidPrefix}__settings-empty__cta`"
                @click="activeTab = tabIndexes.versions"
              />
            </div>
          </template>
        </TabPanel>
        <TabPanel
          v-if="showVariables"
          header="Variables"
          :pt="{ root: { 'data-testid': `${testidPrefix}__tab__variables` } }"
        >
          <slot
            v-if="activeTab === tabIndexes.variables"
            name="variables"
          />
        </TabPanel>
      </TabView>

      <slot
        v-else
        name="versions"
      />
    </template>
  </ContentBlock>
</template>
