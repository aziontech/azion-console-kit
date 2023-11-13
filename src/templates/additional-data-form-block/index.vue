<template>
  <form
    class="w-full flex flex-col gap-6"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-2">
      <label class="font-semibold text-sm">What description best fits your work? </label>
      <div class="flex flex-col gap-3 mb-8">
        <label
          v-for="item in jobFunctionList"
          :key="item.value"
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          :class="{ 'border-radio-card-active': jobFunction === item.value }"
          >{{ item.label }}
          <PrimeRadio
            v-model="jobFunction"
            :value="item.value"
          />
        </label>
      </div>
      <label class="font-semibold text-sm">What would you like to build with Azion? </label>
      <div class="flex flex-wrap gap-3 mb-8">
        <label
          v-for="item in projectTypeSelectionList"
          :key="item.value"
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          :class="{ 'border-radio-card-active': projectTypeSelection === item.value }"
          >{{ item.label }}
          <PrimeRadio
            v-model="projectTypeSelection"
            :value="item.value"
          />
        </label>
      </div>
      <label class="font-semibold text-sm">What are you building? </label>
      <div class="flex flex-wrap gap-3">
        <label
          v-for="item in productList"
          :key="item.value"
          class="w-full border-1 rounded-md surface-border font-medium flex align-items-center justify-between p-4 gap-2"
          :class="{ 'border-radio-card-active': product === item.value }"
          >{{ item.label }}
          <PrimeRadio
            v-model="product"
            :value="item.value"
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

  const jobFunctionList = [
    { label: 'Developer', value: 'developer' },
    { label: 'DevOps', value: 'devops' },
    { label: 'System Admin', value: 'system_admin' },
    { label: 'Security Analyst', value: 'security_analyst' },
    { label: 'Team Lead', value: 'team_lead' },
    { label: 'Other', value: 'other' }
  ]

  const projectTypeSelectionList = [
    { label: 'Just a personal project', value: 'personal' },
    { label: 'Projects for my company', value: 'internal' },
    { label: 'Multiple projects for other companies', value: 'multiple_project' },
    { label: 'Other', value: 'other' }
  ]

  const productList = [
    { label: 'Web Apps', value: 'web_apps' },
    { label: 'Mobile Apps', value: 'mobile_apps' },
    { label: 'Static Websites', value: 'static_websites' },
    { label: 'Blogs', value: 'blogs' },
    { label: 'Firewall', value: 'firewall' }
  ]

  const validationSchema = yup.object({
    jobFunction: yup.string().required(),
    projectTypeSelection: yup.string().required(),
    building: yup.string().required()
  })

  const { values, meta } = useForm({ validationSchema })

  const { value: jobFunction } = useField('jobFunction')
  const { value: projectTypeSelection } = useField('projectTypeSelection')
  const { value: product } = useField('building')

  const loading = ref(false)
  const submitForm = () => {
    return values
  }
</script>
