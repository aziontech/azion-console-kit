<template>
  <div>
    <PageHeadingBlock :pageTitle="pageTitle" />
    <div class="flex h-full max-w-screen px-2 sm:px-8 w-full">
      <Card class="w-full">
        <template #header>
          <div class="border-b w-full p-4 flex">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText placeholder="Search..." />
            </span>
            <span
              class="flex items-center ml-auto text-stone-500 text-sm font-normal max-sm:hidden"
            >
              last 30 days records
            </span>
          </div>
        </template>
        <template #content>
          <div class="p-4">
            <Timeline
              :value="events"
              align="left"
              class="customized-timeline"
              :pt="{ opposite: { class: 'hidden' } }"
            >
              <template #marker="slotProps">
                <span
                  class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
                  :style="{ backgroundColor: slotProps.item.color }"
                >
                  <i :class="slotProps.item.icon"></i>
                </span>
              </template>
              <template #content="slotProps">
                <div class="flex flex-col">
                  <div class="text-stone-500 text-sm font-normal">
                    {{ slotProps.item.date }}
                  </div>
                  <div class="flex">
                    <div class="text-zinc-900 text-lg flex items-center">
                      {{ slotProps.item.event }}
                    </div>
                    <div class="text-stone-500 text-sm font-normal flex items-center ml-2">
                      by {{ slotProps.item.editor }}
                    </div>
                  </div>
                </div>
              </template>
            </Timeline>
          </div>
        </template>
        <template #footer>
          <div class="border-t">
            <Paginator></Paginator>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
  import { ref, onMounted } from 'vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import Timeline from 'primevue/timeline'
  import Card from 'primevue/card'
  import InputText from 'primevue/inputtext'
  import Paginator from 'primevue/paginator'
  import * as ActivityHistoryService from '@/services/activity-history-services'

  export default {
    name: 'activity-history-view',
    components: {
      PageHeadingBlock,
      Timeline,
      Card,
      InputText,
      Paginator
    },
    setup() {
      const pageTitle = 'Activity History'
      const events = ref([
        {
          status: 'Ordered',
          date: '15/10/2020 10:30',
          icon: 'pi pi-plus-circle',
          color: '#188236',
          event: 'Digital Certificate XX was added',
          editor: 'Services Azion (services@azion.com)'
        },
        {
          status: 'Processing',
          date: '15/10/2020 14:00',
          icon: 'pi pi-pencil',
          color: '#1E1E1E',
          event: 'Digital Certificate XX was edited',
          editor: 'Services Azion (services@azion.com)'
        },
        {
          status: 'Shipped',
          date: '15/10/2020 16:15',
          icon: 'pi pi-pencil',
          color: '#1E1E1E',
          event: 'Digital Certificate XX was edited',
          editor: 'Services Azion (services@azion.com)'
        },
        {
          status: 'Delivered',
          date: '16/10/2020 10:00',
          icon: 'pi pi-trash',
          color: '#C4160A',
          event: 'Digital Certificate XX was deleted',
          editor: 'Services Azion (services@azion.com)'
        }
      ])

      onMounted(async () => {
        const aux = await ActivityHistoryService.listEventsService()
        console.log(aux)
      })

      const getColumns = [
        {
          field: 'name',
          header: 'Application Name'
        },
        {
          field: 'subjectName',
          header: 'Subject Names'
        },
        {
          field: 'issuer',
          header: 'Issuer'
        },
        {
          field: 'type',
          header: 'Type'
        },
        {
          field: 'validity',
          header: 'Validity (not after)'
        },
        {
          field: 'status',
          header: 'Status'
        }
      ]

      return {
        pageTitle,
        events,
        getColumns
      }
    }
  }
</script>
