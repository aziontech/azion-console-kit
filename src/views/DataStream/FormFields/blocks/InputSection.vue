<template>
  <FormHorizontal
    title="Input"
    description="Define the source and the variables from which data should be collected."
    data-testid="data-stream-form__section__data-settings"
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Data Source"
            required
            name="dataSource"
            :options="listDataSources"
            optionLabel="label"
            optionValue="value"
            :loading="loadingDataSources"
            :value="dataSource"
            appendTo="self"
            description="Represents the data source the data will be collected from."
            data-testid="data-stream-form__data-settings__data-source-field"
            :disabled="disabled"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import { dataStreamService } from '@/services/v2/data-stream/data-stream-service'

  defineProps({
    disabled: {
      type: Boolean,
      required: true
    }
  })

  const listDataSources = ref([])
  const loadingDataSources = ref(false)

  const { value: dataSource } = useField('dataSource')

  const loadDataSources = async () => {
    try {
      loadingDataSources.value = true
      const response = await dataStreamService.listDataSourcesService()
      listDataSources.value = response.body.map((item) => ({
        label: item.name,
        value: item.slug
      }))
    } catch (error) {
      listDataSources.value = []
    } finally {
      loadingDataSources.value = false
    }
  }

  onMounted(() => {
    loadDataSources()
  })
</script>
