<script setup>
  import { computed, ref } from 'vue'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import VersionTabAddButton from '@/views/EdgeApplications/v6/tabs/VersionTabAddButton.vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'

  defineOptions({ name: 'version-editor-tabs-shell' })

  const props = defineProps({
    useVersionQuery: { type: Function, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true },
    resource: { type: Object, default: null },
    adapter: { type: [Object, Function], required: true },
    tabs: { type: Array, default: () => [] },
    resourceContext: { type: Object, default: null },
    resourceType: { type: String, default: undefined },
    testidPrefix: { type: String, required: true },
    bare: { type: Boolean, default: false }
  })

  const emit = defineEmits(['command-success', 'command-error', 'cancel'])

  const activeTabIndex = defineModel('activeTabIndex', { type: Number, default: 0 })

  const componentsRefs = ref({})
  const setComponentRef = (index) => (instance) => {
    if (instance) componentsRefs.value[index] = instance
    else delete componentsRefs.value[index]
  }

  const activeTabDescriptor = computed(() => props.tabs[activeTabIndex.value] ?? null)
  const activeTabComponent = computed(() => componentsRefs.value[activeTabIndex.value] ?? null)

  const headingActionsRef = ref(null)
  const openRelease = () => headingActionsRef.value?.openRelease()

  defineExpose({ openRelease })
</script>

<template>
  <VersionShell
    :use-version-query="useVersionQuery"
    :resource-id="resourceId"
    :version-id="versionId"
    :resource-type="resourceType"
    :data-testid="`${testidPrefix}__shell`"
    @updated="emit('command-success', $event)"
    @command-error="emit('command-error', $event)"
    @cancel="emit('cancel')"
  >
    <component
      :is="adapter"
      :resource="resource"
      :resource-id="resourceId"
      :version-id="versionId"
    >
      <div class="flex align-center justify-between relative">
        <div
          v-if="bare && tabs[0]"
          class="flex-1"
        >
          <component
            :is="tabs[0].component"
            :ref="setComponentRef(0)"
            v-bind="tabs[0].props ?? {}"
          />
        </div>
        <template v-else>
          <TabView
            v-model:activeIndex="activeTabIndex"
            class="flex-1"
          >
            <TabPanel
              v-for="(tab, index) in tabs"
              :key="tab.key"
              :header="tab.label"
              :pt="{ root: { 'data-testid': `${testidPrefix}__tab-panel__${tab.key}` } }"
            >
              <div class="flex flex-col gap-[var(--spacing-4)] mt-[var(--spacing-4)]">
                <component
                  :is="tab.component"
                  :ref="setComponentRef(index)"
                  v-bind="tab.props ?? {}"
                />
              </div>
            </TabPanel>
          </TabView>
          <div class="absolute right-0 top-1 z-10 flex items-center">
            <slot
              name="tab-actions"
              :tab="activeTabDescriptor"
              :active-component="activeTabComponent"
            >
              <VersionTabAddButton
                :tab="activeTabDescriptor"
                :active-component="activeTabComponent"
                :testid-prefix="testidPrefix"
              />
            </slot>
          </div>
        </template>
        <VersionHeadingActions
          ref="headingActionsRef"
          :resource-context="resourceContext"
        />
      </div>
    </component>
  </VersionShell>
</template>
