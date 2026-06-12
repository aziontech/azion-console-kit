<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'VersionStateDot' })

  const props = defineProps({
    state: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      default: null
    }
  })

  const STATE_META = {
    draft: { label: 'Draft', kind: 'dot', tone: 'draft' },
    building: { label: 'Building', kind: 'ring', tone: 'building' },
    ready: { label: 'Ready', kind: 'dot', tone: 'ready' },
    active: { label: 'Active', kind: 'dot', tone: 'ready' },
    archived: { label: 'Archived', kind: 'dot', tone: 'muted' },
    cancelled: { label: 'Cancelled', kind: 'dot', tone: 'muted' },
    failed: { label: 'Failed', kind: 'dot', tone: 'failed' }
  }

  const meta = computed(
    () => STATE_META[props.state] || { label: props.state, kind: 'dot', tone: 'muted' }
  )
</script>

<template>
  <span
    class="version-state-dot"
    :data-state="meta.tone"
    :data-testid="`version-state-dot__${state}`"
  >
    <span
      v-if="meta.kind === 'ring'"
      class="version-state-dot__ring"
      aria-hidden="true"
    />
    <span
      v-else
      class="version-state-dot__circle"
      :class="`version-state-dot__circle--${meta.tone}`"
      aria-hidden="true"
    />
    <span class="version-state-dot__label">{{ meta.label }}</span>
    <span
      v-if="duration"
      class="version-state-dot__duration"
    >
      {{ duration }}
    </span>
  </span>
</template>

<style scoped>
  .version-state-dot {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--text-color);
    white-space: nowrap;
  }

  .version-state-dot__circle {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .version-state-dot__circle--ready {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
  }

  .version-state-dot__circle--draft {
    background: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.16);
  }

  .version-state-dot__circle--failed {
    background: #f87171;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.16);
  }

  .version-state-dot__circle--muted {
    background: #6b7280;
    box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.12);
  }

  .version-state-dot__ring {
    width: 12px;
    height: 12px;
    border: 1.6px solid var(--text-color-secondary);
    border-top-color: transparent;
    border-radius: 9999px;
    flex-shrink: 0;
    animation: version-state-dot-spin 1s linear infinite;
  }

  .version-state-dot__label {
    line-height: 1.25rem;
  }

  .version-state-dot__duration {
    font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 0.71875rem;
    color: var(--text-color-secondary);
  }

  @keyframes version-state-dot-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
