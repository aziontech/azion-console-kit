<template>
  <HomeCardBlock title="Azion Changelog">
    <template #content>
      <div class="p-4">
        <div class="flex items-center w-[273px]">
          <div class="flex flex-col items-start w-full">
            <div
              v-for="(item, index) in changelogItems"
              :key="index"
              class="flex items-start min-h-[70px] w-full"
            >
              <div class="flex flex-col items-center self-stretch">
                <div
                  class="bg-[#18181b] border-2 border-[#3f3f46] flex items-center justify-center p-0.5 rounded-[7.875px] size-[15.75px]"
                >
                  <div
                    class="bg-[#18181b] flex-1 h-full rounded-[7.875px] flex items-center justify-center"
                    style="
                      box-shadow:
                        0px 0.5px 0px 0px rgba(0, 0, 0, 0.06),
                        0px 1px 1px 0px rgba(0, 0, 0, 0.12);
                    "
                  >
                    <div class="bg-[#fe601f] rounded-[2.625px] size-[5.25px]"></div>
                  </div>
                </div>

                <div
                  v-if="index < changelogItems.length - 1"
                  class="bg-[#3f3f46] flex-1 w-0.5"
                ></div>
              </div>

              <div class="flex-1 flex flex-col px-3.5">
                <div class="flex flex-col gap-1 rounded-md w-full">
                  <p class="text-[10px] text-[#a1a1aa] leading-normal">
                    {{ item.time }}
                  </p>
                  <p class="text-xs text-white leading-[1.5]">
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
      <span
        class="text-xs text-[var(--text-color-link)] text-center cursor-pointer hover:underline w-full"
        @click="$emit('viewAll')"
      >
        View all Changelog...
      </span>
    </template>
  </HomeCardBlock>
</template>

<script setup>
  import HomeCardBlock from './index.vue'

  defineOptions({ name: 'AzionChangelogCard' })

  defineProps({
    changelogItems: {
      type: Array,
      required: true
    }
  })

  defineEmits(['viewAll'])
</script>
