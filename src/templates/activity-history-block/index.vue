<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex h-full max-w-screen pt-4 pb-8 px-8 max-md:p-3 w-full">
    <Card class="w-full mb-10">
      <template #header>
        <div class="border-b surface-border w-full p-3.5 flex">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              placeholder="Search..."
              v-model="search"
            />
          </span>
          <span class="flex items-center ml-auto text-sm font-normal leading-5">
            last 30 days records
          </span>
        </div>
      </template>
      <template #content>
        <div
          v-if="isLoading"
          class="flex flex-col"
        >
          <div
            v-for="skeletonItem in 10"
            :key="skeletonItem"
            class="animate-pulse flex space-x-4 px-6 py-3 items-center"
          >
            <div class="bg-gray-200 rounded-full h-9 w-9"></div>
            <div class="flex py-1 flex-col">
              <div class="bg-gray-200 rounded w-52 h-3"></div>
              <div class="flex items-center">
                <div class="bg-gray-200 rounded w-80 h-5 mt-1"></div>
                <div class="bg-gray-200 rounded w-80 h-4 mt-1 ml-1"></div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="p-6"
          v-else
        >
          <span
            v-if="noEventsFound"
            class="text-primary"
            >No events found</span
          >
          <Timeline
            v-else
            :value="filteredEvents"
            align="left"
            class="customized-timeline"
            :pt="{
              opposite: { class: 'hidden' }
            }"
          >
            <template #marker="{ item }">
              <Tag
                :severity="severityByType[item.type]"
                :icon="item.icon"
                :pt="{
                  root: { class: 'p-2.5 h-8 rounded-full' },
                  icon: { class: 'mr-0' }
                }"
              />
            </template>
            <template #content="{ item }">
              <div class="flex flex-col">
                <div class="text-color-secondary text-xs font-bold">
                  {{ item.date }}
                </div>
                <div class="flex items-baseline max-md:flex-col">
                  <div class="text-color text-lg flex">
                    {{ item.event }}
                  </div>
                  <div class="text-color-secondary text-xs font-normal flex ml-1 max-md:mb-4">
                    by {{ item.editor }}
                  </div>
                </div>
              </div>
            </template>
          </Timeline>
        </div>
      </template>
    </Card>
  </div>
</template>
<script setup>
  import Timeline from 'primevue/timeline'
  import Card from 'primevue/card'
  import Tag from 'primevue/tag'
  import InputText from 'primevue/inputtext'
  import { ref, computed, onMounted } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()
  const search = ref('')
  const isLoading = ref(false)
  const events = ref([])

  const iconsMap = ref({
    created: 'pi pi-plus-circle text-xs',
    deleted: 'pi pi-trash text-xs',
    changed: 'pi pi-pencil text-xs'
  })
  const severityByType = ref({
    created: 'success',
    deleted: 'danger',
    changed: 'info'
  })

  const props = defineProps({
    listEventsService: {
      type: Function,
      required: true
    }
  })
  const filteredEvents = computed(() => {
    return events.value.filter((element) =>
      element.event.toLowerCase().includes(search.value.toLowerCase())
    )
  })
  const noEventsFound = computed(() => {
    return filteredEvents.value.length === 0
  })

  async function loadData() {
    try {
      isLoading.value = true
      const data = await props.listEventsService()
      events.value = data.map((historyEvent) => ({
        date: historyEvent.ts,
        icon: iconsMap.value[historyEvent.type],
        event: historyEvent.title,
        editor: `${historyEvent.authorName} (${historyEvent.authorEmail})`,
        type: historyEvent.type
      }))
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error,
        life: 10000
      })
    } finally {
      isLoading.value = false
    }
  }

  onMounted(async () => {
    await loadData()
  })
</script>
