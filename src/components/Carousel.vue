<template>
  <div
    ref="rootRef"
    class="carousel"
    role="region"
    aria-roledescription="carousel"
    :aria-label="ariaLabel"
  >
    <div
      ref="viewportRef"
      class="carousel-viewport"
      :class="{ 'is-grabbing': isDragging }"
      :style="viewportStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @scroll.passive="onScroll"
    >
      <div
        v-for="(_, idx) in slidesCount"
        :key="idx"
        class="carousel-slide shrink-0"
        :style="slideStyle"
        :aria-roledescription="'slide'"
        :aria-label="`${idx + 1} of ${slidesCount}`"
      >
        <slot
          :name="`slide-${idx}`"
          :index="idx"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

  defineOptions({
    name: 'BaseCarousel'
  })

  const props = defineProps({
    slidesCount: {
      type: Number,
      required: true
    },
    slidesPerView: {
      type: Number,
      default: 1
    },
    spaceBetween: {
      type: Number,
      default: 16
    },
    maxSlideWidth: {
      type: Number,
      default: 0
    },
    initialIndex: {
      type: Number,
      default: 0
    },
    snap: {
      type: Boolean,
      default: true
    },
    snapAlign: {
      type: String,
      default: 'center',
      validator: (value) => ['start', 'center', 'end'].includes(value)
    },
    enableMouseDrag: {
      type: Boolean,
      default: true
    },
    ariaLabel: {
      type: String,
      default: 'Carousel'
    }
  })

  const emit = defineEmits(['slideChange'])

  const rootRef = ref(null)
  const viewportRef = ref(null)

  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartScroll = ref(0)
  const pointerId = ref(null)
  const activeIndex = ref(0)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  let scrollFrame = null
  let resizeObserver = null

  const FADE_SIZE = 32

  const slideStyle = computed(() => {
    const gap = props.spaceBetween
    const base = `calc((100% - ${gap * (props.slidesPerView - 1)}px) / ${props.slidesPerView})`
    return {
      width: props.maxSlideWidth > 0 ? `min(${base}, ${props.maxSlideWidth}px)` : base,
      marginRight: `${gap}px`,
      scrollSnapAlign: props.snap ? props.snapAlign : 'none'
    }
  })

  const viewportStyle = computed(() => {
    if (!canScrollLeft.value && !canScrollRight.value) return {}
    const leftStop = canScrollLeft.value ? `${FADE_SIZE}px` : '0'
    const rightStop = canScrollRight.value ? `calc(100% - ${FADE_SIZE}px)` : '100%'
    const leftStart = canScrollLeft.value ? 'transparent' : 'black'
    const rightEnd = canScrollRight.value ? 'transparent' : 'black'
    const mask = `linear-gradient(to right, ${leftStart} 0, black ${leftStop}, black ${rightStop}, ${rightEnd} 100%)`
    return {
      WebkitMaskImage: mask,
      maskImage: mask
    }
  })

  function updateScrollEdges() {
    const viewport = viewportRef.value
    if (!viewport) {
      canScrollLeft.value = false
      canScrollRight.value = false
      return
    }
    canScrollLeft.value = viewport.scrollLeft > 1
    canScrollRight.value = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1
  }

  function onPointerDown(event) {
    if (!props.enableMouseDrag) return
    if (event.pointerType === 'touch') return
    if (event.button !== undefined && event.button !== 0) return
    if (!viewportRef.value) return

    isDragging.value = true
    dragStartX.value = event.clientX
    dragStartScroll.value = viewportRef.value.scrollLeft
    pointerId.value = event.pointerId
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // setPointerCapture can throw if the element isn't in DOM yet — safe to ignore
    }
  }

  function onPointerMove(event) {
    if (!isDragging.value || !viewportRef.value) return
    const delta = dragStartX.value - event.clientX
    viewportRef.value.scrollLeft = dragStartScroll.value + delta
  }

  function endDrag(event) {
    if (!isDragging.value) return
    if (pointerId.value !== null && event?.currentTarget) {
      try {
        event.currentTarget.releasePointerCapture(pointerId.value)
      } catch {
        // releasePointerCapture can throw if capture was lost — safe to ignore
      }
    }
    isDragging.value = false
    pointerId.value = null
    dragStartX.value = 0
    dragStartScroll.value = 0
  }

  function onPointerUp(event) {
    endDrag(event)
  }

  function onPointerLeave(event) {
    if (isDragging.value) endDrag(event)
  }

  function onScroll() {
    if (scrollFrame) return
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null
      const viewport = viewportRef.value
      if (!viewport) return
      updateScrollEdges()
      const slide = viewport.firstElementChild
      if (!slide) return
      const slideTotal = slide.getBoundingClientRect().width + props.spaceBetween
      if (slideTotal <= 0) return
      const next = Math.round(viewport.scrollLeft / slideTotal)
      if (next !== activeIndex.value) {
        activeIndex.value = next
        emit('slideChange', next)
      }
    })
  }

  function scrollToIndex(idx, behavior = 'smooth') {
    if (!viewportRef.value) return
    const target = viewportRef.value.children?.[idx]
    if (!target) return
    target.scrollIntoView({ behavior, inline: props.snapAlign, block: 'nearest' })
  }

  onMounted(() => {
    if (props.initialIndex > 0 && props.initialIndex < props.slidesCount) {
      // 'auto' = jump without animation; runs before paint so the user never
      // sees the first slide flash before the carousel settles on the saved one.
      scrollToIndex(props.initialIndex, 'auto')
      activeIndex.value = props.initialIndex
    }
    updateScrollEdges()
    onScroll()
    if (typeof ResizeObserver !== 'undefined' && viewportRef.value) {
      resizeObserver = new ResizeObserver(() => updateScrollEdges())
      resizeObserver.observe(viewportRef.value)
    } else {
      window.addEventListener('resize', updateScrollEdges)
    }
  })

  onBeforeUnmount(() => {
    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame)
      scrollFrame = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    } else {
      window.removeEventListener('resize', updateScrollEdges)
    }
  })

  defineExpose({
    scrollToIndex,
    activeIndex
  })
</script>

<style scoped>
  .carousel {
    position: relative;
    width: 100%;
  }

  .carousel-viewport {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overscroll-behavior-x: contain;
    cursor: grab;
    padding-bottom: 4px;
    transition:
      -webkit-mask-image 0.2s ease,
      mask-image 0.2s ease;
  }

  .carousel-viewport.is-grabbing {
    cursor: grabbing;
    scroll-snap-type: none;
  }

  .carousel-viewport::-webkit-scrollbar {
    display: none;
  }

  .carousel-slide:last-child {
    margin-right: 0 !important;
  }
</style>
