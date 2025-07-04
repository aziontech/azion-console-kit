<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import PrimeTag from 'primevue/tag'
  import { computed } from 'vue'
  import { useField } from 'vee-validate'

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    noBorder: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  })

  const { value: infrastructure } = useField('infrastructure')

  const tag = {
    value: 'The environment type cannot be changed after the domain is created',
    icon: 'pi pi-lock'
  }

  const tagInfrastructureProduct = computed(() =>
    props.isEdit && infrastructure.value === '1' ? tag : null
  )
  const tagInfrastructureStage = computed(() =>
    props.isEdit && infrastructure.value === '2' ? tag : null
  )

  const environmentOptionsRadios = computed(() => [
    {
      title: 'Production Infrastructure (All Edge Locations)',
      subtitle:
        'Deploy to the Staging Network for testing with limited propagation to Edge Locations.',
      inputValue: '1',
      disabled: props.isEdit,
      tag: tagInfrastructureProduct.value
    },
    {
      title: 'Staging Infrastructure',
      subtitle:
        'Deploy to the Staging Network for testing with limited propagation to Edge Locations.',
      inputValue: '2',
      disabled: props.isEdit,
      tag: tagInfrastructureStage.value
    }
  ])
</script>

<template>
  <form-horizontal
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
    title="Infrastructure"
    description="Select Global Edge Network to set this as a production workload or select Staging Network for a testing workload that won’t affect your production environment."
  >
    <template #inputs>
      <div class="flex flex-col gap-3">
        <FieldGroupRadio
          isCard
          nameField="infrastructure"
          :options="environmentOptionsRadios"
        >
          <template #footer="{ item }">
            <PrimeTag
              v-if="item?.tag"
              :value="item.tag.value"
              :icon="item.tag.icon"
              severity="info"
              class="mt-3"
            />
          </template>
        </FieldGroupRadio>
      </div>
    </template>
  </form-horizontal>
</template>
