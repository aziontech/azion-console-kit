<template>
  <TemplateEngineBlock :getTemplateService="getTemplate" :postTemplateService="instantiateTemplate" :templateId="uuid" />
</template>
  <script>
    import TemplateEngineBlock from '@/templates/template-engine-new-block'
    import {getTemplate, instantiateTemplate} from '@/services/template-engine-services'
    export default {
      name: 'script-runner-test-block',
      components: {
        TemplateEngineBlock
      },
      async created() {
        //
      },
      data: () => ({
        uuid: '9cd54b7d-666a-4e45-8097-47ae1fb70014',
        getTemplate,
        instantiateTemplate
      }),
    }
  </script>
