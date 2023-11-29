<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create"/>
    </template>
    <template #content>
      <TemplateEngineBlock  @instantiate="handleInstantiate" :getTemplateService="getTemplate" :postTemplateService="instantiateTemplate" :templateId="uuid" />
    </template>
  </ContentBlock>
</template>
  <script>
    import TemplateEngineBlock from '@/templates/template-engine-block'
    import ContentBlock from '@/templates/content-block'
    import PageHeadingBlock from '@/templates/page-heading-block'
    import {getTemplate, instantiateTemplate} from '@/services/template-engine-services'
    export default {
      name: 'CreateNew',
      components: {
        TemplateEngineBlock,
        ContentBlock,
        PageHeadingBlock
      },
      async created() {
        //
      },
      methods: {
        handleInstantiate(element) {
          console.log(element)
        }
      },
      data: () => ({
        uuid: '9cd54b7d-666a-4e45-8097-47ae1fb70014',
        getTemplate,
        instantiateTemplate
      }),
    }
  </script>
