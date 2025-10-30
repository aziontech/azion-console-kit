<template>
  <div class="gap-2 flex items-center relative">
    <p
      ref="textElement"
      class="overflow-hidden whitespace-nowrap text-ellipsis"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      {{ text }}
    </p>
    <Teleport to="body">
      <div
        v-if="showPopup"
        class="absolute z-50 max-w-80 rounded-md py-2 px-3 bg-[var(--surface-100)] border border-[var(--surface-border)]"
        :style="popupStyle"
      >
        <p class="text-xs break-words">{{ text }}</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'

  defineProps({
    text: String
  })

  const textElement = ref(null)
  const showPopup = ref(false)
  const popupPosition = ref({ posX: 0, posY: 0 })
  const hoverTimeout = ref(null)

  const popupStyle = computed(() => ({
    left: `${popupPosition.value.posX}px`,
    top: `${popupPosition.value.posY}px`
  }))

  const isTextTruncated = () => {
    if (!textElement.value) return false
    return textElement.value.scrollWidth > textElement.value.clientWidth
  }

  const handleMouseEnter = () => {
    if (!isTextTruncated()) return

    hoverTimeout.value = setTimeout(() => {
      const rect = textElement.value.getBoundingClientRect()
      popupPosition.value = {
        posX: rect.right + 8,
        posY: rect.top
      }
      showPopup.value = true
    }, 1000)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
      hoverTimeout.value = null
    }
    showPopup.value = false
  }
</script>
