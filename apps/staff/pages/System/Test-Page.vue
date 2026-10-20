<template>
  <div>
    <h2>Single-use or Manual Functions</h2>
    <v-row>
      <label 
        class="upload-btn v-btn v-btn--variant-elevated v-theme--light text-none mr-2"
        :class="{ 'v-btn--disabled': ui.view2Show.isBusy }"
        :style="{ pointerEvents: ui.view2Show.isBusy ? 'none' : 'auto' }"
      >
        {{ ui.view2Show.isBusy ? 'Uploading...' : 'Import Misc' }}
        
        <input
          type="file"
          :disabled="ui.view2Show.isBusy"
          accept=".xls,.xlsx, image/*, application/pdf"
          @change=""
        />
      </label>

      <label 
        class="upload-btn v-btn v-btn--variant-elevated v-theme--light text-none mr-2"
        :class="{ 'v-btn--disabled': ui.view2Show.isBusy }"
        :style="{ pointerEvents: ui.view2Show.isBusy ? 'none' : 'auto' }"
      >
        {{ ui.view2Show.isBusy ? 'Uploading...' : 'Import Subjects' }}
        
        <input
          type="file"
          :disabled="ui.view2Show.isBusy"
          accept=".xls,.xlsx, image/*, application/pdf"
          @change=""
        />
      </label>
    </v-row>
    <v-row>
      <v-btn class="text-none mr-2" type="submit" color="primary" :disabled="ui.view2Show.isBusy" :loading="ui.view2Show.isBusy" 
          @click="">
          Do smth Once
      </v-btn>
      <v-btn class="text-none mr-2" type="submit" color="primary" :disabled="ui.view2Show.isBusy" :loading="ui.view2Show.isBusy" 
          @click="">
          Test refresh deploy vercel
      </v-btn>
      
    </v-row>
  </div>

  <div class ="mt-16">
    <h2>Test Area</h2>
    <label 
      class="upload-btn v-btn v-btn--variant-elevated v-theme--light text-none"
      :class="{ 'v-btn--disabled': ui.view2Show.isBusy }"
      :style="{ pointerEvents: ui.view2Show.isBusy ? 'none' : 'auto' }"
    >
     
      {{ ui.view2Show.isBusy ? 'Uploading...' : 'Test File Upload' }}
      
      <input
        type="file"
        :disabled="ui.view2Show.isBusy"
        accept=".xls,.xlsx, image/*, application/pdf"
        @change="onFileChange_TestUpload"
      />
    </label>
  </div>

</template>

<script setup lang="ts">
definePageMeta({
  title: 'Test Page',
})

//const { user } = useUserStore()
const { snackbar, ui, user } = useAppStores()

const objUploadRqst = ref({
  folderID: user.domainInfo?.folderId.REG,
  results: [],
})

const onFileChange_TestUpload = async (event: any) => {
  const file = event.target.files?.[0]
  if (!file) return
 
  await Client_UploadToGoogleDrive(file, objUploadRqst.value.folderID, 'Test_by_' + (user.email ? user.email.split('@')[0] : 'unknown'))
  snackbar.trigger({message: `File "${file.name}" uploaded successfully!`, color: 'success'})  
  
}

</script>

<style scoped>
.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0 16px;
  height: 36px;
  border-radius: 4px;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  box-shadow: var(--v-shadow-2);
}
.upload-btn input[type="file"] {
  display: none;
}
</style>
