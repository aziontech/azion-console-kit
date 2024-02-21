<script setup>
  import { ref, onMounted } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'

  import Divider from 'primevue/divider'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-functions' })

  defineProps({
    loadDetails: Function
  })

  const getCurrentDate = () => {
    const date = new Date()
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleString('en-US', options)
  }

  const showDrawer = ref(true)

  const loadMockedDetails = () => {
    const mockValues = {
      drawerTitle: 'Function Language',
      date: getCurrentDate(),
      edgeFunctionsTypeList: ['3324 - Name Edge Function;', '43 - Name Edge Function'],
      edgeFunctionTime: '0.021',
      edgeFunctionsTypeListFirst: '1 - Edge Application',
      edgeFunctionsIdList: '10728',
      edgeFunctionsSolutionId: '10728',
      virtualHostId: '24100000a',
      configurationId: '15953987123',
      source: 'edg-fln-ggn001p'
    }

    return mockValues
  }

  const details = ref({})
  onMounted(() => {
    details.value = loadMockedDetails()
  })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="showDrawer"
    title="More Details"
  >
    <template #body>
      <div class="flex flex-col gap-3 md:m-3">
        <InfoSection
          :title="details.drawerTitle"
          :date="details.date"
          :tagText="`<> Javascript`"
        >
          <template #body>
            <div class="gap-8 flex flex-col sm:flex-row">
              <TextInfo label="Edge Functions Type List">
                <ul>
                  <li
                    :key="index"
                    v-for="(functionType, index) in details.edgeFunctionsTypeList"
                  >
                    {{ functionType }}
                  </li>
                </ul>
              </TextInfo>
              <BigNumber
                label="Edge Function Time"
                sufix="ms"
                >{{ details.edgeFunctionTime }}</BigNumber
              >
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3">
              <div class="flex flex-col gap-3">
                <TextInfo label="Edge Functions Type List">
                  {{ details.edgeFunctionsTypeListFirst }}
                </TextInfo>
                <TextInfo label="Edge Functions ID List">
                  {{ details.edgeFunctionsIdList }}
                </TextInfo>
                <TextInfo label="Edge Functions Solution ID">
                  {{ details.edgeFunctionsSolutionId }}
                </TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Virtual Host ID">{{ details.virtualHostId }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
