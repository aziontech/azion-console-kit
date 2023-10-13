<template>
  <div class="p-4 w-full">
    <div class="max-w-screen-sm lg:max-w-7xl mx-auto gap-4">
      <h1 class="text-4xl self-center font-normal text-gray-600">Home</h1>
      <!-- SelectButton Custom -->
      <div class="flex my-2 mx-auto">
        <SelectButton
          v-model="value"
          :options="options"
          aria-labelledby="basic"
        />
      </div>
      <!-- TabView Custom -->
      <div class="flex my-2 mx-auto">
        <TabView
          :scrollable="true"
          class="w-full"
        >
          <TabPanel header="Main Settings">
            <div class="p-4">
              <p>Tab 1</p>
            </div>
          </TabPanel>
          <TabPanel header="Origins">
            <div class="p-4">
              <p>Tab 2</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
          <TabPanel header="Rules Engine">
            <div class="p-4">
              <p>Tab 3</p>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </div>
</template>

<script>
  import SelectButton from 'primevue/selectbutton'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'

  // Export my assets and components
  export default {
    components: {
      SelectButton,
      TabView,
      TabPanel
    },
    data() {
      return {
        value: 'All phases',
        options: ['All phases', 'Request', 'Response']
      }
    }
  }
</script>
