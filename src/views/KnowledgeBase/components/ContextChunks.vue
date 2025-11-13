<template>
  <div
    v-if="contexts && contexts.length > 0"
    class="mt-4 flex flex-col gap-2"
  >
    <div class="text-sm font-medium text-color-secondary">Sources</div>
    <Accordion
      :multiple="true"
      class="w-full"
    >
      <AccordionTab
        v-for="(chunk, index) in contexts"
        :key="chunk.chunk_id"
        :header="getChunkHeader(chunk, index)"
      >
        <template #header>
          <div class="flex items-center justify-between w-full pr-2">
            <div class="flex items-center gap-2">
              <i class="pi pi-file text-sm"></i>
              <span class="font-medium">{{ chunk.title || `Chunk ${chunk.chunk_id}` }}</span>
            </div>
            <div class="flex items-center gap-3">
              <PrimeTag
                v-if="chunk.similarity !== null"
                :value="`${Math.round(chunk.similarity * 100)}% match`"
                severity="info"
                class="text-xs"
              />
              <PrimeTag
                :value="chunk.search_type || 'similarity'"
                severity="secondary"
                class="text-xs"
              />
            </div>
          </div>
        </template>
        <div class="flex flex-col gap-3">
          <div class="text-sm whitespace-pre-wrap">{{ chunk.content }}</div>
          <div
            v-if="chunk.source"
            class="text-xs text-color-secondary"
          >
            <span class="font-medium">Source:</span> {{ chunk.source }}
          </div>
        </div>
      </AccordionTab>
    </Accordion>
  </div>
</template>

<script setup>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import PrimeTag from 'primevue/tag'

  defineOptions({
    name: 'context-chunks'
  })

  defineProps({
    contexts: {
      type: Array,
      default: () => []
    }
  })

  const getChunkHeader = (chunk, index) => {
    return chunk.title || `Source ${index + 1}`
  }
</script>

