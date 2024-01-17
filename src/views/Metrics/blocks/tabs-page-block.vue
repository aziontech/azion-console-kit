<script setup>
  import Dropdown from 'primevue/dropdown'
  import TabMenu from 'primevue/tabmenu'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    params: {
      type: Object,
      required: true
    },
    metricsProductsService: {
      type: Function,
      required: true
    },
    metricsGroupsService: {
      type: Function,
      required: true
    }
  })

  onMounted(() => {
    fetchGroups()
  })

  const metricsGroups = ref([])
  const fetchGroups = async () => {
    metricsGroups.value = await props.metricsGroupsService()
    setCurrentGroup()
  }

  const selectedGroup = ref(null)
  const setCurrentGroup = () => {
    selectedGroup.value = metricsGroups.value.find((group) => group.id == props.params?.pageId)
  }

  watch(
    selectedGroup,
    (current) => {
      if (current) {
        setCurrentProduct(current.value)
      }
    },
    { immediate: true }
  )

  const router = useRouter()

  const metricsProducts = ref([])
  const productIdx = ref(null)
  const selectedProduct = computed(() => metricsProducts.value[productIdx.value])

  const setCurrentProduct = async (groupName) => {
    metricsProducts.value = await props.metricsProductsService(groupName)
    productIdx.value = getCurrentProductIdx()

    setNewParams()
  }

  const getCurrentProductIdx = () => {
    const idx = metricsProducts.value.findIndex((product) => product.id == props.params.dashboardId)

    return idx < 0 ? 0 : idx
  }

  const setNewParams = () => {
    router.replace({
      name: 'metrics',
      params: { pageId: selectedGroup.value.id, dashboardId: selectedProduct.value.id }
    })
  }

  watch(selectedProduct, () => {
    setNewParams()
  })
</script>
<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Dropdown
      v-model="selectedGroup"
      :options="metricsGroups"
      :loading="!metricsGroups.length"
      optionLabel="label"
      class="flex self-start"
    />
    <TabMenu
      v-model:activeIndex="productIdx"
      :model="metricsProducts"
      :key="productIdx"
      :pt="{ action: { class: 'w-max' } }"
    />
  </div>
</template>
