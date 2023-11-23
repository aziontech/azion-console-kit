
<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)] pt-5">
    <TemplateEngineBlock
      :getTemplateService="getTemplate"
      :postTemplateService="instantiateTemplate"
      :templateId="uuid"
      ref="template"
    />

  </div>
  
  
</template>
  <script>
    import TemplateEngineBlock from '@/templates/template-engine-block'
    import { getTemplate, instantiateTemplate } from '@/services/template-engine-services';

    export default {
      name: 'script-runner-test-block',
      components: {
        TemplateEngineBlock,

      },
      async created() {
        //

      },
      data: () => ({
        uuid: '9cd54b7d-666a-4e45-8097-47ae1fb70014',
        getTemplate,
        instantiateTemplate
      }),
      methods: {
        submit() {
          this.$refs.template.validateAndSubmit()
  
        }
      }
    }
  </script>
  
