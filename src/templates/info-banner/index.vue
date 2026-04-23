<script setup>
  import { computed } from 'vue'
  import { motion, AnimatePresence } from 'motion-v'
  import PrimeButton from '@aziontech/webkit/button'
  import { useInfoBannerStore } from '@/stores/info-banner'

  defineOptions({ name: 'InfoBanner' })

  const store = useInfoBannerStore()

  const severityStyles = {
    info: {
      container: 'bg-[rgba(34,34,34,0.4)] border-[var(--surface-border)]',
      iconBg: 'bg-[var(--surface-400)]',
      icon: 'pi pi-info-circle',
      iconColor: 'text-[#ededed]'
    },
    warning: {
      container: 'bg-[rgba(255,182,77,0.1)] border-[rgba(255,182,77,0.2)]',
      iconBg: 'bg-[rgba(255,182,77,0.2)]',
      icon: 'pi pi-exclamation-triangle',
      iconColor: 'text-[#FFB64D]'
    },
    error: {
      container: 'bg-[rgba(245,61,61,0.1)] border-[rgba(245,61,61,0.2)]',
      iconBg: 'bg-[rgba(245,61,61,0.2)]',
      icon: 'pi pi-exclamation-triangle',
      iconColor: 'text-[#EF4444]'
    }
  }

  const visibleBanners = computed(() => store.visibleBanners)

  const getStyle = (severity) => severityStyles[severity] || severityStyles.info

  const handleClose = (id) => {
    store.hide(id)
  }
</script>

<template>
  <div
    class="flex flex-col gap-2 w-full px-8"
    :class="{
      'mt-8': visibleBanners.length
    }"
  >
    <div class="flex flex-col">
      <AnimatePresence>
        <motion.div
          v-for="banner in visibleBanners"
          :key="banner.id"
          :initial="{ height: 0, marginBottom: 0 }"
          :animate="{ height: 'auto', marginBottom: 8 }"
          :exit="{ height: 0, marginBottom: 0 }"
          :transition="{
            type: 'spring',
            visualDuration: 0.3,
            bounce: 0
          }"
          class="overflow-hidden"
        >
          <motion.div
            :initial="{ opacity: 0, y: -20 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -20 }"
            :transition="{
              type: 'spring',
              visualDuration: 0.25,
              bounce: 0.1
            }"
            :class="[
              'flex gap-[10px] items-center px-4 py-3 rounded-md w-full border',
              getStyle(banner.severity).container
            ]"
          >
            <div :class="['flex items-center p-2 rounded-[6px]', getStyle(banner.severity).iconBg]">
              <i
                :class="[
                  getStyle(banner.severity).icon,
                  'text-[16px]',
                  getStyle(banner.severity).iconColor
                ]"
              />
            </div>
            <div
              class="flex-1 text-xs leading-5 text-[#ededed]"
              v-html="banner.content"
            />
            <PrimeButton
              text
              rounded
              severity="secondary"
              icon="pi pi-times"
              class="!w-7 !h-7"
              @click="handleClose(banner.id)"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
</template>
