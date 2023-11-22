<template>
    <div class="flex flex-col min-h-[calc(100vh-120px)]" v-if="!isLoading">
      <PageHeadingBlock :pageTitle="solution.name" />
      <div class="px-8 max-md:px-3 flex flex-col lg:flex-row gap-4 lg:items-center">
        <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div class="w-10 h-10  hidden rounded sm:flex justify-center items-center bg-white ">
            <img
              class="rounded"
              :src="solution.vendor.icon"
              alt=""
            />
          </div>
          <div class="flex gap-3">
            <div class="flex gap-1">
              <span class="text-xs font-medium text-color-primary">By</span>
              <span class="text-xs font-medium text-color-secondary">{{ solution.vendor.name }}</span>
            </div>
            <div class="flex gap-1">
              <span class="text-xs font-medium text-color-primary">Version</span>
              <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
            </div>
            <div class="flex gap-1">
              <span class="text-xs font-medium text-color-primary">Last Updated</span>
              <span class="text-xs font-medium text-color-secondary">{{ solution.lastUpdate }}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row ml-0 lg:ml-auto gap-3">
          <PrimeButton
            label="More details"
            outlined
            @click="openDetails"
          />
          <PrimeButton 
            link
            label="azion.com"
            icon="pi pi-external-link"
            iconPos="right"
          />
        </div>
      </div>
      <form
        class="w-full grow px-8 flex flex-col gap-8 mb-5 max-md:px-3 max-md:gap-6"
      >
        <slot name="form" />
      </form>
      <DialogUnsavedBlock v-if="formMeta" :blockRedirectUnsaved="formMeta.touched" />
      <PrimeDialog
        v-model:visible="showDetails"
        modal
        class="w-full max-w-2xl"
        :pt="{
          content: { class: 'p-5' },
          header: { class: 'px-5 py-3 items-start'}
        }"
        position="center"
        :dismissableMask="true"
        :breakpoints="{ '641px': '90vw' }"
      >
        <template #header>
          <div class="w-full flex flex-col gap-2">
            <div class="flex gap-2 items-center">
              <div class="w-10 h-10 rounded flex justify-center items-center bg-white">
                <img
                  class="rounded"
                  :src="solution.vendor.icon"
                  alt=""
                />
              </div>
              <span class="text-xl font-medium ">
                {{ solution.name }}
              </span>
            </div>
            <div class="flex gap-3">
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">By</span>
                <span class="text-xs font-medium text-color-secondary">{{ solution.vendor.name }}</span>
              </div>
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">Version</span>
                <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
              </div>
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">Last Updated</span>
                <span class="text-xs font-medium text-color-secondary">{{ solution.lastUpdate }}</span>
              </div>
            </div>
          </div>
        </template>
        <div class="flex flex-col gap-6 w-full">
          <div class="flex flex-col gap-2">
            <span class="text-lg font-medium ">
              Overview
            </span>
            <div class="bg-transparent" v-html="solution.overview"></div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-lg font-medium ">
              Usage
            </span>
            <div class="bg-transparent" v-html="solution.usage"></div>
          </div>
        </div>
      </PrimeDialog>
      <ActionBarTemplate
        @cancel="navigateBack"
        @submit="validateAndSubmit"
        :loading="isLoading"
        />
        <!-- :submitDisabled="!formMeta.valid" -->
    </div>
  </template>
  <script>
    import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
    import ActionBarTemplate from '@/templates/action-bar-block'
    import PageHeadingBlock from '@/templates/page-heading-block'
    import PrimeButton from 'primevue/button'
    import PrimeDialog from 'primevue/dialog'
  
    export default {
      name: 'TemplateEngineBlock',
      components: {
        ActionBarTemplate,
        PageHeadingBlock,
        DialogUnsavedBlock,
        PrimeButton,
        PrimeDialog
      },
      emits: ['schema-loaded'],
      data: () => ({
        isLoading: true,
        template: {
          name: ''
        },
        solution: null,
        showDetails: false
      }),
      props: {
        createService: {
          type: Function,
          required: true
        },
        getSolutionService: {
          type: Function,
          required: true
        },
        getTemplateService: {
          type: Function,
          required: true
        },
        callback: {
          type: Boolean,
          default: true
        },
        disabledFeedback: {
          type: Boolean,
          default: false
        },
        formMeta: {
          type: Object,
          required: true
        },
        formData: {
          type: Object,
          required: true
        },
      },
      async created() {
        await this.loadSolution()
      },
      methods: {
        openDetails() {
        this.showDetails = true
      },
        navigateBack(redirectURL) {
          this.$router.push({ path: redirectURL })
        },
        async loadSolution() {
          try {
            const { vendor, solution} = this.$route.params
            const response = await this.getSolutionService(vendor, solution)
            this.solution = response
            await this.loadTemplate(this.solution.referenceId)
          } catch (error) {
            this.$toast.add({
              closable: false,
              severity: 'error',
              summary: error,
              life: 10000
            })
          } finally {
            this.isLoading = false
          }
        },
        async loadTemplate(id) {
          try {
            
            const initialData = await this.getTemplateService(id)
            this.template = initialData
            this.$emit('schema-loaded', initialData.inputSchema)
          } catch (error) {
            this.$toast.add({
              closable: false,
              severity: 'error',
              summary: error,
              life: 10000
            })
          } finally {
            this.isLoading = false
          }
        },
        showToast(severity, summary, life = 10000) {
          if (!summary) return
          this.$toast.add({
            closable: false,
            severity: severity,
            summary: summary,
            life: life
          })
        },
        showFeedback(feedback = 'created successfully') {
          if (!this.disabledFeedback) {
            this.showToast('success', feedback)
          }
        },
        handleSuccess(feedback, redirectURL) {
          this.cleanFormCallback()
          this.$emit('on-response', feedback)
          this.showFeedback(feedback)
          if (this.callback) this.navigateBack(redirectURL)
        },
        async validateAndSubmit() {
          try {
            this.isLoading = true
            const payload = [];
            if (this.formData.fields) {
              payload.push(...this.formData.fields)
            }
            if (this.formData.groups) {
              this.formData.groups.forEach((group) => {
                payload.push(...group.fields)
              })
            }
            payload.forEach((_,index) => {
              const val = payload[index].value.value
              payload[index].field = payload[index].name
              delete payload[index].name
              delete payload[index].value;
              delete payload[index].hidden;
              delete payload[index].type;
              delete payload[index].label;
              delete payload[index].info;
              delete payload[index].description;
              delete payload[index].placeholder;
              delete payload[index].validators;
              delete payload[index].attrs;
              payload[index].value = val
            })
            const data = await this.createService(this.solution.referenceId, payload)
            this.handleSuccess(data.feedback, data.redirectURL)
          } catch (error) {
            this.showToast('error', error)
          } finally {
            this.isLoading = false
          }
        }
      }
    }
  </script>
  