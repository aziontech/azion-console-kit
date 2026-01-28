<template>
  <HomeCardBlock title="Marketplace Trends">
    <template #content>
      <div class="bg-[var(--surface-100)] flex gap-2.5 h-[138px] items-center px-4 py-3">
        <div class="flex-1 flex flex-col gap-3">
          <div class="flex flex-col gap-2 w-full">
            <div class="flex gap-2.5 items-center w-full">
              <div class="rounded-md size-6 overflow-hidden flex-shrink-0">
                <i class="pi pi-box text-[var(--text-color-base)]"></i>
              </div>
              <div class="flex-1 flex flex-col gap-0 justify-center">
                <h3
                  class="text-sm font-semibold text-[var(--text-color-base)] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {{ currentItem.name }}
                </h3>
              </div>
            </div>

            <p
              class="text-xs text-[var(--text-color-muted)] leading-[1.5] overflow-hidden max-h-[53px] min-h-[24px]"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                line-clamp: 3;
              "
            >
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
          :disabled="currentIndex === 0"
          @click="previousItem"
          class="w-8 h-8"
          :class="{ 'opacity-60': currentIndex === 0 }"
        />

        <div class="flex gap-1.5 h-full items-center justify-center">
          <button
            v-for="(item, index) in items"
            :key="index"
            @click="goToItem(index)"
            class="w-2 h-2 rounded-full transition-opacity"
            :class="currentIndex === index ? 'bg-white opacity-100' : 'bg-white opacity-16'"
          />
        </div>

        <PrimeButton
          icon="pi pi-chevron-right"
          text
          rounded
          size="small"
          @click="nextItem"
          class="w-8 h-8"
        />
      </div>
    </template>
  </HomeCardBlock>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import HomeCardBlock from '@/templates/home-cards-block/index.vue'

  defineOptions({ name: 'MarketplaceTrendsCard' })

  const props = defineProps({
    items: {
      type: Array,
      required: true
    }
  })

  const currentIndex = ref(0)

  const currentItem = computed(() => props.items[currentIndex.value])

  const nextItem = () => {
    currentIndex.value = (currentIndex.value + 1) % props.items.length
  }

  const previousItem = () => {
    currentIndex.value = !currentIndex.value ? props.items.length - 1 : currentIndex.value - 1
  }

  const goToItem = (index) => {
    currentIndex.value = index
  }
</script>
