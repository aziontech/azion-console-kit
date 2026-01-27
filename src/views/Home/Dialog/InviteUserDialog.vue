<script setup>
  import { ref, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'

  defineOptions({ name: 'invite-user-dialog' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    listTeamsService: {
      type: Function,
      required: true
    },
    inviteYourTeamService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['update:visible', 'invite-success'])

  const toast = useToast()
  const showDialog = ref(false)
  const loading = ref(false)
  const teams = ref([])

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Full Name is a required field')
      .test('non-numeric', 'Full Name must include first and last name', (value) => {
        const alphaRegex = /[A-zÀ-ž.'-]+ [A-zÀ-ž.'-]+/
        return alphaRegex.test(value)
      }),
    email: yup.string().email('Must be a valid email').required('E-mail is a required field'),
    team: yup.string().required('Team is a required field')
  })

  const { handleSubmit, resetForm, meta } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      email: '',
      team: ''
    }
  })

  const loadTeams = async () => {
    try {
      teams.value = await props.listTeamsService()
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load teams'
      })
    }
  }

  const closeDialog = () => {
    emit('update:visible', false)
    resetForm()
  }

  const handleInvite = handleSubmit(async (values) => {
    loading.value = true
    try {
      const feedback = await props.inviteYourTeamService(values)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: feedback
      })
      emit('invite-success')
      closeDialog()
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || error
      })
    } finally {
      loading.value = false
    }
  })

  watch(
    () => props.visible,
    (value) => {
      showDialog.value = value
      if (value) {
        loadTeams()
      }
    }
  )

  watch(showDialog, (value) => {
    if (!value) {
      emit('update:visible', false)
      resetForm()
    }
  })
</script>

<template>
  <PrimeDialog
    :blockScroll="true"
    v-model:visible="showDialog"
    modal
    :pt="{
      root: { class: 'p-0 w-[576px] max-w-full' },
      header: {
        class: 'flex py-5 px-8 items-center border-b border-solid border-[var(--surface-border)]'
      },
      content: { class: 'p-0' },
      footer: {
        class:
          'flex py-3 px-8 justify-end gap-3 border-t border-solid border-[var(--surface-border)]'
      }
    }"
  >
    <template #header>
      <h5 class="text-lg font-bold leading-5">Invite User</h5>
    </template>

    <form
      class="flex flex-col"
      @submit.prevent="handleInvite"
      @keydown.enter.prevent="handleInvite"
    >
      <div class="px-8 py-5 border-b border-[var(--surface-border)]">
        <p class="text-sm text-color-secondary leading-5">
          Invite your team to collaborate on projects, set permissions and access levels.
        </p>
      </div>

      <div class="px-8 py-5 flex flex-col gap-3.5">
        <div class="flex gap-3 w-full">
          <div class="flex flex-col gap-2 flex-1">
            <FieldText
              data-testid="invite-user-dialog__name-field"
              label="Full Name"
              name="name"
              placeholder="John Doe"
              required
            />
          </div>
          <div class="flex flex-col gap-2 flex-1">
            <FieldDropdown
              data-testid="invite-user-dialog__team-field"
              label="Team"
              name="team"
              placeholder="Select a team"
              :options="teams"
              optionLabel="label"
              optionValue="value"
              :loading="!teams.length"
              :filter="true"
              appendTo="body"
              required
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <FieldText
            data-testid="invite-user-dialog__email-field"
            label="Email"
            name="email"
            placeholder="email@example.com"
            required
          />
        </div>
      </div>
    </form>

    <template #footer>
      <PrimeButton
        severity="primary"
        label="Cancel"
        outlined
        @click="closeDialog"
        data-testid="invite-user-dialog__cancel-button"
      />
      <PrimeButton
        severity="secondary"
        label="Send Invite"
        :loading="loading"
        :disabled="!meta.valid"
        @click="handleInvite"
        data-testid="invite-user-dialog__submit-button"
      />
    </template>
  </PrimeDialog>
</template>
