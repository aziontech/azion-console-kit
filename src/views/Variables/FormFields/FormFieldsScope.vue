<script setup>
  import { useFieldArray, useFormValues } from 'vee-validate'
  import PrimeButton from '@aziontech/webkit/button'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import ScopeRow from './ScopeRow.vue'

  defineOptions({ name: 'form-fields-scope' })

  const { fields, push, remove } = useFieldArray('scope')
  const formValues = useFormValues()

  const addScope = () => {
    const scopes = formValues.value?.scope ?? []
    const hasGlobal = scopes.some((scope) => scope?.type === 'global')
    push({ type: hasGlobal ? '' : 'global', resourceType: '', id: '' })
  }
</script>

<template>
  <FormHorizontal
    title="Scope"
    description="Define where this variable is available. At least one scope is required."
  >
    <template #inputs>
      <div
        v-for="(field, index) in fields"
        :key="field.key"
        class="flex flex-col sm:max-w-lg w-full"
        :data-testid="`variables-form__scope-item-${index}`"
      >
        <ScopeRow
          :index="index"
          :canRemove="fields.length > 1"
          @remove="remove(index)"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full">
        <PrimeButton
          type="button"
          label="Add scope"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          outlined
          data-testid="variables-form__scope-add"
          @click="addScope"
        />
        <InlineMessage
          v-if="!fields.length"
          severity="warn"
          class="w-fit"
        >
          Add at least one scope so the variable can be resolved at runtime.
        </InlineMessage>
      </div>
    </template>
  </FormHorizontal>
</template>
