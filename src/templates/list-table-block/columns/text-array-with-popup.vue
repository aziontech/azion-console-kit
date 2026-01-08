<template>
  <div
    v-if="items.length > 0"
    class="flex items-center gap-1 relative w-full pr-1"
    @mouseenter="handleCellMouseEnter"
    @mouseleave="handleCellMouseLeave"
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <p class="overflow-hidden whitespace-nowrap text-ellipsis">
        {{ items[0] }}
      </p>
      <span
        v-if="items.length > 1"
        ref="tagElement"
        class="text-xs bg-[var(--surface-section)] px-2 py-1 rounded-md border border-[var(--surface-border)] cursor-pointer"
        @mouseenter="handleTagMouseEnter"
        @mouseleave="handleTagMouseLeave"
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
        v-if="showPopup"
        ref="popupElement"
        class="absolute z-50 rounded-md py-2 px-3 bg-[var(--surface-100)] border border-[var(--surface-border)] overflow-y-auto"
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
  import { ref, computed } from 'vue'
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

  const tagElement = ref(null)
  const popupElement = ref(null)
  const showPopup = ref(false)
  const popupPosition = ref({ posX: 0, posY: 0 })
  const hoverTimeout = ref(null)
  const popupHovered = ref(false)
  const isCellHovered = ref(false)

  const popupStyle = computed(() => ({
    left: `${popupPosition.value.posX}px`,
    top: `${popupPosition.value.posY}px`,
    width: '320px',
    maxHeight: '216px'
  }))

  const remainingItems = computed(() => {
    return props.items.slice(1)
  })

  const shouldShowCopy = computed(() => {
    return props.showCopy && props.items?.length
  })

  const allItemsAsString = computed(() => {
    return props.items.join('\n')
  })

  const handleTagMouseEnter = () => {
    hoverTimeout.value = setTimeout(() => {
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
      showPopup.value = true
    }, 1000)
  }

  const handleTagMouseLeave = () => {
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

  const handleCellMouseEnter = () => {
    isCellHovered.value = true
  }

  const handleCellMouseLeave = () => {
    isCellHovered.value = false
  }
</script>

<style scoped lang="scss">
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: var(--surface-800) var(--surface-100);
  }
</style>
