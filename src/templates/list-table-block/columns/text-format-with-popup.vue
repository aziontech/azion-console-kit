<template>
  <div class="gap-2 flex items-center relative w-full justify-between pr-1">
    <p
      ref="textElement"
      class="overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-0"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      {{ text }}
    </p>
    <CopyBlock
      v-if="shouldShowCopy"
      :value="text"
      v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
    <Teleport to="body">
      <div
        v-if="showPopup"
        class="absolute z-50 max-w-80 rounded-md py-2 px-3 bg-[var(--surface-100)] border border-[var(--surface-border)]"
        :style="popupStyle"
        @mouseenter="handlePopupMouseEnter"
        @mouseleave="handlePopupMouseLeave"
      >
        <p class="text-xs break-words">{{ text }}</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import CopyBlock from '@/templates/copy-block/copy-block.vue'

  const props = defineProps({
    text: String,
    showCopy: {
      type: Boolean,
      default: true
    }
  })

  const textElement = ref(null)
  const showPopup = ref(false)
  const popupPosition = ref({ posX: 0, posY: 0 })
  const hoverTimeout = ref(null)
  const popupHovered = ref(false)

  const shouldShowCopy = computed(() => {
    return props.showCopy && props.text
  })

  const popupStyle = computed(() => ({
    left: `${popupPosition.value.posX}px`,
    top: `${popupPosition.value.posY}px`,
    maxWidth: '320px'
  }))

  const isTextTruncated = () => {
    if (!textElement.value) return false
    return textElement.value.scrollWidth > textElement.value.clientWidth
  }

  const handleMouseEnter = () => {
    if (!isTextTruncated()) return

    hoverTimeout.value = setTimeout(() => {
      const rect = textElement.value.getBoundingClientRect()
      const popupWidth = 320
      const viewportWidth = window.innerWidth

      let posX = rect.right + 6

      if (posX + popupWidth > viewportWidth) {
        posX = rect.left - popupWidth - 6
      }

      popupPosition.value = {
        posX: posX,
        posY: rect.top - 7
      }
      showPopup.value = true
    }, 1000)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
      hoverTimeout.value = null
    }
    setTimeout(() => {
      if (!popupHovered.value) {
        showPopup.value = false
      }
    }, 100)
  }

  const handlePopupMouseEnter = () => {
    popupHovered.value = true
  }

  const handlePopupMouseLeave = () => {
    popupHovered.value = false
    showPopup.value = false
  }
</script>
