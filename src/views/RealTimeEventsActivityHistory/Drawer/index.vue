<script setup>
  import { ref, onMounted } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-image-processor' })

  defineProps({
    loadDetails: Function
  })

  const getCurrentDate = () => {
    const date = new Date()
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleString('en-US', options)
  }

  const showDrawer = ref(true)

  const loadMockedDetails = () => {
    const mockValues = {
      title: 'Pathorigin Default Origin was changed',
      date: getCurrentDate(),
      account: 'Account Name Lorem Ipsum',
      userName: 'user.name@azion.com',
      id: '0000',
      comment: 'Ação realizada durante investigação.',
      clientId: '0000a'
    }

    return mockValues
  }

  const details = ref({})
  onMounted(() => {
    details.value = loadMockedDetails()
  })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="showDrawer"
    title="More Details"
  >
    <template #body>
      <div class="flex flex-col gap-3 md:m-3">
        <InfoSection
          :title="details.title"
          :date="details.date"
          tagText="Changed"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Account">{{ details.account }}</TextInfo>
                <TextInfo label="ID">{{ details.id }}</TextInfo>
                <TextInfo label="Client ID">{{ details.clientId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="User Name">{{ details.userName }}</TextInfo>
                <TextInfo label="Comment">{{ details.comment }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
