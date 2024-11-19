<script setup>
  import { computed, onBeforeMount, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import CheckboxPrime from 'primevue/checkbox'
  import ActionBarBlock from '@/templates/action-bar-block'
  import Divider from 'primevue/divider'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'
  import Skeleton from 'primevue/skeleton'
  import InputText from 'primevue/inputtext'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'

  defineOptions({
    name: 'more-details'
  })

  const emit = defineEmits(['update:visible', 'attack-on'])
  const toast = useToast()
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    listService: {
      type: Function,
      required: true
    },
    domains: {
      type: Array,
      default: () => [],
      required: true
    },
    netWorkList: {
      type: String,
      default: '',
      required: true
    },
    time: {
      type: String,
      default: '',
      required: true
    },
    tuningObject: {
      type: Object,
      default: () => {},
      required: true
    }
  })

  const loading = ref(false)
  const showGoBack = ref(false)
  const possibleAttacks = ref([])
  const selectedAttack = ref([])
  const searchByPath = ref('')
  const pathSearched = ref('')

  const showToast = (severity, summary) => {
    const options = {
      closable: true,
      severity: severity,
      summary: summary
    }

    toast.add(options)
  }

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const loadInitialData = async (namePath = '') => {
    try {
      loading.value = true
      const response = await props.listService(namePath)
      possibleAttacks.value = response
    } catch (error) {
      showToast('error', error)
    } finally {
      loading.value = false
    }
  }

  const filterAttackByPath = async () => {
    possibleAttacks.value = []
    await loadInitialData(searchByPath.value)
    pathSearched.value = searchByPath.value
  }

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
  }

  const handleGoBack = () => {
    showGoBack.value = false
    toggleDrawerVisibility(false)
  }

  const checkActiveBorder = (attack) => {
    if (!selectedAttack.value) return false
    return selectedAttack.value.find((item) => item.id === attack.id)
  }
  const createAllowed = () => {
    emit('attack-on', selectedAttack.value)
  }

  onBeforeMount(async () => {
    await loadInitialData()
  })
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :update:visible="toggleDrawerVisibility"
    position="right"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      header: { class: 'flex justify-between text-xl font-medium px-8' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      closeButton: { class: 'border surface-border' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between overflow' }
    }"
  >
    <template #header>
      <h2>More Details</h2>
      <ConsoleFeedback />
    </template>
    <div class="flex flex-col p-0 gap-6 sm:gap-8 sm:p-8">
      <div
        class="flex max-w-screen-2xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
      >
        <div class="flex-col justify-center items-start gap-3 flex">
          <div class="text-color text-xl font-medium">
            {{ tuningObject.ruleIdDescription }}
          </div>
          <div class="justify-start items-center gap-1 inline-flex">
            <i class="pi pi-calendar text-color"></i>
            <span class="text-color-secondary">{{ time }}</span>
          </div>
        </div>
        <Divider></Divider>
        <div class="flex flex-col sm:flex-row w-full gap-3 sm:gap-8">
          <div class="w-full sm:w-1/2 flex flex-col gap-3">
            <div class="flex justify-between w-full gap-3">
              <span class="w-1/2 text-color font-medium">Domain</span>
              <div class="flex flex-col w-1/2">
                <span
                  class="w-full text-color-secondary break-all"
                  v-for="(domain, index) in props.domains"
                  :key="index"
                  >{{ domain }}
                </span>
              </div>
            </div>
            <div class="flex justify-between w-full gap-3">
              <span class="w-1/2 text-color font-medium">IP Address</span>
              <span class="w-1/2 text-color-secondary"></span>
            </div>
          </div>
          <div class="w-full sm:w-1/2 flex flex-col gap-3">
            <div class="flex justify-between w-full gap-3">
              <span class="w-1/2 text-color font-medium">Network List</span>
              <span class="w-1/2 text-color-secondary">{{ netWorkList }}</span>
            </div>
            <div class="flex justify-between w-full gap-3">
              <span class="w-1/2 text-color font-medium">Country</span>
              <span class="w-1/2 text-color-secondary"></span>
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex max-w-screen-2xl mx-auto gap-8 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
      >
        <div class="flex-col gap-8 flex w-full">
          <div class="gap-2 flex flex-col">
            <div class="text-color text-xl font-medium">Possible Attacks List</div>
            <div class="text-color-secondary items-center gap-1 inline-flex">
              Select fields to create allowed rules in the WAF.
            </div>
          </div>
          <div class="w-full sm:max-w-xs">
            <span class="p-input-icon-left flex">
              <i class="pi pi-search" />
              <InputText
                class="w-full"
                placeholder="Search by path"
                v-model="searchByPath"
                @keyup.enter="filterAttackByPath"
              />
            </span>
          </div>
          <div class="flex flex-col gap-2 w-full">
            <span class="text-color text-sm font-medium">Fields List</span>
            <Skeleton
              v-if="loading"
              width="100%"
              height="10rem"
              class="z-0"
            ></Skeleton>
            <div
              class="flex w-full surface-section rounded-md border surface-border p-4 flex-wrap"
              v-for="(attack, index) in possibleAttacks"
              :key="index"
              :class="{ 'border-orange-500': checkActiveBorder(attack) }"
            >
              <div class="flex w-full gap-3 items-start">
                <CheckboxPrime
                  v-model="selectedAttack"
                  name="attack.ruleID"
                  :value="attack"
                />
                <div class="flex-col gap-1 w-full">
                  <div
                    class="text-color font-medium"
                    for="value"
                  >
                    {{ attack.matchValue }}
                  </div>
                  <div class="text-color-secondary font-normal mb-3">Field Description</div>
                  <div class="flex flex-col sm:flex-row gap-3 sm:gap-8">
                    <div class="flex w-full sm:w-1/2 flex-col gap-3">
                      <div class="w-full flex justify-between">
                        <div class="w-1/2 flex flex-col text-color font-medium">
                          <span>Top 10 IPs Address</span>
                        </div>
                        <div class="flex w-1/2 flex-col text-color-secondary">
                          <span
                            v-for="(ip, index) in attack.topIps"
                            :key="index"
                            >{{ ip }}</span
                          >
                        </div>
                      </div>
                      <div class="flex justify-between">
                        <div class="flex flex-col text-color font-medium w-1/2">
                          <span>Top 10 Paths</span>
                        </div>
                        <div class="flex flex-col w-1/2">
                          <span
                            class="break-all"
                            v-for="(path, index) in attack.topPaths"
                            :key="index"
                            :class="{
                              'text-color-secondary': pathSearched !== path,
                              'text-orange-500': pathSearched === path
                            }"
                            >{{ path }}</span
                          >
                        </div>
                      </div>
                    </div>
                    <div class="flex w-full sm:w-1/2 flex-col gap-3">
                      <div class="w-full flex justify-between">
                        <div class="flex w-1/2 flex-col text-color font-medium">
                          <span>Top 10 Countries</span>
                        </div>
                        <div class="flex w-1/2 flex-col text-color-secondary">
                          <span
                            v-for="(country, index) in attack.topCountries"
                            :key="index"
                            >{{ country }}</span
                          >
                        </div>
                      </div>
                      <div class="w-full flex justify-between">
                        <div class="flex w-1/2 gap-3 flex-col text-color font-medium">
                          <span>Total Hits</span>
                          <span>Total IPs</span>
                          <span>Total Countries</span>
                        </div>
                        <div class="flex w-1/2 gap-3 flex-col text-color-secondary">
                          <span>{{ attack.hitCount }}</span>
                          <span>{{ attack.ipCount }}</span>
                          <span>{{ attack.countryCount }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="!possibleAttacks.length && !loading"
              class="text-md font-normal text-secondary"
            >
              No fields list found
            </div>
          </div>
        </div>
      </div>
    </div>

    <div></div>
    <div class="sticky bottom-0">
      <GoBack
        :goBack="handleGoBack"
        v-if="showGoBack"
        :inDrawer="true"
      />
      <ActionBarBlock
        v-else
        @onCancel="closeDrawer"
        @onSubmit="createAllowed"
        :inDrawer="true"
        primaryActionLabel="Allow Rules"
        :submitDisabled="!selectedAttack.length"
      />
    </div>
  </Sidebar>
</template>
