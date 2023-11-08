<template>
  <div>
    <PageHeadingBlock :pageTitle="pageTitle" />
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
            <span
              class="flex items-center ml-auto text-secondry text-xs font-normal leading-[21px]"
            >
              last 30 days records
            </span>
          </div>
        </template>
        <template #content>
          <div
            class="flex flex-col"
            v-if="isLoading"
          >
            <div class="animate-pulse flex space-x-4 px-6 py-3 items-center">
              <div class="bg-gray-200 rounded-full h-9 w-9"></div>
              <div class="flex py-1 flex-col">
                <div class="bg-gray-200 rounded w-52 h-3"></div>
                <div class="flex items-center">
                  <div class="bg-gray-200 rounded w-80 h-5 mt-1"></div>
                  <div class="bg-gray-200 rounded w-80 h-4 mt-1 ml-1"></div>
                </div>
              </div>
            </div>
            <div class="animate-pulse flex space-x-4 px-6 py-3 items-center">
              <div class="bg-gray-200 rounded-full h-9 w-9"></div>
              <div class="flex py-1 flex-col">
                <div class="bg-gray-200 rounded w-52 h-3"></div>
                <div class="flex items-center">
                  <div class="bg-gray-200 rounded w-80 h-5 mt-1"></div>
                  <div class="bg-gray-200 rounded w-80 h-4 mt-1 ml-1"></div>
                </div>
              </div>
            </div>
            <div class="animate-pulse flex space-x-4 px-6 py-3 items-center">
              <div class="bg-gray-200 rounded-full h-9 w-9"></div>
              <div class="flex py-1 flex-col">
                <div class="bg-gray-200 rounded w-52 h-3"></div>
                <div class="flex items-center">
                  <div class="bg-gray-200 rounded w-80 h-5 mt-1"></div>
                  <div class="bg-gray-200 rounded w-80 h-4 mt-1 ml-1"></div>
                </div>
              </div>
            </div>
            <div class="animate-pulse flex space-x-4 px-6 py-3 items-center">
              <div class="bg-gray-200 rounded-full h-9 w-9"></div>
              <div class="flex py-1 flex-col">
                <div class="bg-gray-200 rounded w-52 h-3"></div>
                <div class="flex items-center">
                  <div class="bg-gray-200 rounded w-80 h-5 mt-1"></div>
                  <div class="bg-gray-200 rounded w-80 h-4 mt-1 ml-1"></div>
                </div>
              </div>
            </div>

            <div class="animate-pulse flex space-x-4 px-6 py-3 items-center">
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
            v-if="!isLoading"
          >
            <span
              v-if="filteredEvents.length === 0"
              class="text-primary"
              >No events found</span
            >
            <Timeline
              v-if="filteredEvents"
              :value="filteredEvents"
              align="left"
              class="customized-timeline"
              :pt="{
                opposite: { class: 'hidden' }
              }"
            >
              <template #marker="slotProps">
                <span
                  class="flex w-8 h-8 align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                  :style="{ backgroundColor: slotProps.item.color }"
                >
                  <i :class="slotProps.item.icon"></i>
                </span>
              </template>
              <template #content="slotProps">
                <div class="flex flex-col">
                  <div class="text-color-secondary text-xs font-bold text-base">
                    {{ slotProps.item.date }}
                  </div>
                  <div class="flex">
                    <div class="text-color text-lg flex items-center">
                      {{ slotProps.item.event }}
                    </div>
                    <div class="text-color-secondary text-xs font-normal flex items-center ml-1">
                      by {{ slotProps.item.editor }}
                    </div>
                  </div>
                </div>
              </template>
            </Timeline>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Timeline from 'primevue/timeline'
  import Card from 'primevue/card'
  import InputText from 'primevue/inputtext'
  import * as ActivityHistoryService from '@/services/activity-history-services'

  export default {
    name: 'activity-history-view',
    components: {
      PageHeadingBlock,
      Timeline,
      Card,
      InputText
    },
    data: () => ({
      search: '',
      currentPage: 0,
      pageTitle: 'Activity History',
      isLoading: false,
      events: []
    }),
    computed: {
      filteredEvents() {
        return this.events.filter((element) =>
          element.event.toLowerCase().includes(this.search.toLowerCase())
        )
      }
    },
    async created() {
      await this.loadData()
    },
    methods: {
      async loadData() {
        try {
          this.isLoading = true
          const data = await ActivityHistoryService.listEventsService()
          const iconsMap = {
            created: 'pi pi-plus-circle',
            deleted: 'pi pi-trash',
            changed: 'pi pi-pencil'
          }
          const colorsMap = {
            created: '#188236',
            deleted: '#C4160A',
            changed: '#1E1E1E'
          }
          this.events = data.map((element) => ({
            date: element.ts,
            icon: iconsMap[element.type],
            color: colorsMap[element.type],
            event: element.title,
            editor: `${element.authorName} (${element.authorEmail})`
          }))
          this.filteredEvents = this.events
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          this.isLoading = false
        }
      }
    }
  }
</script>
