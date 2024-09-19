<template>
  <div class="rounded surface-border border min-h-[194px]">
    <div
      class="text-center py-10"
      v-if="!Object.keys(props.securityHeaders).length"
    >
      <i class="pi pi-spin pi-spinner"></i>
    </div>

    <ul
      class="py-4"
      v-if="Object.keys(props.securityHeaders).length"
    >
      <li class="px-4 py-2 flex items-center">
        <small class="w-24">Rating</small>
        {{ props.securityHeaders.grade }}
      </li>

      <li class="px-4 py-2 flex items-center">
        <small class="w-24">Score</small>
        {{ props.securityHeaders.score || 0 }}
      </li>

      <li
        v-if="props.securityHeaders.protocol"
        class="px-4 py-2 flex items-center"
      >
        <small class="w-24">Protocol</small>
        {{ props.securityHeaders.protocol }}
      </li>

      <li
        v-if="tls_version"
        class="px-4 py-2 flex items-center"
      >
        
        {{ props.securityHeaders.tls_version }}
      </li>

      <li class="px-4 py-2 flex" v-if="props.securityHeaders.list.length">
        <small class="w-24">Headers</small>
        <div class="flex flex-wrap gap-1">
          <span v-for="item in props.securityHeaders.list" :key="item">
            <Tag severity="danger" :value="item" />
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
  import { ref } from "vue"
  import Tag from "primevue/tag"

  const props = defineProps({
    securityHeaders: ref({
      type: Object,
      required: true
    })
  })
</script>