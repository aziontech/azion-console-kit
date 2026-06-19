<script setup>
  // Shared chrome for the FULL version editor screen: loading / error / heading
  // (with the version-lifecycle teleport target, and optionally the tab "+ Add"
  // target) + an `editor` slot. Resource specifics come from props + the slot;
  // the screen logic lives in useVersionEditScreen.
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({ name: 'version-edit-screen' })

  defineProps({
    isLoading: { type: Boolean, default: false },
    loadError: { type: [Object, Error], default: null },
    title: { type: String, default: '' },
    entityName: { type: String, default: '' },
    errorMessage: { type: String, default: 'Failed to load. Try refreshing the page.' },
    // Renders the tab "+ Add" teleport target (multi-tab editors); off for atomic.
    hasAddAction: { type: Boolean, default: false },
    testidPrefix: { type: String, required: true }
  })
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
        :entityName="entityName"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <div
              v-if="hasAddAction"
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
      <slot name="editor" />
    </template>
  </ContentBlock>
</template>
