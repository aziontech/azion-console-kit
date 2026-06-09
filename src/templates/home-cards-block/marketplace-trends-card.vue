<template>
  <HomeCardBlock
    v-if="isLoading"
    title="Marketplace Trends"
  >
    <template #content>
      <div class="bg-[var(--card-content-bg)] flex gap-2.5 items-center px-4 py-3 h-[138px]">
        <div class="flex-1 flex flex-col gap-3 animate-pulse">
          <div class="flex gap-2.5 items-center">
            <div class="rounded-md size-6 bg-[var(--surface-200)]"></div>
            <div class="h-4 bg-[var(--surface-200)] rounded w-32"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-[var(--surface-200)] rounded w-full"></div>
            <div class="h-3 bg-[var(--surface-200)] rounded w-3/4"></div>
          </div>
          <div class="flex gap-4">
            <div class="h-3 bg-[var(--surface-200)] rounded w-16"></div>
            <div class="h-3 bg-[var(--surface-200)] rounded w-20"></div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-4 items-center justify-center w-full">
        <PrimeButton
          icon="pi pi-chevron-left"
          text
          rounded
          size="small"
          disabled
          class="w-8 h-8"
        />

        <div class="flex gap-1.5 h-full items-center justify-center">
          <button
            v-for="index in 3"
            :key="index"
            class="w-2 h-2 rounded-full transition-opacity"
            :class="
              currentIndex === index
                ? 'bg-neutral-200'
                : 'bg-[var(--text-color-secondary)] opacity-40'
            "
          />
        </div>

        <PrimeButton
          icon="pi pi-chevron-right"
          text
          rounded
          size="small"
          disabled
          class="w-8 h-8"
        />
      </div>
    </template>
  </HomeCardBlock>

  <HomeCardBlock
    v-else-if="hasItems"
    title="Marketplace Trends"
  >
    <template #content>
      <div class="bg-[var(--card-content-bg)] flex gap-2.5 items-center px-4 py-3 h-[138px]">
        <div class="flex-1 flex flex-col gap-3">
          <div class="flex flex-col gap-2 w-full">
            <div class="flex gap-2.5 items-center w-full">
              <div class="rounded-md size-6 overflow-hidden flex-shrink-0">
                <img
                  v-if="currentItem.vendorIcon"
                  :src="currentItem.vendorIcon"
                  :alt="currentItem.author"
                  class="size-6 object-contain"
                />
                <i
                  v-else
                  class="pi pi-box text-[var(--text-color-base)]"
                ></i>
              </div>
              <div class="flex-1 flex flex-col gap-0 justify-center">
                <router-link
                  :to="`/marketplace/solution/azion/${currentItem.slug}`"
                  class="text-sm font-semibold text-[var(--text-color-base)] overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
                >
                  {{ currentItem.name }}
                </router-link>
              </div>
            </div>

            <p class="text-xs leading-[1.5] overflow-hidden text-color-secondary">
              {{ currentItem.description }}
            </p>
          </div>

          <div class="flex gap-2.5 items-center text-[10px] leading-[1.3]">
            <div class="flex gap-1 items-center">
              <span class="text-[var(--text-color-base)]">By</span>
              <span class="font-semibold text-[var(--text-color-muted)]">
                {{ currentItem.author }}
              </span>
            </div>
            <div class="flex gap-1 items-center">
              <span class="text-[var(--text-color-base)]">Version</span>
              <span class="text-[var(--text-color-muted)]">
                {{ currentItem.version }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-4 items-center justify-center w-full">
        <PrimeButton
          icon="pi pi-chevron-left"
          text
          rounded
          size="small"
          :disabled="isFirstItem"
          @click="previousItem"
          class="w-8 h-8"
          :class="{ 'opacity-60': isFirstItem }"
        />

        <div class="flex gap-1.5 h-full items-center justify-center">
          <button
            v-for="(item, index) in items"
            :key="index"
            @click="goToItem(index)"
            class="w-2 h-2 rounded-full transition-opacity"
            :class="
              currentIndex === index
                ? 'bg-neutral-200'
                : 'bg-[var(--text-color-secondary)] opacity-40'
            "
          />
        </div>

        <PrimeButton
          icon="pi pi-chevron-right"
          text
          rounded
          size="small"
          :disabled="isLastItem"
          @click="nextItem"
          class="w-8 h-8"
          :class="{ 'opacity-60': isLastItem }"
        />
      </div>
    </template>
  </HomeCardBlock>
</template>

<script setup>
  import { computed, ref, onMounted } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import HomeCardBlock from '@/views/Home/components/HomeCard.vue'
  import { solutionService } from '@/services/v2/marketplace/solution-service'

  defineOptions({ name: 'MarketplaceTrendsCard' })

  const items = ref([])
  const currentIndex = ref(0)
  const isLoading = ref(false)

  const currentItem = computed(() => items.value[currentIndex.value] || {})

  const hasItems = computed(() => items.value.length > 0)

  const isFirstItem = computed(() => currentIndex.value === 0)
  const isLastItem = computed(() => currentIndex.value === items.value.length - 1)

  const nextItem = () => {
    if (!hasItems.value || isLastItem.value) return
    currentIndex.value++
  }

  const previousItem = () => {
    if (!hasItems.value || isFirstItem.value) return
    currentIndex.value--
  }

  const goToItem = (index) => {
    currentIndex.value = index
  }

  const loadTrendingSolutions = async () => {
    isLoading.value = true
    try {
      items.value = await solutionService.listTrendingSolutions({ ids: [2, 6, 43] })
    } catch (error) {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadTrendingSolutions()
  })
</script>
