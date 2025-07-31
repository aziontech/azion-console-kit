<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Storage" />
    </template>
    <template #content>
      <div class="flex h-full w-full gap-8">
        <template v-if="isGreaterThanMD">
          <div class="flex flex-col w-80 gap-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-color-primary">Buckets</h3>
              <PrimeButton
                icon="pi pi-plus"
                size="small"
                outlined
                @click="handleCreateTrackEvent"
                data-testid="create-bucket-button"
                class="w-8 h-8 p-0 flex items-center justify-center"
              />
            </div>

            <div class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                v-model="searchTerm"
                placeholder="Search buckets"
                class="w-full"
                @input="handleSearch"
              />
            </div>

            <div class="flex-1 overflow-y-auto">
              <div
                v-if="isLoading"
                class="text-center py-4"
              >
                <i class="pi pi-spin pi-spinner text-2xl text-color-secondary"></i>
              </div>
              <div
                v-else-if="filteredBuckets.length === 0"
                class="text-left py-2"
              >
                <div class="text-color-secondary text-sm">
                  {{ searchTerm ? 'No buckets found' : 'No buckets created yet' }}
                </div>
              </div>
              <div
                v-else
                class="space-y-2"
              >
                <div
                  v-for="bucket in filteredBuckets"
                  :key="bucket.id"
                  class="p-3 border surface-border rounded cursor-pointer hover:bg-surface-hover transition-colors"
                  :class="{ 'bg-primary-50 border-primary-200': selectedBucket?.id === bucket.id }"
                  @click="selectBucket(bucket)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="font-medium text-color-primary">{{ bucket.name }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="flex w-full flex-col gap-8">
          <template v-if="!isGreaterThanMD">
            <div class="flex flex-col gap-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-color-primary">Buckets</h3>
                <PrimeButton
                  icon="pi pi-plus"
                  size="small"
                  outlined
                  @click="handleCreateTrackEvent"
                  data-testid="create-bucket-button"
                  class="w-8 h-8 p-0 flex items-center justify-center"
                />
              </div>

              <div class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText
                  v-model="searchTerm"
                  placeholder="Search buckets"
                  class="w-full"
                  @input="handleSearch"
                />
              </div>

              <div class="flex-1 overflow-y-auto">
                <div
                  v-if="isLoading"
                  class="text-center py-4"
                >
                  <i class="pi pi-spin pi-spinner text-2xl text-color-secondary"></i>
                </div>
                <div
                  v-else-if="filteredBuckets.length === 0"
                  class="text-left py-2"
                >
                  <div class="text-color-secondary text-sm">
                    {{ searchTerm ? 'No buckets found' : 'No buckets created yet' }}
                  </div>
                </div>
                <div
                  v-else
                  class="space-y-2"
                >
                  <div
                    v-for="bucket in filteredBuckets"
                    :key="bucket.id"
                    class="p-3 border surface-border rounded cursor-pointer hover:bg-surface-hover transition-colors"
                    :class="{
                      'bg-primary-50 border-primary-200': selectedBucket?.id === bucket.id
                    }"
                    @click="selectBucket(bucket)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="font-medium text-color-primary">{{ bucket.name }}</div>
                        <div class="text-sm text-color-secondary mt-1">
                          {{ formatDate(bucket.lastModified) }}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Tag
                          :value="bucket.active?.value || 'Active'"
                          :severity="bucket.active?.severity || 'success'"
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <EmptyResultsBlock
            v-if="!selectedBucket"
            title="No buckets created"
            description="Create your first bucket here."
            createButtonLabel="Bucket"
            @click-to-create="handleCreateTrackEvent"
            :documentationService="documentationService"
          >
            <template #illustration>
              <Illustration />
            </template>
          </EmptyResultsBlock>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Tag from 'primevue/tag'
  import { ref, computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useResize } from '@/composables/useResize'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const buckets = ref([])
  const selectedBucket = ref(null)
  const searchTerm = ref('')
  const isLoading = ref(false)

  const { isGreaterThanMD } = useResize()

  const filteredBuckets = computed(() => {
    if (!searchTerm.value) return buckets.value
    return buckets.value.filter((bucket) =>
      bucket.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  })

  const selectBucket = (bucket) => {
    selectedBucket.value = bucket
  }

  const handleSearch = () => {
    if (
      selectedBucket.value &&
      !filteredBuckets.value.find((bucket) => bucket.id === selectedBucket.value.id)
    ) {
      selectedBucket.value = filteredBuckets.value[0] || null
    }
  }

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Storage'
    })
    router.push('/edge-storage/create')
  }
</script>
