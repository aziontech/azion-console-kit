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

  const edgeFunctionsTime =
    'Total execution time, in seconds, for the function during its processing. This field is the result of a sum.'

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
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <InfoSection
          title="Function Language"
          :date="details.ts"
          :tags="tags"
        >
          <template #body>
            <div class="gap-8 flex flex-col sm:flex-row w-full">
              <TextInfo
                label="Edge Functions List"
                class="w-full sm:w-5/12 flex-1"
              >
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
                class="flex-1"
                label="Edge Functions Time"
                sufix="s"
                :tooltipMessage="edgeFunctionsTime"
                >{{ details.edgeFunctionsTime }}</BigNumber
              >
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3 flex-1">
                <TextInfo label="Edge Functions Initiator Type List">
                  {{ details.edgeFunctionsInitiatorTypeList }}
                </TextInfo>
                <TextInfo label="Edge Functions Instance ID List">
                  {{ details.edgeFunctionsInstanceIdList }}
                </TextInfo>
                <TextInfo label="Edge Functions Solution ID">
                  {{ details.edgeFunctionsSolutionId }}
                </TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
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
