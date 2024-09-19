<template>
  <div class="px-4">
    <ContentBlock data-testid="view-azion-compare">
      <template #heading>
        <PageHeadingBlock
          pageTitle=""
          data-testid="view-azion-compare-heading"
        />
      </template>

      <template #content>
        <Message
          v-if="generalError"
          severity="error"
          :closable="false"
        >
          {{ generalError }}
        </Message>

        <div v-if="!generalError" class="grid md:grid-cols-2 gap-10">
          <div>
            <Message
              v-if="errorData"
              severity="error"
              :closable="false"
            >
              {{ errorData }}
            </Message>

            <div v-if="!errorData">
              <h2 class="text-3xl">
                Current Performance
              </h2>

              <div class="mt-12 ">
                <h3 class="text-xl mb-8">General</h3>
                <ResumeBlock :data="resumeData" />
              </div>
              
              <div class="mt-12">
                <h3 class="text-xl mb-8">Page Performance</h3>
                <GradeBlock :items="gradeData" />
              </div>

              <div class="mt-12">
                <h3 class="text-xl mb-8">
                  Security
                </h3>
                <SecurityBlock :securityHeaders="secureData"/>
              </div>
            </div> 
          </div>
          
          <div>
            <Message
              v-if="errorDataWithAzion"
              severity="error"
              :closable="false"
            >
              {{ errorDataWithAzion }}
            </Message>
            
            <div v-if="!errorDataWithAzion">
              <h2 class="text-3xl">
                Performance <span style="color: #F3652B">with Azion</span>
              </h2> 

              <div class="mt-12">
                <h3 class="text-xl mb-8">General</h3>
                <ResumeBlock :data="resumeDataWithAzion" />
              </div>
  
              <div class="mt-12">
                <h3 class="text-xl mb-8">Page Performance</h3>
                <GradeBlock :items="gradeDataWithAzion" />
              </div>
  
              <div class="mt-12">
                <h3 class="text-xl mb-8">
                  Security
                </h3>
                <SecurityBlock :securityHeaders="secureDataWithAzion" />
              </div>
            </div>
          </div>
        </div>

        <JourneyBlock class="mt-12"/>
      </template>
    </ContentBlock>
  </div>
</template>

<script setup>
  import { onBeforeMount, ref } from 'vue';
  import Message from 'primevue/message'

  import PageHeadingBlock from '@/templates/page-heading-block'
  import ContentBlock from '@/templates/content-block'

  import GradeBlock from './blocks/grade-block.vue'
  import SecurityBlock from './blocks/security-block.vue'
  import JourneyBlock from './blocks/journey-block.vue'
  import ResumeBlock from './blocks/resume-block.vue'
  
  import { extract } from './utils/result-extract'
  import { convertMsToSeconds } from './utils/convert-ms-sec'
  import { formatBytesToKB } from './utils/format-bytes-to-kb'
  import { resultparse } from './utils/result-data-parse'

  import { useAccountStore } from '@/stores/account'
  const accountStore = useAccountStore()
  const { client_id } = accountStore.account

  const props = defineProps({
    testConsolidationService: {
      type: Function,
      required: true
    },
    getTestById: {
      type: Function,
      required: true
    },
    getAllTestsByClientId: {
      type: Function,
      required: true
    },
    getResult: {
      type: Function,
      required: true
    },
    getResultFromWebpagetest: {
      type: Function,
      required: true
    }
  })

  const generalError = ref('')
  // Origin Test
  const errorData = ref('')
  const resumeData = ref({})
  const gradeData = ref([])
  const secureData = ref({})
  // Origin Test With Azion
  const errorDataWithAzion = ref('')
  const resumeDataWithAzion = ref({})
  const gradeDataWithAzion = ref([])
  const secureDataWithAzion = ref({})

  const getResultFromWebpagetest = async id => await props.getResultFromWebpagetest(id);
  const getQueryString = name => new URLSearchParams(window.location.search).get(name)

  const parseGradeData = obj => {
    return [
      {
        label: 'Time to First Byte',
        measure: 's',
        value: convertMsToSeconds(obj.ttfb)
      },
      {
        label: 'Start Render',
        measure: 's',
        value: convertMsToSeconds(obj.render)
      },
      {
        label: 'First Contentful Pain',
        measure: 's',
        value:  convertMsToSeconds(obj.chromeUserTiming.firstContentfulPaint)
      },
      {
        label: 'Speed Index',
        measure: 's',
        value: convertMsToSeconds(obj.speedIndex)
      },
      {
        label: 'Largest Contentful Pain',
        measure: 's',
        value: convertMsToSeconds(obj.chromeUserTiming.largestContentfulPaint)
      },
      {
        label: 'Cumulative Layout Shift',
        measure: 's',
        value: convertMsToSeconds(obj.chromeUserTiming.cumulativeLayoutShift)
      },
      {
        label: 'Total Block Time',
        measure: 's',
        value: convertMsToSeconds(obj.totalBlockingTime)
      },
      {
        label: 'Page Weight',
        measure: 'KB',
        value: formatBytesToKB(obj.bytesIn)
      }
    ]
  }

  const parseSecureData = data => {
    return {
      protocol: data.requests[0].securityDetails.protocol,
      tls_verion: data.requests[0].securityDetails.tls_version,
      list: data.securityHeaders.securityHeadersList || [],
      grade: data.securityHeaders.securityHeadersGrade || '',
      score: data.securityHeaders.securityHeadersScore || ''
    }
  }
  
  onBeforeMount(async () => {
    const testId = getQueryString('id')
    
    await props.testConsolidationService({
      testId: testId,
      clientId: client_id
    });
  
    const testById = await props.getTestById(testId, client_id)

    if (!testById.body.length) {
      generalError.value = 'Unavailable comparative tests.'
      return;
    }

    getResultFromWebpagetest(testById.body[0].id)
    .then(result => {
      if(result.body.statusCode !== 200) {
        errorData.value = `Test ${result.body.data.id} is ${result.body.statusText}`
        return;
      }

      const medianFirstView = extract.medianRepeatView(result.body)
      resumeData.value = resultparse.grade(result.body)
      gradeData.value = parseGradeData(medianFirstView)
      secureData.value = parseSecureData(medianFirstView)
    })
    .catch(() => {
      errorData.value = 'Not possible to load the Origin test.'
    })

    getResultFromWebpagetest(testById.body[0].id_azion)
    .then(resutWithAzion => {
      if(resutWithAzion.body.statusCode !== 200) {
        errorDataWithAzion.value = `Test ${resutWithAzion.body.data.id} is ${resutWithAzion.body.statusText}`
        return;
      }

      const medianRepeatedViewWithAzion = extract.medianRepeatView(resutWithAzion.body)
      resumeDataWithAzion.value = resultparse.grade(resutWithAzion.body)
      gradeDataWithAzion.value = parseGradeData(medianRepeatedViewWithAzion) 
      secureDataWithAzion.value = parseSecureData(medianRepeatedViewWithAzion)
    })
    .catch(() => {
      errorDataWithAzion.value = 'Not possible to load the test with Azion.'
    })
  })
</script>