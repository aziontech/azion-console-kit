<template>
  <div>
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
        uuid: 'd21b6434-4595-4ef5-9795-2fca0565b6d3',
        getLogs
      }),
      props: {
       //
      },
      methods: {
        //

      }
    }
  </script>
  