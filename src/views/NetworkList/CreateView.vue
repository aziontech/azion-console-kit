<template>
  <CreateFormBlock
    :pageTitle="'Create Network Lists'"
    :createService="props.createNetworkListService"
    :formData="values"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="card flex justify-content-center">
        <Textarea v-model="value" rows="5" cols="30" />
      </div>
    </template>
  </CreateFormBlock>
</template>

<script setup>
import CreateFormBlock from '@/templates/create-form-block'
import Textarea from 'primevue/textarea'


const props = defineProps({
  createNetworkListService: {
    type: Function,
    required: true
  }
})


</script>
