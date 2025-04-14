<template>
  <div>
    <PickList
          v-model="data"
          :disabled="disabled"
          :pt="{
            sourceList: { class: ['h-80'] },
            targetList: { class: ['h-80'] },
            item: { class: 'hidden'},
            sourceWrapper: { class: 'max-w-[340px]' },
            targetWrapper: { class: 'max-w-[340px]' }
          }"
          dataKey="domainID"
          breakpoint="1400px"
          :showSourceControls="false"
          :showTargetControls="false"
          @scroll="handleScroll"
          data-testid="data-stream-form__domains__domains-field"
          :move-all-to-source-props="{
            'data-testid': 'data-stream-form__domains-field-picklist__move-all-to-source-btn'
          }"
          :move-all-to-target-props="{
            'data-testid': 'data-stream-form__domains-field-picklist__move-all-to-target-btn'
          }"
          :move-to-target-props="{
            'data-testid': 'data-stream-form__domains-field-picklist__move-to-target-btn'
          }"
          :move-to-source-props="{
            'data-testid': 'data-stream-form__domains-field-picklist__move-to-source-btn'
          }"
        >
          <template #sourceheader>Available {{ title }}</template>
          <template #targetheader>Chosen {{ title }}</template>

          <template #item="slotProps">

            <div class="flex flex-wrap p-2 pl-0 align-items-center gap-3 max-w-xs">
              <div class="flex-1 flex flex-column gap-2">
                <span
                  class="font-normal"
                  data-testid="data-stream-form__domains__domains-name"
                  >{{ slotProps.item.name }}</span
                >
              </div>
            </div>
          </template>
        </PickList>
  </div>
</template>
<script setup>
import PickList from 'primevue/picklist'
import { ref, onMounted, onBeforeUnmount, nextTick  } from 'vue'
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
  disabled: {
    type: Boolean
  },
  dataPick: {
    type: Array,
    default: () => [[], []]
  },
  title: {
    type: String
  },
})

let scrollElement = null

const data = ref(props.dataPick)
const loading = ref(true)
const addUniqueItems = (targetArray, itemsToAdd) => {
  const existingIds = new Set(targetArray.map(item => item.id))

  itemsToAdd.forEach(item => {
    if (!existingIds.has(item.id)) {
      targetArray.push(item)
    }
  })
}

const handleScroll = (e) => {
  const el = e.target
  console.log('scolling')
  const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight

  if (isBottom) {
    addUniqueItems(data.value[1], [{id: 33333, name: 'ultimo Domains'}])
    console.log('🟢 Chegou ao fim da lista!')
    // Aqui você pode carregar mais dados, emitir evento, etc.
  }
}

onMounted(async () => {
  await nextTick() // Garante que o DOM do PickList foi renderizado

  scrollElement = document.querySelector('.p-picklist-target')
  console.log('scrollElement', scrollElement)
  if (scrollElement) {
    scrollElement.addEventListener('scroll', handleScroll)
  }
})

onBeforeUnmount(() => {
  if (scrollElement) {
    scrollElement.removeEventListener('scroll', handleScroll)
  }
})
</script>