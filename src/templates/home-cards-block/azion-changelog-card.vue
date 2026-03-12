<template>
  <HomeCardBlock
    v-if="changelogItems.length > 0"
    title="Azion Changelog"
  >
    <template #content>
      <div class="p-4 bg-[var(--card-content-bg)]">
        <div class="flex items-center w-[273px]">
          <div class="flex flex-col items-start w-full">
            <div
              v-for="(item, index) in changelogItems"
              :key="index"
              class="flex items-start min-h-[70px] w-full py-1"
            >
              <div class="flex flex-col items-center self-stretch">
                <div
                  class="border-2 surface-border flex items-center justify-center p-0.5 rounded-full h-4 w-4"
                >
                  <div class="flex-1 h-full rounded-full flex items-center justify-center">
                    <div class="bg-orange-500 rounded-full h-1 w-1"></div>
                  </div>
                </div>

                <div
                  v-if="index < changelogItems.length - 1"
                  class="bg-[var(--surface-border)] flex-1 w-0.5"
                ></div>
              </div>

              <div class="flex-1 flex flex-col px-3.5">
                <div class="flex flex-col gap-1 rounded-md w-full">
                  <p class="text-[10px] var(--text-color-secondary) leading-normal">
                    {{ item.time }}
                  </p>
                  <p class="text-xs var(--text-color-primary)) leading-[1.5]">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <a
        href="https://www.azion.com/en/documentation/products/release-notes/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-[var(--text-color-link)] text-center cursor-pointer hover:underline w-full"
      >
        View all Changelog...
      </a>
    </template>
  </HomeCardBlock>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import HomeCardBlock from '@/views/Home/components/HomeCard.vue'
  import { listChangelogService } from '@/services/appcues-services'

  defineOptions({ name: 'AzionChangelogCard' })

  defineEmits(['viewAll'])

  const changelogItems = ref([])
  const isLoading = ref(false)

  const loadChangelog = async () => {
    isLoading.value = true
    try {
      const items = await listChangelogService()
      changelogItems.value = items
    } catch {
      changelogItems.value = []
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadChangelog()
  })
</script>
