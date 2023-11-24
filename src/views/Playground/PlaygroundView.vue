
<template>
  <div class="p-5">
    <ScriptRunnerBlock
      title="Build"
      :executionId="uuid"
      :scriptRunnerService="getLogs"></ScriptRunnerBlock>
      
  </div>
</template>
  <script>
    import ScriptRunnerBlock from '@/templates/script-runner-block'
    import {getLogs} from '@/services/script-runner-service'
    export default {
      name: 'script-runner-test-block',
      components: {
        ScriptRunnerBlock
      },
      async created() {
        //
      },
      data: () => ({
        uuid: 'f7f7cea5-ad9d-4432-aec0-f31ce4102dda',
        getLogs
      }),
    }
  </script>
  
