<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'domain-row' })

  const props = defineProps({
    domain: {
      type: String,
      default: ''
    },
    subdomain: {
      type: String,
      default: ''
    },
    environmentLabel: {
      type: String,
      default: ''
    },
    certificateLabel: {
      type: String,
      default: ''
    },
    isUrlVersioned: {
      type: Boolean,
      default: false
    },
    isAutoDomain: {
      type: Boolean,
      default: false
    },
    disableRemove: {
      type: Boolean,
      default: false
    },
    dataTestid: {
      type: String,
      default: 'domain-row'
    }
  })

  defineEmits(['edit', 'remove'])

  const AZION_APP_SUFFIX = '.azion.app'

  const isAzionAppDomain = computed(
    () =>
      props.domain === 'azion.app' ||
      `${props.subdomain ? `${props.subdomain}.` : ''}${props.domain || ''}`.endsWith(
        AZION_APP_SUFFIX
      )
  )

  const fqdn = computed(() => {
    if (!props.domain && !props.subdomain) return 'New domain'
    if (props.isAutoDomain && isAzionAppDomain.value) {
      return props.subdomain || (props.domain || '').replace(/\.azion\.app$/, '')
    }
    const sub = props.subdomain ? `${props.subdomain}.` : ''
    return `${sub}${props.domain || ''}`
  })
</script>

<template>
  <div
    class="flex items-center justify-between gap-4 min-h-12 px-4 py-2 border-t surface-border"
    :data-testid="dataTestid"
  >
    <div class="flex flex-1 gap-4 min-w-0">
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] uppercase tracking-wider text-color-secondary leading-none">
            domain
          </span>
          <span
            v-if="isAutoDomain"
            class="text-[10px] leading-none px-1.5 py-0.5 rounded border surface-border text-color-secondary"
            title="This domain was generated automatically and can't be edited."
            :data-testid="`${dataTestid}__auto-badge`"
          >
            Auto-generated
          </span>
        </div>
        <span class="text-xs truncate">
          <span
            v-if="isUrlVersioned && (domain || subdomain)"
            class="text-color-secondary"
            title="This environment is url-versioned: each deploy generates a dynamic hash prefix."
            >*.</span
          >{{ fqdn
          }}<span
            v-if="isAutoDomain && isAzionAppDomain"
            class="text-color-secondary"
            >.azion.app</span
          >
        </span>
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <span class="text-[10px] uppercase tracking-wider text-color-secondary leading-none">
          environment
        </span>
        <span class="text-xs truncate">{{ environmentLabel || '—' }}</span>
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <span class="text-[10px] uppercase tracking-wider text-color-secondary leading-none">
          certificate
        </span>
        <span class="text-xs truncate">{{ certificateLabel || '—' }}</span>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <PrimeButton
        icon="pi pi-pencil"
        class="p-button-outlined p-button-sm w-7 h-7 p-0"
        :data-testid="`${dataTestid}__edit`"
        title="Edit"
        @click="$emit('edit')"
      />
      <PrimeButton
        icon="pi pi-trash"
        class="p-button-outlined p-button-sm p-button-danger w-7 h-7 p-0"
        :disabled="disableRemove"
        :data-testid="`${dataTestid}__remove`"
        title="Remove"
        @click="$emit('remove')"
      />
    </div>
  </div>
</template>
