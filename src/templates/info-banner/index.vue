<script setup>
  import { computed } from 'vue'
  import PrimeButton from 'primevue/button'
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
    class="flex flex-col gap-2 w-full"
    :class="{
      'pb-8': visibleBanners.length
    }"
  >
    <TransitionGroup
      name="banner"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="banner in visibleBanners"
        :key="banner.id"
        :class="[
          'flex gap-[10px] items-center px-4 py-3 rounded-md w-full border overflow-hidden',
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
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
  .banner-enter-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease,
      max-height 0.3s ease,
      margin 0.3s ease,
      padding 0.3s ease;
  }

  .banner-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      max-height 0.2s ease,
      margin 0.2s ease,
      padding 0.2s ease;
  }

  .banner-enter-from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-bottom: 0;
    transform: translateY(-10px);
    overflow: hidden;
  }

  .banner-enter-to {
    opacity: 1;
    max-height: 100px;
    transform: translateY(0);
  }

  .banner-leave-from {
    opacity: 1;
    max-height: 100px;
  }

  .banner-leave-to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-bottom: 0;
    transform: translateY(-10px);
    overflow: hidden;
  }

  .banner-move {
    transition: transform 0.3s ease;
  }
</style>
