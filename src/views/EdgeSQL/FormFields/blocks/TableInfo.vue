<template>
  <InfoDrawerBlock
    v-model:visible="drawerVisible"
    :title="tableSchema ? `Table Info: ${tableSchema.name}` : 'Table Information'"
  >
    <template #body>
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <div
          v-if="isLoadingSchema"
          class="w-full"
        >
          <div class="flex flex-col gap-8 max-md:gap-6">
            <div
              class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
            >
              <div class="flex items-center gap-3 mb-4">
                <Skeleton class="w-32 h-6" />
                <Skeleton class="w-20 h-6 rounded-full" />
              </div>
              <div class="flex justify-content-between align-items-center w-full">
                <Skeleton class="w-24 h-6 rounded-full" />
                <Skeleton class="w-32 h-8 rounded" />
              </div>
            </div>

            <div
              class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
            >
              <Skeleton class="w-20 h-6 mb-4" />
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <div
                  v-for="i in 6"
                  :key="i"
                  class="p-4 border-round-md surface-border border-1"
                >
                  <div class="flex flex-column gap-3">
                    <div class="flex align-items-center gap-2">
                      <Skeleton class="w-4 h-4" />
                      <Skeleton class="w-24 h-4" />
                    </div>
                    <Skeleton class="w-16 h-5 rounded" />
                    <div class="flex gap-1">
                      <Skeleton class="w-16 h-4 rounded-full" />
                      <Skeleton class="w-12 h-4 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="tableSchema"
          class="w-full flex flex-col gap-4"
        >
          <InfoSection
            :title="tableSchema.name"
            :loading="false"
            hideDivider
          >
            <template #body>
              <div class="flex justify-content-between align-items-center w-full">
                <div class="flex align-items-center gap-2">
                  <Tag
                    icon="pi pi-table"
                    :value="`${tableSchema.rows.length} columns`"
                    severity="info"
                  />
                </div>
                <Button
                  icon="pi pi-copy"
                  label="Copy Definition"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="copyTableDefinition"
                />
              </div>
            </template>
          </InfoSection>

          <InfoSection
            title="Columns"
            :loading="false"
          >
            <template #body>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <div
                  v-for="(column, index) in tableSchema.rows"
                  :key="index"
                  class="p-4 border-round-md surface-border border-1 hover:surface-100 dark:hover:surface-700 transition-colors"
                >
                  <div class="flex flex-column gap-3">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-bookmark text-primary text-sm"></i>
                      <span class="font-semibold text-color">{{ column.name }}</span>
                    </div>

                    <div class="text-xs text-color-secondary">
                      <span
                        class="font-mono bg-surface-100 dark:bg-surface-700 px-2 py-1 border-round"
                      >
                        {{ column.type }}
                      </span>
                    </div>

                    <div class="flex gap-1 flex-wrap">
                      <Tag
                        v-if="column.notnull"
                        value="NOT NULL"
                        severity="warning"
                        class="text-xs"
                        style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                      />
                      <Tag
                        v-if="column.primary"
                        value="PRIMARY KEY"
                        severity="info"
                        class="text-xs"
                        style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                      />
                      <Tag
                        v-if="column.default"
                        value="DEFAULT"
                        severity="secondary"
                        class="text-xs"
                        style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                        v-tooltip.top="`Default: ${column.default}`"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </InfoSection>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-8 text-center"
        >
          {{ tableSchema }}
          <i class="pi pi-table text-6xl text-primary mb-4 opacity-50"></i>
          <h4 class="text-lg font-medium text-color mb-2">Select a table</h4>
          <p class="text-color-secondary">Choose a table from the sidebar to view its definition</p>
        </div>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Button from 'primevue/button'
  import Tag from 'primevue/tag'
  import Skeleton from 'primevue/skeleton'
  import { computed, ref, watch } from 'vue'

  const props = defineProps({
    selectedTableSchema: {
      type: Object,
      required: true
    },
    isLoadingSchema: {
      type: Boolean,
      required: true
    },
    schemaVisible: {
      type: Boolean,
      required: true
    }
  })

  const emit = defineEmits(['close'])

  const tableSchema = ref({})

  const drawerVisible = computed({
    get: () => props.schemaVisible,
    set: (value) => emit('close', value)
  })

  watch(
    () => props.selectedTableSchema,
    (newValue) => {
      tableSchema.value = newValue
    }
  )
</script>
