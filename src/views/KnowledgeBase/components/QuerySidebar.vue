<template>
  <Sidebar
    v-model:visible="isVisible"
    position="right"
    class="w-full md:w-[28rem]"
    :modal="true"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-comments text-xl"></i>
        <span class="font-semibold text-lg">Query Knowledge Base</span>
      </div>
    </template>

    <div class="flex flex-col h-full gap-4">
      <!-- Question Input -->
      <div class="flex flex-col gap-2">
        <label
          for="query-input"
          class="text-sm font-medium"
        >
          Ask a question
        </label>
        <Textarea
          id="query-input"
          v-model="question"
          rows="3"
          placeholder="What would you like to know about this knowledge base?"
          class="w-full"
          :disabled="isLoading"
          auto-resize
          @keydown.ctrl.enter="handleAsk"
          @keydown.meta.enter="handleAsk"
        />
        <PrimeButton
          label="Ask"
          icon="pi pi-send"
          :loading="isLoading"
          :disabled="!question.trim() || isLoading"
          @click="handleAsk"
          class="w-full"
        />
      </div>

      <!-- Answer Display -->
      <div
        v-if="answer || isLoading"
        class="flex flex-col gap-3 flex-1"
      >
        <div class="text-sm font-medium">Answer</div>
        
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="flex items-center gap-3"
        >
          <ProgressSpinner
            style="width: 24px; height: 24px"
            strokeWidth="4"
          />
          <span class="text-sm text-color-secondary">Querying knowledge base...</span>
        </div>

        <!-- Answer Content -->
        <div
          v-else-if="answer"
          class="flex flex-col gap-3"
        >
          <div class="p-4 surface-100 rounded-md text-sm whitespace-pre-wrap">
            {{ answer }}
          </div>

          <!-- Context Sources (Optional) -->
          <div
            v-if="contexts && contexts.length > 0"
            class="flex flex-col gap-2"
          >
            <Accordion>
              <AccordionTab header="View Sources">
                <div class="flex flex-col gap-3">
                  <div
                    v-for="(context, index) in contexts"
                    :key="context.chunk_id"
                    class="flex flex-col gap-2 pb-3 border-b surface-border last:border-b-0"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">{{ context.title || `Source ${index + 1}` }}</span>
                      <PrimeTag
                        v-if="context.similarity !== null"
                        :value="`${Math.round(context.similarity * 100)}%`"
                        severity="info"
                        size="small"
                      />
                    </div>
                    <div class="text-xs text-color-secondary line-clamp-2">
                      {{ context.content }}
                    </div>
                  </div>
                </div>
              </AccordionTab>
            </Accordion>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="p-4 surface-100 rounded-md text-sm text-red-500"
        >
          {{ error }}
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-col items-center justify-center flex-1 text-center gap-3"
      >
        <i class="pi pi-question-circle text-4xl text-color-secondary"></i>
        <p class="text-sm text-color-secondary">
          Ask a question to query your knowledge base documents
        </p>
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
  import Sidebar from 'primevue/sidebar'
  import Textarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import ProgressSpinner from 'primevue/progressspinner'
  import { ref, computed, watch } from 'vue'
  import { knowledgeBaseService } from '@/services/v2/knowledge-base/knowledge-base-service'

  defineOptions({
    name: 'query-sidebar'
  })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    kbId: {
      type: [String, Number],
      required: true
    }
  })

  const emit = defineEmits(['update:visible'])

  const question = ref('')
  const answer = ref('')
  const contexts = ref([])
  const isLoading = ref(false)
  const error = ref('')

  const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const handleAsk = async () => {
    if (!question.value.trim() || isLoading.value) return

    isLoading.value = true
    error.value = ''
    answer.value = ''
    contexts.value = []

    try {
      const response = await knowledgeBaseService.askKnowledgeBase(
        props.kbId,
        question.value,
        5
      )

      answer.value = response.answer || 'No answer available.'
      contexts.value = response.context || []
    } catch (err) {
      error.value = 'Failed to query knowledge base. Please try again.'
    } finally {
      isLoading.value = false
    }
  }

  // Reset state when sidebar is closed
  watch(
    () => props.visible,
    (newValue) => {
      if (!newValue) {
        // Clear after a delay to avoid flashing content
        setTimeout(() => {
          question.value = ''
          answer.value = ''
          contexts.value = []
          error.value = ''
        }, 300)
      }
    }
  )
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>

