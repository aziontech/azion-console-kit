<template>
  <div
    v-if="items.length > 0"
    class="flex items-center gap-1 relative w-full pr-1"
    @mouseenter="handleCellMouseEnter"
    @mouseleave="handleCellMouseLeave"
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <p
        ref="textElement"
        class="overflow-hidden whitespace-nowrap text-ellipsis flex-1 min-w-0"
        @mouseenter="handleTextMouseEnter"
        @mouseleave="handleTextMouseLeave"
      >
        {{ items[0] }}
      </p>
      <span
        v-if="items.length > 1"
        ref="tagElement"
        class="text-xs bg-[var(--surface-section)] px-2 py-1 rounded-md border border-[var(--surface-border)] cursor-pointer"
        @mouseenter="handleTagMouseEnter"
        @mouseleave="handleTagMouseLeave"
        @click.stop="handleTagClick"
      >
        +{{ items.length - 1 }}
      </span>
    </div>
    <CopyBlock
      v-if="shouldShowCopy"
      :value="allItemsAsString"
      :isCopyVisible="isCellHovered"
      v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
    <Teleport to="body">
      <div
        v-if="showTextPopup"
        class="absolute z-[9999] max-w-80 rounded-md py-2 px-3 bg-[var(--surface-100)] border border-[var(--surface-border)]"
        :style="textPopupStyle"
        @mouseenter="handleTextPopupMouseEnter"
        @mouseleave="handleTextPopupMouseLeave"
      >
        <p class="text-xs break-words">{{ items[0] }}</p>
      </div>
      <div
        v-if="showPopup"
        ref="popupElement"
        class="absolute z-[9999] w-fit rounded-md py-2 px-3 bg-[var(--surface-100)] border border-[var(--surface-border)] overflow-y-auto"
        :style="popupStyle"
        @mouseenter="handlePopupMouseEnter"
        @mouseleave="handlePopupMouseLeave"
      >
        <ul class="text-xs space-y-1">
          <li
            v-for="(item, index) in remainingItems"
            :key="index"
            class="break-words"
          >
            {{ item }}
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import CopyBlock from '@/templates/copy-block/copy-block.vue'

  const props = defineProps({
    items: {
      type: Array,
      default: () => []
    },
    showCopy: {
      type: Boolean,
      default: true
    }
  })

  const textElement = ref(null)
  const tagElement = ref(null)
  const popupElement = ref(null)
  const showPopup = ref(false)
  const showTextPopup = ref(false)
  const popupPosition = ref({ posX: 0, posY: 0 })
  const textPopupPosition = ref({ posX: 0, posY: 0 })
  const hoverTimeout = ref(null)
  const textHoverTimeout = ref(null)
  const popupHovered = ref(false)
  const textPopupHovered = ref(false)
  const isCellHovered = ref(false)
  const isPopupFixed = ref(false)

  const popupStyle = computed(() => ({
    left: `${popupPosition.value.posX}px`,
    top: `${popupPosition.value.posY}px`,
    maxWidth: '320px',
    maxHeight: '216px'
  }))

  const textPopupStyle = computed(() => ({
    left: `${textPopupPosition.value.posX}px`,
    top: `${textPopupPosition.value.posY}px`,
    maxWidth: '320px'
  }))

  const isTextTruncated = () => {
    if (!textElement.value) return false
    return textElement.value.scrollWidth > textElement.value.clientWidth
  }

  const handleTextMouseEnter = () => {
    if (!isTextTruncated()) return

    textHoverTimeout.value = setTimeout(() => {
      const rect = textElement.value?.getBoundingClientRect()
      if (!rect) return
      const popupWidth = 320
      const viewportWidth = window.innerWidth

      let posX = rect.right + 6

      if (posX + popupWidth > viewportWidth) {
        posX = rect.left - popupWidth - 6
      }

      textPopupPosition.value = {
        posX: posX,
        posY: rect.top - 7
      }
      showTextPopup.value = true
    }, 1000)
  }

  const handleTextMouseLeave = () => {
    if (textHoverTimeout.value) {
      clearTimeout(textHoverTimeout.value)
      textHoverTimeout.value = null
    }
    setTimeout(() => {
      if (!textPopupHovered.value) {
        showTextPopup.value = false
      }
    }, 100)
  }

  const handleTextPopupMouseEnter = () => {
    textPopupHovered.value = true
  }

  const handleTextPopupMouseLeave = () => {
    textPopupHovered.value = false
    showTextPopup.value = false
  }

  const remainingItems = computed(() => {
    return props.items.slice(1)
  })

  const shouldShowCopy = computed(() => {
    return props.showCopy && props.items?.length
  })

  const allItemsAsString = computed(() => {
    return props.items.join('\n')
  })

  const updatePopupPosition = () => {
    const rect = tagElement.value?.getBoundingClientRect()
    if (!rect) return
    const popupWidth = 320
    const viewportWidth = window.innerWidth

    let posX = rect.right + 6

    if (posX + popupWidth > viewportWidth) {
      posX = rect.left - popupWidth - 6
    }

    popupPosition.value = {
      posX: posX,
      posY: rect.top
    }
  }

  const handleTagClick = () => {
    isPopupFixed.value = !isPopupFixed.value
    if (isPopupFixed.value) {
      updatePopupPosition()
      showPopup.value = true
    } else {
      showPopup.value = false
    }
  }

  const handleTagMouseEnter = () => {
    if (isPopupFixed.value) return

    hoverTimeout.value = setTimeout(() => {
      updatePopupPosition()
      showPopup.value = true
    }, 1000)
  }

  const handleTagMouseLeave = () => {
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
      hoverTimeout.value = null
    }

    if (isPopupFixed.value) return

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
    if (!isPopupFixed.value) {
      showPopup.value = false
    }
  }

  const handleCellMouseEnter = () => {
    isCellHovered.value = true
  }

  const handleCellMouseLeave = () => {
    isCellHovered.value = false
  }

  const handleClickOutside = (event) => {
    if (!isPopupFixed.value) return

    const clickedInsideTag = tagElement.value?.contains(event.target)
    const clickedInsidePopup = popupElement.value?.contains(event.target)

    if (!clickedInsideTag && !clickedInsidePopup) {
      isPopupFixed.value = false
      showPopup.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    if (hoverTimeout.value) {
      clearTimeout(hoverTimeout.value)
    }
    if (textHoverTimeout.value) {
      clearTimeout(textHoverTimeout.value)
    }
  })
</script>

<style scoped lang="scss">
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: var(--surface-800) var(--surface-100);
  }
</style>
