<script setup>
  import { ref, watch, computed } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'

  import Divider from 'primevue/divider'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-functions' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })
  const details = ref({})
  const showDrawer = ref(false)

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    details.value = await props.loadService(item)
  }

  watch(
    () => showDrawer.value,
    (value) => {
      if (!value) {
        details.value = {}
      }
    }
  )

  const tags = computed(() => {
    if (details.value.functionLanguage) {
      return [
        {
          icon: 'pi pi-code',
          text: details.value.functionLanguage
        }
      ]
    }
    return []
  })

  defineExpose({
    openDetailDrawer
  })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="showDrawer"
    title="More Details"
  >
    <template #body>
      <div class="flex flex-col gap-6 sm:gap-8 md:m-3">
        <InfoSection
          title="Function Language"
          :date="details.ts"
          :tags="tags"
        >
          <template #body>
            <div class="gap-8 flex flex-col sm:flex-row">
              <TextInfo label="Edge Functions Type List">
                <ul>
                  <li
                    :key="index"
                    v-for="(functionType, index) in details.edgeFunctionsList"
                  >
                    {{ functionType }}
                  </li>
                </ul>
              </TextInfo>
              <BigNumber
                label="Edge Function Time"
                sufix="ms"
                >{{ details.edgeFunctionsTime }}</BigNumber
              >
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3">
              <div class="flex flex-col gap-3">
                <TextInfo label="Edge Functions Type List">
                  {{ details.edgeFunctionsInitiatorTypeList }}
                </TextInfo>
                <TextInfo label="Edge Functions Instance ID List">
                  {{ details.edgeFunctionsInstanceIdList }}
                </TextInfo>
                <TextInfo label="Edge Functions Solution ID">
                  {{ details.edgeFunctionsSolutionId }}
                </TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Virtual Host ID">{{ details.virtualHostId }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
