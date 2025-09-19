<template>
  <div class="fixed bottom-6 left-6 z-50">
    <!-- Toggle Button -->
    <Button
      :icon="isVisible ? 'pi pi-times' : 'pi pi-check-square'"
      @click="isVisible = !isVisible"
      label="My tasks"
      severity="secondary"
    />

    <!-- Custom Popup -->
    <transition name="fade">
      <div
        v-if="isVisible"
        class="surface-card border-round-md overflow-hidden w-30rem border surface-border"
        style="position: fixed; bottom: 4.25rem; left: 1.5rem; z-index: 1100"
      >
        <div class="surface-section p-4 border-bottom-1 surface-border">
          <div class="flex justify-content-between align-items-center mb-3">
            <h3 class="text-xl font-medium text-color m-0">Teste de Usabilidade</h3>
          </div>
        </div>

        <div
          class="p-0 overflow-y-auto"
          style="max-height: 60vh"
        >
          <div
            v-for="task in tasks"
            :key="task.id"
            class="p-3 border-bottom-1 surface-border flex align-items-center justify-content-between"
            :class="{ 'bg-green-500/10 dark:bg-green-900/20': task.completed }"
          >
            <div class="flex align-items-center gap-3">
              <i
                class="pi text-xl"
                :class="{
                  'pi-check-circle text-green-500': task.completed,
                  'pi-circle text-color-secondary': !task.completed
                }"
              />
              <div>
                <p class="text-color font-medium m-0">{{ task.description }}</p>
                <span class="text-color-secondary text-sm">{{ task.category }}</span>
              </div>
            </div>
            <span
              v-if="task.completed"
              class="inline-flex align-items-center px-2 py-1 border-round-md text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
            >
              <i class="pi pi-check mr-1 text-xs"></i>
              Concluído
            </span>
          </div>
        </div>

        <div class="p-4">
          <div class="flex justify-content-between align-items-center mb-3">
            <span class="text-color-secondary text-xs">
              {{ completedTasks }}/{{ tasks.length }} tarefas concluídas
            </span>
            <div class="flex align-items-center gap-2">
              <Button
                v-if="allTasksCompleted && !hasCompletedSurvey"
                icon="pi pi-star"
                label="Avaliar"
                size="small"
                @click="showSurvey = true"
                severity="secondary"
              />
              <Button
                icon="pi pi-replay"
                size="small"
                text
                iconOnly
                @click="resetTest"
                v-tooltip.top="'Reiniciar Teste'"
              />
            </div>
          </div>

          <ProgressBar
            :value="completionPercentage"
            class="text-xs h-[0.75rem] mb-3"
            :pt="{
              value: {
                class: 'bg-green-500 !important'
              }
            }"
          />
        </div>
      </div>
    </transition>

    <!-- Survey Dialog -->
    <Dialog
      v-model:visible="showSurvey"
      :modal="true"
      :closable="false"
      :style="{ width: '450px' }"
      header="Avaliação de Usabilidade"
    >
      <div class="flex flex-column gap-4">
        <p class="text-color">{{ tasksData.survey_question }}</p>

        <div class="text-center">
          <Rating
            v-model="surveyRating"
            :cancel="false"
            class="mb-2"
            :pt="{
              onIcon: { class: 'text-yellow-400' },
              offIcon: { class: 'text-color-secondary' }
            }"
          />
          <div class="flex justify-content-between text-color-secondary text-sm">
            <span>Não gostei</span>
            <span>Muito bom</span>
          </div>
        </div>

        <div class="flex flex-column gap-2">
          <label
            for="feedback"
            class="text-color font-medium"
          >
            Algum comentário ou sugestão?
          </label>
          <Textarea
            id="feedback"
            v-model="surveyFeedback"
            rows="3"
            class="w-full"
            :pt="{
              root: { class: 'w-full' },
              input: { class: 'w-full' }
            }"
            placeholder="Sua opinião é muito importante para nós..."
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <!-- <Button 
            label="Pular" 
            @click="skipSurvey"
            text 
            class="p-button-text"
            :disabled="isSubmitting"
          /> -->
          <Button
            label="Enviar"
            @click="submitSurvey"
            :disabled="!surveyRating || isSubmitting"
            :loading="isSubmitting"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import Button from 'primevue/button'
  import Dialog from 'primevue/dialog'
  import ProgressBar from 'primevue/progressbar'
  import tasksData from '@/assets/data/usability-tasks.json'
  import Rating from 'primevue/rating'
  import Textarea from 'primevue/textarea'

  // Local storage is accessed directly via localStorage API

  // Initialize PrimeVue and other utilities
  const route = useRoute()
  const toast = useToast()

  // State
  const isVisible = ref(false)
  const showSurvey = ref(false)
  const surveyRating = ref(null)
  const surveyFeedback = ref('')
  const isSubmitting = ref(false)
  const hasCompletedSurvey = ref(false)
  const tasks = ref([])

  // Function to load tasks from JSON
  const loadTasks = () => {
    try {
      if (!tasksData || !tasksData.tasks) {
        return
      }

      // Create a deep copy of the tasks
      const loadedTasks = JSON.parse(JSON.stringify(tasksData.tasks))

      if (!Array.isArray(loadedTasks)) {
        return
      }

      // Update tasks with a new array to ensure reactivity
      tasks.value = loadedTasks
    } catch (error) {
      // Handle error silently in production
    }
  }

  // Watch for changes in the tasks data
  watch(
    () => tasksData,
    () => {
      loadTasks()
    },
    { deep: true }
  )

  // Computed properties
  const completedTasks = computed(() => tasks.value.filter((task) => task.completed).length)
  const allTasksCompleted = computed(() => completedTasks.value === tasks.value.length)
  const completionPercentage = computed(() => {
    return tasks.value.length ? Math.round((completedTasks.value / tasks.value.length) * 100) : 0
  })

  // Reset the test to initial state
  const resetTest = () => {
    // Reset all tasks to not completed
    tasks.value = tasks.value.map((task) => ({
      ...task,
      completed: false
    }))

    // Reset survey state
    surveyRating.value = null
    surveyFeedback.value = ''
    hasCompletedSurvey.value = false

    // Clear saved progress from localStorage
    localStorage.removeItem('usabilityTestProgress')
    localStorage.removeItem('usabilitySurveyResponse')
    localStorage.removeItem('usabilitySurveySkipped')

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'O teste de usabilidade foi reiniciado com sucesso!',
      life: 3000
    })
  }

  const saveProgress = () => {
    try {
      const progress = {
        tasks: tasks.value,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('usabilityProgress', JSON.stringify(progress))
    } catch (error) {
      // Handle error silently in production
    }
  }

  const loadProgress = () => {
    try {
      const savedProgress = localStorage.getItem('usabilityProgress')
      if (savedProgress) {
        const progress = JSON.parse(savedProgress)

        // Create a map of saved tasks by ID for quick lookup
        const savedTasksMap = new Map(progress.tasks.map((task) => [task.id, task]))

        // Update tasks with saved progress
        tasks.value = tasks.value.map((task) => {
          const savedTask = savedTasksMap.get(task.id)
          return savedTask ? { ...task, completed: savedTask.completed } : task
        })
      }
    } catch (error) {
      // Handle error silently in production
    }
  }

  const submitSurvey = async () => {
    if (!surveyRating.value) return

    isSubmitting.value = true

    try {
      const response = {
        rating: surveyRating.value,
        feedback: surveyFeedback.value,
        timestamp: new Date().toISOString()
      }

      localStorage.setItem('usabilitySurveyResponse', JSON.stringify(response))
      hasCompletedSurvey.value = true
      showSurvey.value = false

      toast.add({
        severity: 'success',
        summary: 'Obrigado!',
        detail: 'Sua avaliação foi enviada com sucesso!',
        life: 3000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível enviar sua avaliação. Tente novamente mais tarde.',
        life: 3000
      })
    } finally {
      isSubmitting.value = false
    }
  }

  // Mark task as completed based on route or API call
  const markTaskAsCompleted = (taskId) => {
    // Find the task by ID
    const taskIndex = tasks.value.findIndex((task) => task.id === taskId)

    if (taskIndex === -1) {
      return
    }

    const task = tasks.value[taskIndex]

    // If already completed, no need to do anything
    if (task.completed) {
      return
    }

    // Create a new array to ensure reactivity
    const updatedTasks = [...tasks.value]
    updatedTasks[taskIndex] = { ...task, completed: true }
    tasks.value = updatedTasks

    // Save progress
    saveProgress()

    // Check if all tasks are completed
    if (allTasksCompleted.value) {
      // Show survey if not already shown or completed
      const hasResponded = localStorage.getItem('usabilitySurveyResponse')
      const hasSkipped = localStorage.getItem('usabilitySurveySkipped')

      if (!hasResponded && !hasSkipped) {
        showSurvey.value = true
      }
    }
  }

  let originalToastAdd

  const checkToast = (toastMessage) => {
    try {
      const message = toastMessage.detail || toastMessage.feedback
      if (!message) return

      tasks.value.forEach((task) => {
        if (task.completed || task.type !== 'toast') return

        const trigger = task.trigger
        if (!trigger) return

        if (message.includes(trigger)) {
          markTaskAsCompleted(task.id)
        }
      })
    } catch (error) {
      // Handle error silently in production
    }
  }

  // Lifecycle hooks
  onMounted(async () => {
    originalToastAdd = toast.add
    toast.add = (message) => {
      checkToast(message)
      originalToastAdd(message)
    }



    try {
      // Initial load of tasks
      loadTasks()

      // Load saved progress
      loadProgress()

      // Check if survey was already completed or skipped
      const surveyResponse = localStorage.getItem('usabilitySurveyResponse')
      const surveySkipped = localStorage.getItem('usabilitySurveySkipped')
      hasCompletedSurvey.value = !!surveyResponse || !!surveySkipped

      // Check current route after a small delay to ensure route is fully resolved
      setTimeout(() => {
        checkCurrentRoute()
      }, 100)
    } catch (error) {
      // Handle error silently in production
    }
  })

  // Check current route and mark tasks as completed if needed
  const checkCurrentRoute = () => {
    try {
      const currentPath = route.fullPath
      const currentMethod = 'GET' // Default to GET since we're checking route changes

      // Check each task to see if it should be marked as completed
      tasks.value.forEach((task) => {
        if (task.completed) {
          return
        }

        const trigger = task.trigger
        if (!trigger) {
          return
        }

        // Check if trigger is a string (URL) or an object with url and method
        const triggerUrl = typeof trigger === 'string' ? trigger : trigger.url
        const triggerMethod =
          typeof trigger === 'object' && trigger.method ? trigger.method.toUpperCase() : 'GET'

        if (!triggerUrl) {
          return
        }

        // Normalize URLs for comparison
        const normalizeUrl = (url) => {
          // Remove trailing slashes and query strings for comparison
          return url.replace(/\/$/, '').split('?')[0]
        }

        const currentNormalized = normalizeUrl(currentPath)
        const triggerNormalized = normalizeUrl(triggerUrl)

        // Check if the current path matches the trigger URL and method
        if (currentNormalized.endsWith(triggerNormalized) && triggerMethod === currentMethod) {
          markTaskAsCompleted(task.id)
        }
      })
    } catch (error) {
      // Handle error silently in production
    }
  }

  // Watch for route changes to mark tasks as completed
  watch(
    () => route.fullPath,
    () => {
      // Add a small delay to ensure the route is fully updated
      // and any reactive components have updated
      setTimeout(() => {
        checkCurrentRoute()
      }, 50)
    },
    {
      immediate: true, // Run immediately on component mount
      flush: 'post' // Ensure the route is fully updated before checking
    }
  )

  onUnmounted(() => {
    toast.add = originalToastAdd
  })
</script>
