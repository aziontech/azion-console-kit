<template>
  <div class="flex flex-col p-6 border surface-border rounded gap-4 max-w-[352px] max-h-max">
    <div class="flex flex-col gap-1">
      <h1 class="text-base font-medium text-color">Top 10 Matching Paths by Regex</h1>
      <p class="text-sm font-normal text-color-secondary">
        These paths match your regex pattern. Remember, more than these paths can be matched by your
        regex.
      </p>
    </div>
    <div class="flex flex-col gap-2">
      <div
        class="flex justify-between"
        v-for="path in topPathsRef"
        :key="path.path"
      >
        <p>
          <template v-if="path.isMatched && path.matchInfo">
            <span>{{ path.matchInfo.beforeMatch }}</span>
            <span
              class="bg-[var(--p-tag-background)] text-[var(--p-tag-color)] font-mono px-1 rounded"
            >
              {{ path.matchInfo.matchedPart }}
            </span>
            <span>{{ path.matchInfo.afterMatch }}</span>
          </template>
          <span v-else>{{ path.path }}</span>
        </p>
        <p>{{ path.hits }}</p>
      </div>
      <p class="text-xs font-normal text-color-secondary mt-2">
        Orange highlights show the matched portion of each part.
      </p>
    </div>
  </div>
</template>

<script setup>
  import { toRef } from 'vue'

  const props = defineProps({
    topPaths: {
      type: Array,
      required: true
    }
  })

  const topPathsRef = toRef(props, 'topPaths')
</script>
