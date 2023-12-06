<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Deploy" />
    </template>
    <template #content>
      <div class="flex flex-col w-full gap-8">
        <PrimeCard class="w-full">
          <template #content>
            <div class="flex flex-col p-8 gap-8">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                  <div class="flex gap-3">
                    <Tag
                      v-if="results"
                      :icon="iconType"
                      :severity="severity"
                      :pt="{ icon: { class: 'mr-0' }, root: { class: 'w-8 h-8' } }"
                    />
                    <span
                      class="text-primary text-xl font-medium"
                      v-if="!results"
                    >
                      Project is being deployed
                    </span>
                    <span
                      class="text-primary text-xl font-medium"
                      v-else-if="results && !results.error"
                    >
                      {{ results.edge_application.name }}
                    </span>
                    <span
                      class="text-primary text-xl font-medium"
                      v-else
                    >
                      Deploy failed
                    </span>
                  </div>
                  <PrimeButton
                    v-if="results && !results.error"
                    link
                    :pt="{
                      label: { class: 'text-xs' },
                      icon: { class: 'text-xs' }
                    }"
                    class="px-0 py-1"
                    :label="results.domain.url"
                    @click="openUrl"
                    icon="pi pi-external-link"
                    iconPos="right"
                  />
                  <PrimeButton
                    v-if="results && !results.error"
                    class="sm:ml-auto"
                    outlined
                    @click="manage"
                    label="Manage"
                  />
                </div>
                <span
                  class="text-sm font-normal text-color-secondary"
                  v-if="!results"
                >
                  Project started {{ seconds }}s ago
                </span>
              </div>
              <ScriptRunnerBlcok
                title="Deploy Log"
                :getLogsService="props.getLogsService"
                :executionId="executionId"
                @onFinish="handleFinish"
              />
            </div>
          </template>
        </PrimeCard>
        <div class="w-full flex flex-col gap-5" v-if="results && !results.error">
          <Divider align="left" type="dashed">
              <b>Next Steps</b>
          </Divider>
          <div class="ml-0 w-full mt-0 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <PrimeButton
              class="p-4 text-left border-solid border surface-border hover:border-primary transition-all"
              link
              type="button"
              @click="customizeDomain"
            >
              <div class="flex flex-col h-36 justify-between gap-3.5 items-start">
                <div class="flex gap-3.5 flex-col">
                  <div class="flex p-0.5 flex-col">
                    <span class="text-color text-base font-medium">
                      Customize Domain
                    </span>
                    <span class="pb-4 text-base text-color-secondary mt-1.5 line-clamp-2">
                      Manage your Domain settings
                    </span>
                  </div>
                </div>
              </div>
            </PrimeButton>
            <PrimeButton
              class="p-4 text-left border-solid border surface-border hover:border-primary transition-all"
              link
              type="button"
              @click="pointTraffic"
            >
              <div class="flex flex-col h-36 justify-between gap-3.5 items-start">
                <div class="flex gap-3.5 flex-col">
                  <div class="flex p-0.5 flex-col">
                    <span class="text-color text-base font-medium">
                      Point Traffic
                    </span>
                    <span class=" pb-4 text-base text-color-secondary mt-1.5 line-clamp-2">
                      See Point Traffic docs
                    </span>
                  </div>
                </div>
              </div>
            </PrimeButton>
            <PrimeButton
              class="p-4 text-left border-solid border surface-border hover:border-primary transition-all"
              link
              type="button"
            >
              <div class="flex flex-col h-36 justify-between gap-3.5 items-start">
                <div class="flex gap-3.5 flex-col">
                  <div class="flex p-0.5 flex-col">
                    <span class="text-color text-base font-medium">
                      View Analytics
                    </span>
                    <span class="pb-4 text-base text-color-secondary mt-1.5 line-clamp-2">
                      Gain powerful insights into your performance, availability, and security.
                    </span>
                  </div>
                </div>
              </div>
            </PrimeButton>
          </div>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import Tag from 'primevue/tag'
  import Divider from 'primevue/divider'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import ScriptRunnerBlcok from '@/templates/script-runner-block'
  import PrimeCard from 'primevue/card'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    getLogsService: {
      type: Function,
      required: true
    },
    getResultsService: {
      type: Function,
      required: true
    }
  })

  const executionId = ref('')
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const results = ref()
  const seconds = ref(0)

  const handleFinish = async () => {
    const response = await props.getResultsService(route.params.id)
    results.value = response.result
    if (!results.value.error) {
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Created successfully',
        detail: 'The project was deployed successfully'
      })
    } else {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Deploy failed',
        detail: results.value.message
      })
    }
  }

  const iconType = computed(() => {
    return !results.value.error? 'pi pi-check text-xs':'pi pi-times text-xs'
  })

  const pointTraffic = () => {
    window.open('https://www.azion.com/en/documentation/products/guides/point-domain-to-azion/', '_blank')
  }

  const openUrl = () => {
    window.open(results.value.domain.url, '_blank')
  }

  const manage = () => {
    router.push(`/edge-applications/edit/${results.value.edge_application.id}`)
  }

  const customizeDomain = () => {
    router.push(`/domains/edit/${results.value.domain.id}`)
  }

 

  const severity = computed(() => {
    return !results.value.error? 'success' : 'danger'
  })

  onMounted(() => {
    setInterval(()=>{
      seconds.value += 1
    }, 1000);
    executionId.value = route.params.id
  })
</script>
