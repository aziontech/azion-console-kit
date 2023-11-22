
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
        uuid: '34d68c80-5d3e-438b-ba5c-ea1e5bc96849',
        getLogs
      }),
    }
  </script>
  
