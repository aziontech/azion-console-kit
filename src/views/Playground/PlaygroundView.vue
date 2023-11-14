
<template>
  <form class="my-8">
    <form-horizontal
      title="Title Section"
      description="Description"
    >
      <template #inputs>
        
       // Components Full

       <!-- MultiSelect start -->
       <div class="flex flex-col w-full sm:max-w-3xl gap-2">
         <label
           for="select-01"
           class="text-color text-base font-medium"
           >Label</label
         >
         <MultiSelect
           id="select-01"
           v-model="selectedCities"
           :options="cities"
           optionLabel="name"
           placeholder="Select"
           :maxSelectedLabels="3"
           display="chip"
         />
 
         <div class="text-color-secondary text-sm font-normal">Helper Text</div>
       </div>
       <!-- MultiSelect end -->
 
       <!-- Switch start -->
       <Card
         :pt="{
           body: { class: 'p-4' },
           title: { class: 'flex justify-between items-center text-base font-medium m-0' },
           subtitle: { class: 'text-sm font-normal text-color-secondary m-0' }
         }"
       >
         <template #title>
           <span class="text-base">Label</span>
           <InputSwitch />
         </template>
         <template #subtitle> Description </template>
       </Card>
       <!-- Switch end -->
 
       <!-- Switch Group start -->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <div class="flex flex-col gap-3">
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between items-center text-base font-medium m-0' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
             }"
           >
             <template #title>
               <span class="text-base">Tittle Switch</span>
               <InputSwitch />
             </template>
             <template #subtitle> Description </template>
           </Card>
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between items-center text-base font-medium m-0' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
             }"
           >
             <template #title>
               <span class="text-base">Tittle Switch</span>
               <InputSwitch />
             </template>
             <template #subtitle> Description </template>
           </Card>
         </div>
       </div>
       <!-- Switch Group end -->
 
       <!-- Switch without box start -->
       <Card
         :pt="{
           root: { class: 'shadow-none  rounded-none' },
           body: { class: 'py-4 border-0' },
           title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
           subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
         }"
       >
         <template #title>
           <InputSwitch />
           <div class="flex-col gap-1">
             <div class="">
               <div class="text-color text-sm font-normal">Label</div>
             </div>
             <div class="self-stretch text-color-secondary text-sm font-normal">Description</div>
           </div>
         </template>
       </Card>
       <!-- Switch without box start -->
 
       <!-- Switch without box Group start -->
       <div class="flex flex-col gap-2">
         <label
           for="city"
           class="text-color text-base font-medium"
           >Label Group</label
         >
         <div class="flex flex-col gap-3">
           <Card
             :pt="{
               root: { class: 'shadow-none border-b rounded-none surface-border' },
               body: { class: 'py-4 border-0' },
               title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
             }"
           >
             <template #title>
               <InputSwitch />
               <div class="flex-col gap-1">
                 <div class="">
                   <div class="text-color text-sm font-normal">Label</div>
                 </div>
                 <div class="self-stretch text-color-secondary text-sm font-normal">Description</div>
               </div>
             </template>
           </Card>
 
           <Card
             :pt="{
               root: { class: 'shadow-none border-b rounded-none surface-border' },
               body: { class: 'py-4 border-0' },
               title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
             }"
           >
             <template #title>
               <InputSwitch />
               <div class="flex-col gap-1">
                 <div class="">
                   <div class="text-color text-sm font-normal">Label</div>
                 </div>
                 <div class="self-stretch text-color-secondary text-sm font-normal">Description</div>
               </div>
             </template>
           </Card>
         </div>
       </div>
       <!-- Switch without box Group end -->
 
       <!-- Radio Group start -->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <div class="flex flex-col gap-3">
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
             }"
           >
             <template #title>
               <span class="text-base">Sample Title Radio Card</span>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label08"
               />
             </template>
             <template #subtitle> Sample Subtitle Radio Card </template>
           </Card>
 
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
             }"
           >
             <template #title>
               <span class="text-base">Sample Title Radio Card</span>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label07"
               />
             </template>
             <template #subtitle> Sample Subtitle Radio Card </template>
           </Card>
         </div>
       </div>
       <!-- Radio Group end -->
 
       <!-- Radio Group card start -->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <!-- fisrt input -->
         <div class="flex flex-col gap-3">
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0' },
               content: { class: 'text-color-secondary text-sm font-normal my-3 pr-0 md:pr-[2.5rem]' },
               footer: { class: 'flex gap-3' }
             }"
           >
             <template #title>
               <span class="text-base">Sample Title Radio Card</span>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label05"
               />
             </template>
             <template #subtitle> Sample Subtitle Radio Card </template>
 
             <template #content>
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui.
               Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt
               eget. Sed id lorem nunc. Class aptentti.
             </template>
             <template #footer>
               <Tag
                 icon="pi pi-calculator"
                 severity="secondary"
                 value="Sum"
               ></Tag>
               <Tag
                 severity="secondary"
                 value="0%"
               ></Tag>
             </template>
           </Card>
 
           <!-- second input -->
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between text-base m-0 font-medium' },
               subtitle: { class: 'text-sm font-normal text-color-secondary m-0' },
               content: { class: 'text-color-secondary text-sm font-normal my-3 pr-0 md:pr-[2.5rem]' },
               footer: { class: 'flex gap-3' }
             }"
           >
             <template #title>
               <span class="text-base">Sample Title Radio Card</span>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label04"
               />
             </template>
             <template #subtitle> Sample Subtitle Radio Card </template>
 
             <template #content>
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui.
               Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt
               eget. Sed id lorem nunc. Class aptentti.
             </template>
             <template #footer>
               <Tag
                 icon="pi pi-calculator"
                 severity="secondary"
                 value="Sum"
               ></Tag>
               <Tag
                 severity="secondary"
                 value="0%"
               ></Tag>
             </template>
           </Card>
         </div>
       </div>
       <!-- Radio Group card end -->
 
       <!-- Radio Group card with image start-->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <div class="flex flex-col gap-3">
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               content: { class: 'text-color-secondary text-sm font-normal my-3 pr-0 md:pr-[2.5rem]' },
               footer: { class: 'flex gap-3' }
             }"
           >
             <template #title>
               <div class="flex gap-3">
                 <div class="w-12 h-12">
                   <img
                     class="w-full"
                     src="../../assets/Icon.png"
                     alt=""
                   />
                 </div>
                 <div class="flex-col gap-1 flex">
                   <span>Sample Title Radio Card</span>
                   <span class="text-sm font-normal text-color-secondary m-0">
                     Sample Subtitle Radio Card
                   </span>
                 </div>
               </div>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label03"
               />
             </template>
 
             <template #content>
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui.
               Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt
               eget. Sed id lorem nunc. Class aptentti.
             </template>
             <template #footer>
               <Tag
                 icon="pi pi-calculator"
                 severity="secondary"
                 value="Sum"
               ></Tag>
               <Tag
                 severity="secondary"
                 value="0%"
               ></Tag>
             </template>
           </Card>
 
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               content: { class: 'text-color-secondary text-sm font-normal my-3 pr-0 md:pr-[2.5rem]' },
               footer: { class: 'flex gap-3' }
             }"
           >
             <template #title>
               <div class="flex gap-3">
                 <div class="w-12 h-12">
                   <img
                     class="w-full"
                     src="../../assets/Icon.png"
                     alt=""
                   />
                 </div>
                 <div class="flex-col gap-1 flex">
                   <span>Sample Title Radio Card</span>
                   <span class="text-sm font-normal text-color-secondary m-0">
                     Sample Subtitle Radio Card
                   </span>
                 </div>
               </div>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label02"
               />
             </template>
 
             <template #content>
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui.
               Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt
               eget. Sed id lorem nunc. Class aptentti.
             </template>
             <template #footer>
               <Tag
                 icon="pi pi-calculator"
                 severity="secondary"
                 value="Sum"
               ></Tag>
               <Tag
                 severity="secondary"
                 value="0%"
               ></Tag>
             </template>
           </Card>
         </div>
       </div>
       <!-- Radio Group card with image end-->
 
       <!-- Radio Group card with avatar start-->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <div class="flex flex-col gap-3">
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               content: { class: 'text-color-secondary text-sm font-normal my-3 pr-0 md:pr-[2.5rem]' },
               footer: { class: 'flex gap-3' }
             }"
           >
             <template #title>
               <div class="flex gap-3">
                 <Avatar
                   label="P"
                   size="large"
                 />
                 <div class="flex-col gap-1 flex">
                   <span>Sample Title Radio Card</span>
                   <span class="text-sm font-normal text-color-secondary m-0">
                     Sample Subtitle Radio Card
                   </span>
                 </div>
               </div>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label03"
               />
             </template>
 
             <template #content>
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui.
               Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt
               eget. Sed id lorem nunc. Class aptentti.
             </template>
             <template #footer>
               <Tag
                 icon="pi pi-calculator"
                 severity="secondary"
                 value="Sum"
               ></Tag>
               <Tag
                 severity="secondary"
                 value="0%"
               ></Tag>
             </template>
           </Card>
 
           <Card
             :pt="{
               body: { class: 'p-4' },
               title: { class: 'flex justify-between  text-base m-0 font-medium' },
               content: { class: 'text-color-secondary text-sm font-normal my-3 pr-0 md:pr-[2.5rem]' },
               footer: { class: 'flex gap-3' }
             }"
           >
             <template #title>
               <div class="flex gap-3">
                 <Avatar
                   label="P"
                   size="large"
                 />
                 <div class="flex-col gap-1 flex">
                   <span>Sample Title Radio Card</span>
                   <span class="text-sm font-normal text-color-secondary m-0">
                     Sample Subtitle Radio Card
                   </span>
                 </div>
               </div>
               <RadioButton
                 inputId="label"
                 name="label"
                 value="label02"
               />
             </template>
 
             <template #content>
               Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui.
               Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt
               eget. Sed id lorem nunc. Class aptentti.
             </template>
             <template #footer>
               <Tag
                 icon="pi pi-calculator"
                 severity="secondary"
                 value="Sum"
               ></Tag>
               <Tag
                 severity="secondary"
                 value="0%"
               ></Tag>
             </template>
           </Card>
         </div>
       </div>
       <!-- Radio Group card with avatar end-->
 
       <!-- Radio Group simple start-->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <div class="flex flex-col gap-4">
           <div class="flex gap-2 items-center">
             <RadioButton
               inputId="label"
               name="label"
               value="label01"
             />
             <label
               for="label"
               class="text-color text-sm font-normal"
               >Label</label
             >
           </div>
           <div class="flex gap-2 items-center">
             <RadioButton
               inputId="label"
               name="label"
               value="label01"
             />
             <label
               for="label"
               class="text-color text-sm font-normal"
               >Label</label
             >
           </div>
         </div>
       </div>
       <!-- Radio Group simple end-->
 
       <!-- Radio Group simple start-->
       <div class="flex flex-col gap-2">
         <label class="text-color text-base font-medium">Label Group</label>
         <div class="flex flex-col gap-4">
           <div class="flex gap-2 items-center">
             <Checkbox
               inputId="label"
               name="label"
               value="label01"
             />
             <label
               for="label"
               class="text-color text-sm font-normal"
               >Label</label
             >
           </div>
           <div class="flex gap-2 items-center">
             <Checkbox
               inputId="label"
               name="label"
               value="label01"
             />
             <label
               for="label"
               class="text-color text-sm font-normal"
               >Label</label
             >
           </div>
         </div>
       </div>
       <!-- Radio Group simple end-->

      // Components Big

      <!-- input text simple with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Label</label
        >
        <InputText
          type="text"
          id="name"
          placeholder="Name"
          v-model="value"
        />

        <div class="text-color-secondary text-sm font-normal">Helper Text </div>
      </div>

      <!-- input text simple with helper text end -->

      <!-- input textarea simple with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <Textarea
          v-model="value"
          autoResize
          rows="2"
          cols="30"
        />

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
      <!-- input textarea simple with helper text end -->

      <!-- input group simple with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <span class="p-inputgroup-addon">www</span>
          <InputText placeholder="" />
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>

      <!-- input group simple with helper text end -->

      <!-- input group double with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <span class="p-inputgroup-addon">http://</span>
          <span class="p-inputgroup-addon">www</span>
          <InputText />
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
      <!-- input group double with helper text end -->

      <!-- input group simple with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <InputText placeholder="" />
          <span class="p-inputgroup-addon">.com</span>
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
      <!-- input group simple with helper text end -->

      <!-- iinput group double with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <InputText placeholder="" />
          <span class="p-inputgroup-addon">.com</span>
          <span class="p-inputgroup-addon">.br</span>
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
      <!-- iinput group double with helper text end -->

      <!-- iinput group double with helper text start -->
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium "
          >Label</label
        >
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon">http://</span>
          <span class="p-inputgroup-addon">www</span>
          <InputText />
          <span class="p-inputgroup-addon">.com</span>
          <span class="p-inputgroup-addon">.br</span>
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>

      <!-- iinput group double with helper text end -->
      
      // Components Medium


      <!-- input group simple with helper text start -->
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <span class="p-inputgroup-addon">www</span>
          <InputText placeholder="" />
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
       <!-- input group simple with helper text end -->

       <!-- input group double with helper text start -->
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup ">
          <span class="p-inputgroup-addon">http://</span>
          <span class="p-inputgroup-addon">www</span>
          <InputText />
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>

       <!-- input group double with helper text end -->

       <!-- input group simple with helper text start -->
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <InputText placeholder="" />
          <span class="p-inputgroup-addon">.com</span>
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
      <!-- input group simple with helper text end -->

      <!-- input group double with helper text start -->
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >
        <div class="p-inputgroup flex-1">
          <InputText placeholder="" />
          <span class="p-inputgroup-addon">.com</span>
          <span class="p-inputgroup-addon">.br</span>
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text </div>
      </div>
      <!-- input group double with helper text end -->

      <!-- input group double with helper text start -->
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <label
          for="id"
          class="text-color text-base font-medium "
          >Label</label
        >
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon">http://</span>
          <span class="p-inputgroup-addon">www</span>
          <InputText />
          <span class="p-inputgroup-addon">.com</span>
          <span class="p-inputgroup-addon">.br</span>
        </div>

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>
      <!-- input group double with helper text end -->

      // Components Small

      <!-- Dropdown start -->
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="id"
          class="text-color text-base font-medium "
          >Label</label
        >
        <Dropdown
          v-model="selectedCity"
          :options="cities"
          optionLabel="name"
          placeholder="Select a City"
        />

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>

       <!-- Dropdown end -->
       <!-- Input Number start -->
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >

        <InputNumber
          showButtons
        />

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>

      <!-- Input Number end -->

      <!-- Calendar start -->
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="id"
          class="text-color text-base font-medium"
          >Label</label
        >

        <Calendar
          v-model="date"
          showIcon
        />

        <div class="text-color-secondary text-sm font-normal">Helper Text</div>
      </div>

      <!-- Calendar end -->

      </template>
    </form-horizontal>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import formHorizontal from '@/templates/create-form-block-new/form-horizontal'



const value = ref(null);
const selectedCities = ref();
const cities = ref([
  { name: 'New York', code: 'NY' },
  { name: 'Rome', code: 'RM' },
  { name: 'London', code: 'LDN' },
  { name: 'Istanbul', code: 'IST' },
  { name: 'Paris', code: 'PRS' },
]);

</script>
