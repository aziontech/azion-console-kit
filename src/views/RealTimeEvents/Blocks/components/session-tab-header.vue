<script setup>
  import { ref, nextTick } from 'vue'

  defineOptions({ name: 'SessionTabHeader' })

  const props = defineProps({
    tab: {
      type: Object,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    },
    renameable: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['close', 'rename'])

  // ── Rename state ──
  const isRenaming = ref(false)
  const renameInputRef = ref(null)
  const renameValue = ref('')

  const handleClose = (event) => {
    event.stopPropagation()
    event.preventDefault()
    emit('close', props.tab.id)
  }

  const displayLabel = () => props.tab.label?.trim() || 'Untitled'

  const startRename = async () => {
    if (!props.renameable) return
    renameValue.value = displayLabel()
    isRenaming.value = true
    await nextTick()
    renameInputRef.value?.select()
  }

  const commitRename = () => {
    if (!isRenaming.value) return
    const trimmed = renameValue.value.trim()
    if (trimmed) {
      emit('rename', props.tab.id, trimmed)
    }
    isRenaming.value = false
  }

  const cancelRename = () => {
    isRenaming.value = false
    renameValue.value = ''
  }

  const handleRenameKeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelRename()
    }
  }
</script>

<template>
  <span
    class="session-tab-header"
    :class="{ 'session-tab-header--active': active }"
    :data-testid="`session-tab-header-${tab.id ?? 'events'}`"
    @dblclick="startRename"
  >
    <i
      v-if="tab.icon"
      :class="tab.icon"
      class="session-tab-header__icon"
    />
    <!-- Rename input (shown on double-click for renameable tabs) -->
    <input
      v-if="isRenaming"
      ref="renameInputRef"
      v-model="renameValue"
      class="session-tab-header__rename-input"
      :aria-label="`Rename tab ${displayLabel()}`"
      data-testid="session-tab-rename-input"
      @keydown="handleRenameKeydown"
      @blur="commitRename"
      @click.stop
    />
    <span
      v-else
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

  .session-tab-header__rename-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid currentColor;
    color: currentColor;
    font: inherit;
    font-size: inherit;
    line-height: inherit;
    padding: 0;
    min-width: 4rem;
    max-width: 10rem;
    outline: none;
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
