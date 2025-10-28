<template>
  <div
    v-if="visible"
    class="absolute z-50 bg-[var(--menu-bg)] border border-[var(--surface-border)] rounded-md px-3 py-2 max-w-[320px]"
    :style="popupStyle"
  >
    <div class="flex flex-col text-xs space-y-1">
      <span v-if="lastEditor">last edited by {{ lastEditor }}</span>
      <div class="flex items-center gap-1">
        <span class="px-2 py-1 rounded-sm bg-[var(--surface-border)]">UTC</span>
        <span>{{ formatDateToDayMonthYearHour(lastModified, 'UTC') }}</span>
      </div>
      <div
        v-if="accountStore.accountData?.timezone !== 'UTC'"
        class="flex items-center gap-1"
      >
        <span class="px-2 py-1 rounded-sm bg-[var(--surface-border)]">{{
          getOffset(accountStore.accountData?.timezone)
        }}</span>
        <span>{{
          formatDateToDayMonthYearHour(lastModified, accountStore.accountData?.timezone)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { formatDateToDayMonthYearHour, getOffset } from '@/helpers/convert-date'
  import { useAccountStore } from '@/stores/account'

  const accountStore = useAccountStore()

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    lastEditor: {
      type: String,
      required: true
    },
    lastModified: {
      type: String,
      required: true
    },
    position: {
      type: Object,
      default: () => ({ posX: 0, posY: 0 })
    }
  })

  const popupStyle = computed(() => ({
    left: `${props.position.posX - 320}px`,
    top: `${props.position.posY}px`
  }))
</script>
