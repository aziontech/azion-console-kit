<template>
  <div class="px-4">
    <ContentBlock data-testid="view-compare-with-azion-test">
      <template #heading>
        <PageHeadingBlock
          pageTitle=""
          data-testid="view-compare-with-azion-test-heading"
        />
      </template>

      <template #content>
        <div
          class="w-fit"
          v-if="hasGeneralMessage()"
        >
          <RetryMessage
            :timer="60"
            :data="generalError"
            @onRetry="retryGeneralMessage()"
          />
        </div>
        <div
          v-else
          class="grid md:grid-cols-2 gap-10"
        >
          <div>
            <div
              v-if="hasTestMessage()"
              class="w-fit"
            >
              <RetryMessage
                :timer="30"
                :data="errorData"
                @onRetry="retryTestMessage()"
              />
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
            <div
              v-if="hasTestWithAzionMessage()"
              class="w-fit"
            >
              <RetryMessage
                :timer="30"
                :data="errorDataWithAzion"
                @onRetry="retryTestWithAzionMessage()"
              />
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
  const errorData = ref({})
  const resumeData = ref({})
  const gradeData = ref([])
  const secureData = ref({})
  const errorDataWithAzion = ref({})
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

  const hasGeneralMessage = () => Object.keys(generalError.value).length
  const resetGeneralMessage = () => (generalError.value = {})
  const setGeneralMessage = (general) => {
    return (generalError.value = {
      message: general.message,
      retry: general.retry,
      severity: general.severity
    })
  }
  const retryGeneralMessage = () => {
    resetGeneralMessage()
    init()
  }

  const hasTestMessage = () => Object.keys(errorData.value).length
  const resetTestMessage = () => (errorData.value = {})
  const setTestMessage = (test) => {
    return (errorData.value = {
      message: test.message,
      retry: test.retry,
      severity: test.severity
    })
  }
  const retryTestMessage = async () => {
    resetTestMessage()
    const testById = await getTestById()
    loadTest(testById.body[0].id)
  }

  const hasTestWithAzionMessage = () => Object.keys(errorDataWithAzion.value).length
  const resetTestWithAzionMessage = () => (errorDataWithAzion.value = {})
  const setTestWithAzionMessage = (message) => {
    return (errorDataWithAzion.value = message)
  }
  const retryTestWithAzionMessage = async () => {
    resetTestWithAzionMessage()
    const testById = await getTestById()
    loadTestWithAzion(testById.body[0].id_azion)
  }

  const loadTest = async (id) => {
    return getResultFromWebpagetest(id)
      .then((result) => {
        if (result.body.statusCode !== 200) {
          setTestMessage({
            message: `Test ${result.body.data.id} is ${result.body.statusText}`,
            severity: 'warn',
            retry: true
          })
          return
        }

        const medianFirstView = extract.medianRepeatView(result.body)
        resumeData.value = resultparse.grade(result.body)
        gradeData.value = parseGradeData(medianFirstView)
        secureData.value = parseSecureData(medianFirstView)
      })
      .catch(() => {
        setTestMessage({
          message: 'Not possible to load the Origin test.',
          severity: 'error',
          retry: false
        })
      })
  }

  const loadTestWithAzion = async (id) => {
    return getResultFromWebpagetest(id)
      .then((resutWithAzion) => {
        if (resutWithAzion.body.statusCode !== 200) {
          setTestWithAzionMessage({
            message: `Test ${resutWithAzion.body.data.id} is ${resutWithAzion.body.statusText}`,
            severity: 'info',
            retry: true
          })
          return
        }

        const medianRepeatedViewWithAzion = extract.medianRepeatView(resutWithAzion.body)
        resumeDataWithAzion.value = resultparse.grade(resutWithAzion.body)
        gradeDataWithAzion.value = parseGradeData(medianRepeatedViewWithAzion)
        secureDataWithAzion.value = parseSecureData(medianRepeatedViewWithAzion)
      })
      .catch(() => {
        setTestWithAzionMessage({
          message: 'Not possible to load the test with Azion.',
          severity: 'error',
          retry: false
        })
      })
  }

  const getTestById = async () => await props.getTestById(getQueryString('id'), client_id)

  const init = async () => {
    const testById = await getTestById()

    if (!testById.body.length) {
      setGeneralMessage({
        message: 'Propagating comparative consolidation...',
        retry: true,
        severity: 'info'
      })
      return
    }

    loadTest(testById.body[0].id)
    loadTestWithAzion(testById.body[0].id_azion)
  }

  onMounted(() => {
    if (!client_id) {
      setGeneralMessage({
        message: 'The logged-in account does not have a valid client ID.',
        severity: 'error',
        retry: false
      })
      return
    }
  })

  onBeforeMount(async () => {
    if (!client_id) return

    const testId = getQueryString('id')
    await props.testConsolidationService({
      testId: testId,
      clientId: client_id
    })

    init()
  })
</script>
