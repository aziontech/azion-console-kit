<template>
  <div class="flex items-start gap-3">
    <Checkbox
      v-model="accepted"
      :binary="true"
      inputId="terms-acceptance"
    />
    <label
      for="terms-acceptance"
      class="text-[13px] leading-5 font-medium text-color-secondary cursor-pointer"
    >
      I accept the
      <Button
        label="Terms of Service"
        link
        size="small"
        class="p-0 align-baseline"
        @click.stop="azionTermsAndServicesWindowOpener"
      />
      and the
      <Button
        label="Privacy Policy."
        link
        size="small"
        class="p-0 align-baseline"
        @click.stop="azionPrivacyPolicyWindowOpener"
      />
    </label>
  </div>
</template>

<script setup>
  import Checkbox from '@aziontech/webkit/checkbox'
  import Button from '@aziontech/webkit/button'
  import { azionPrivacyPolicyWindowOpener, azionTermsAndServicesWindowOpener } from '@/helpers'

  defineOptions({ name: 'terms-acceptance-block' })

  const accepted = defineModel({ type: Boolean, default: false })
</script>
