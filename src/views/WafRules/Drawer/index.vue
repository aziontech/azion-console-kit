<script setup>
  import { computed, onBeforeMount, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import Divider from 'primevue/divider'
  import GoBack from '@/templates/action-bar-block/go-back'
  import InputText from 'primevue/inputtext'
  import EmptyDrawer from '@/templates/empty-drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import WithSelectionBehavior from '@/templates/list-table-block/with-selection-behavior.vue'

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

  const createAllowed = () => {
    emit('attack-on', selectedAttack.value)
  }

  onBeforeMount(async () => {
    await loadInitialData()
  })

  const tableColumns = [
    {
      field: 'matchValue',
      header: 'Field',
      sortable: true
    },
    {
      field: 'hitCount',
      header: 'Total Hits',
      sortable: true
    },
    {
      field: 'ipCount',
      header: 'Total IPs',
      sortable: true
    },
    {
      field: 'countryCount',
      header: 'Total Countries',
      sortable: true
    },
    {
      field: 'topIps',
      header: 'Top 10 IPs',
      sortable: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'topCountries',
      header: 'Top 10 Countries',
      sortable: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'topPaths',
      header: 'Top 10 Paths',
      sortable: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    }
  ]
</script>

<template>
  <EmptyDrawer
    v-model:visible="visibleDrawer"
    title="More Details"
    expandable
    expandedDefault
  >
    <template #content>
      <div class="flex flex-col w-full">
        <div class="flex flex-col p-0 gap-6 sm:gap-8">
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
            <div class="flex gap-2">
              <span class="text-color font-medium">Domains:</span>
              <span class="text-color-secondary">{{
                props.domains.map((domain) => domain.name).join(', ')
              }}</span>
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
              <WithSelectionBehavior
                v-model:selectedItensData="selectedAttack"
                :columns="tableColumns"
                :tableData="possibleAttacks"
                :externalLoading="loading"
                hiddenHeader
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
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
    </template>
  </EmptyDrawer>
</template>
