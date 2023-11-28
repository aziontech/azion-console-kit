<!-- { content : "test content" , content_type : "Text", name : "/resources.sh" } -->
<script setup>
  import { computed, ref } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import MultiSelect from 'primevue/multiselect'
  import ActionBarTemplate from '@/templates/action-bar-block'

  const emit = defineEmits(['update:visible'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'right'
    },
    resource: {
      type: Object,
      default: () => ({})
    }
  })

  const selectedCities = ref()
  const cities = ref([
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' }
  ])

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const openDrawer = (value) => {
    visibleDrawer.value = value
  }

  const closeSideBar = () => {
    openDrawer(false)
  }
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :update:visible="openDrawer"
    position="right"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      header: { class: 'flex justify-between text-xl font-medium px-8' },
      closeButton: { class: 'border surface-border' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>New Resource</div>
    </template>
    <div class="w-full flex flex-col p-8">
      <form class="w-full flex flex-col gap-8 mb-5">
        <form-horizontal
          title="Title Section"
          description="Quando tiver sentido complementar os campos devem ir ao lado.
                Essas definições serão sempre feitas pelo Produt Designer responsável pelo projeto."
          :isDrawer="true"
        >
          <template #inputs>
            <!-- MultiSelect start -->
            <div class="flex flex-col w-full sm:max-w-3xl gap-2">
              <label
                for="select-01"
                class="text-color text-base font-medium"
                >Label</label
              >
              <MultiSelect
                id="select-01"
                v-model="selectedCities"
                :options="cities"
                optionLabel="name"
                placeholder="Select"
                :maxSelectedLabels="3"
                display="chip"
              />

              <div class="text-color-secondary text-sm font-normal">Helper Text</div>
            </div>
            <!-- MultiSelect end -->
          </template>
        </form-horizontal>
      </form>
    </div>
    <action-bar-template @cancel="closeSideBar"></action-bar-template>
  </Sidebar>
</template>
