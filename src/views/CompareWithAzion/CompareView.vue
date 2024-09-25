<template>
  <div class="px-4">
    <ContentBlock data-testid="view-compare-with-azion-test">
      <template #heading>
        <PageHeadingBlock data-testid="view-compare-with-azion-test-heading" />
      </template>

      <template #content>
        <div
          class="w-fit"
          v-if="hasGeneralErrorMessage()"
        >
          <RetryMessage
            :timer="45"
            :data="generalError"
            @onRetry="() => {
              resetGeneralErrorMessage()
              init()
            }"
          />
        </div>
        <div v-else class="grid md:grid-cols-2 gap-10">
          <div>
            <div v-if="errorData">
              <Message
                severity="error"
                :closable="false"
              >
                {{ errorData }}
              </Message>
            </div>
            <div v-else>
              <DataBlock
                title="Current Performance"
                :resumeData="resumeData"
                :gradeData="gradeData"
                :secureData="secureData"
              />
            </div>
          </div>

          <div>
            <div v-if="errorDataWithAzion">
              <Message
                severity="error"
                :closable="false"
              >
                {{ errorDataWithAzion }}
              </Message>
            </div>
            <div v-else>
              <DataBlock
                title="Performance <span style='color: #f3652b'>with Azion</span>"
                :resumeData="resumeDataWithAzion"
                :gradeData="gradeDataWithAzion"
                :secureData="secureDataWithAzion"
              />
            </div>
          </div>
        </div>

        <JourneyBlock class="mt-12" />
      </template>
    </ContentBlock>
  </div>
</template>

<script setup>
  import { onMounted, onBeforeMount, ref } from 'vue'
  import Message from 'primevue/message'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ContentBlock from '@/templates/content-block'
  import RetryMessage from './blocks/retry-message.vue'
  import DataBlock from './blocks/data-block.vue'
  import JourneyBlock from './blocks/journey-block.vue'
  import { extract } from './utils/result-extract'
  import { convertMsToSeconds } from './utils/convert-ms-sec'
  import { formatBytesToKB } from './utils/format-bytes-to-kb'
  import { resultparse } from './utils/result-data-parse'
  import { useAccountStore } from '@/stores/account'

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

  const accountStore = useAccountStore()
  const { client_id } = accountStore.account
  const generalError = ref({})
  const errorData = ref('')
  const resumeData = ref({})
  const gradeData = ref([])
  const secureData = ref({})
  const errorDataWithAzion = ref('')
  const resumeDataWithAzion = ref({})
  const gradeDataWithAzion = ref([])
  const secureDataWithAzion = ref({})

  const getResultFromWebpagetest = async (id) => await props.getResultFromWebpagetest(id)
  const getQueryString = (name) => new URLSearchParams(window.location.search).get(name)

  const parseGradeData = (metrics) => {
    return [
      {
        label: 'Time to First Byte',
        measure: 's',
        value: convertMsToSeconds(metrics.ttfb)
      },
      {
        label: 'Start Render',
        measure: 's',
        value: convertMsToSeconds(metrics.render)
      },
      {
        label: 'First Contentful Pain',
        measure: 's',
        value: convertMsToSeconds(metrics.chromeUserTiming.firstContentfulPaint)
      },
      {
        label: 'Speed Index',
        measure: 's',
        value: convertMsToSeconds(metrics.speedIndex)
      },
      {
        label: 'Largest Contentful Pain',
        measure: 's',
        value: convertMsToSeconds(metrics.chromeUserTiming.largestContentfulPaint)
      },
      {
        label: 'Cumulative Layout Shift',
        measure: 's',
        value: convertMsToSeconds(metrics.chromeUserTiming.cumulativeLayoutShift)
      },
      {
        label: 'Total Block Time',
        measure: 's',
        value: convertMsToSeconds(metrics.totalBlockingTime)
      },
      {
        label: 'Page Weight',
        measure: 'KB',
        value: formatBytesToKB(metrics.bytesIn)
      }
    ]
  }

  const parseSecureData = (testResult) => {
    return {
      protocol: testResult.requests[0].securityDetails.protocol,
      tls_verion: testResult.requests[0].securityDetails.tls_version,
      list: testResult.securityHeaders.securityHeadersList || [],
      grade: testResult.securityHeaders.securityHeadersGrade || '',
      score: testResult.securityHeaders.securityHeadersScore || ''
    }
  }

  const resetGeneralErrorMessage = () => {
    return generalError.value = {}
  }

  const setGeneralErrorMessage = (message, retry) => {
    return generalError.value = {
      message: message,
      retry: retry
    }
  }

  const hasGeneralErrorMessage = () => {
    return Object.keys(generalError.value).length
  } 

  const setTestErrorMessage = (message) => {
    return errorData.value = message
  }

  const setTestWithAzionErrorMessage = (message) => {
    return errorDataWithAzion.value = message
  }

  const init = async () => {
    const testId = getQueryString('id')
    const testById = await props.getTestById(testId, client_id)
    
    if (!testById.body.length) {
      setGeneralErrorMessage(
        'Unavailable comparative tests. 1. Propagating data; 2. Invalid id;',
        true
      )
      return
    }

    getResultFromWebpagetest(testById.body[0].id)
      .then((result) => {
        if (result.body.statusCode !== 200) {
          setTestErrorMessage(`Test ${result.body.data.id} is ${result.body.statusText}`)
          return
        }

        const medianFirstView = extract.medianRepeatView(result.body)
        resumeData.value = resultparse.grade(result.body)
        gradeData.value = parseGradeData(medianFirstView)
        secureData.value = parseSecureData(medianFirstView)
      })
      .catch(() => {
        setTestErrorMessage('Not possible to load the Origin test.')
      })

    getResultFromWebpagetest(testById.body[0].id_azion)
      .then((resutWithAzion) => {
        if (resutWithAzion.body.statusCode !== 200) {
          setTestWithAzionErrorMessage(`Test ${resutWithAzion.body.data.id} is ${resutWithAzion.body.statusText}`)
          return
        }

        const medianRepeatedViewWithAzion = extract.medianRepeatView(resutWithAzion.body)
        resumeDataWithAzion.value = resultparse.grade(resutWithAzion.body)
        gradeDataWithAzion.value = parseGradeData(medianRepeatedViewWithAzion)
        secureDataWithAzion.value = parseSecureData(medianRepeatedViewWithAzion)
      })
      .catch(() => {
        setTestWithAzionErrorMessage('Not possible to load the test with Azion.')
      })
  }

  onMounted(() => {
    if (!client_id) {
      setGeneralErrorMessage(
        'The logged-in account does not have a valid client ID.',
        false
      )
      return
    }
  })

  onBeforeMount(async () => {
    if (!client_id) {
      return
    }

    const testId = getQueryString('id')
    await props.testConsolidationService({
      testId: testId,
      clientId: client_id
    })

    init()
  })
</script>
