<template>
  <form
    class="w-full flex flex-col gap-6"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-2">
      <label class="font-semibold text-sm">What description best fits your work? </label>
      <div class="flex flex-col gap-3 mb-8">
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Developer
          <PrimeRadio
            v-model="occupation"
            value="developer"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >DevOps
          <PrimeRadio
            v-model="occupation"
            value="devops"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >System Admin
          <PrimeRadio
            v-model="occupation"
            value="system_admin"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Security Analyst
          <PrimeRadio
            v-model="occupation"
            value="security_analyst"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Team Lead
          <PrimeRadio
            v-model="occupation"
            value="team_lead"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Other
          <PrimeRadio
            v-model="occupation"
            value="other"
          />
        </label>
      </div>
      <label class="font-semibold text-sm">What would you like to build with Azion? </label>
      <div class="flex flex-wrap gap-3 mb-8">
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Just a personal project
          <PrimeRadio
            v-model="intention"
            value="personal"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Projects for my company
          <PrimeRadio
            v-model="intention"
            value="single_company"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Multiple projects for other companies
          <PrimeRadio
            v-model="intention"
            value="multiple_projects"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Other
          <PrimeRadio
            v-model="intention"
            value="other"
          />
        </label>
      </div>
      <label class="font-semibold text-sm">What are you building? </label>
      <div class="flex flex-wrap gap-3">
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Web Apps
          <PrimeRadio
            v-model="product"
            value="web_apps"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Mobile Apps
          <PrimeRadio
            v-model="product"
            value="mobile_apps"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Static Websites
          <PrimeRadio
            v-model="product"
            value="static_websites"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Blogs
          <PrimeRadio
            v-model="product"
            value="blogs"
          />
        </label>
        <label
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          >Firewall
          <PrimeRadio
            v-model="product"
            value="firewall"
          />
        </label>
      </div>
    </div>
    <PrimeButton
      label="Finish Signup"
      type="submit"
      severity="secondary"
      :disabled="!meta.valid"
      :loading="loading"
    />
  </form>
</template>

<script setup>
  import PrimeRadio from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref } from 'vue'

  defineOptions({
    name: 'additional-data-form-block'
  })

  const validationSchema = yup.object({
    occupation: yup.string().required(),
    intention: yup.string().required(),
    building: yup.string().required()
  })

  const { values, meta } = useForm({ validationSchema })

  const { value: occupation } = useField('occupation')
  const { value: intention } = useField('intention')
  const { value: product } = useField('building')

  const loading = ref(false)
  const submitForm = () => {
    return values
  }
</script>
