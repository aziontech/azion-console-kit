<script setup>
  defineOptions({ name: 'SessionTabHeader' })

  const props = defineProps({
    tab: {
      type: Object,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['close'])

  const handleClose = (event) => {
    event.stopPropagation()
    event.preventDefault()
    emit('close', props.tab.id)
  }

  const displayLabel = () => props.tab.label?.trim() || 'Untitled'
</script>

<template>
  <span
    class="session-tab-header"
    :class="{ 'session-tab-header--active': active }"
    :data-testid="`session-tab-header-${tab.id ?? 'events'}`"
  >
    <i
      v-if="tab.icon"
      :class="tab.icon"
      class="session-tab-header__icon"
    />
    <span
      class="session-tab-header__label"
      :title="displayLabel()"
    >
      {{ displayLabel() }}
    </span>
    <button
      v-if="tab.closable !== false"
      type="button"
      class="session-tab-header__close"
      :aria-label="`Close ${displayLabel()}`"
      :data-testid="`session-tab-close-${tab.id}`"
      @click="handleClose"
    >
      <i class="pi pi-times" />
    </button>
  </span>
</template>

<style scoped>
  .session-tab-header {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    max-width: 14rem;
    min-width: 4rem;
  }

  .session-tab-header__icon {
    font-size: 0.875rem;
    color: currentColor;
    opacity: 0.75;
    flex-shrink: 0;
    transition: opacity 0.15s ease;
  }

  .session-tab-header--active .session-tab-header__icon {
    opacity: 1;
  }

  .session-tab-header__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .session-tab-header__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: 0.125rem;
    padding: 0;
    width: 1rem;
    height: 1rem;
    background: transparent;
    border: none;
    color: currentColor;
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .session-tab-header__close:hover,
  .session-tab-header__close:focus-visible {
    opacity: 1;
    outline: none;
  }

  .session-tab-header__close i {
    font-size: 0.625rem;
  }
</style>
