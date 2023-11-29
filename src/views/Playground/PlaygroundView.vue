<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create"/>
    </template>
    <template #content>
      <TemplateEngineBlock  :getTemplateService="getTemplate" :postTemplateService="instantiateTemplate" :templateId="uuid" />
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
      data: () => ({
        uuid: 'xx',
        getTemplate,
        instantiateTemplate
      }),
    }
  </script>
