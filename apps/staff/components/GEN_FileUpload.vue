<template>
  <div class="border rounded mt-n4 pb-2" width="100%">
    <v-row class="mt-1 ml-1" >
        <v-col sm="12" md="9" lg="9">
            <label
                class="upload-btn v-btn v-btn--variant-elevated v-theme--light text-none"
                :class="{ 'is-disabled': uiStore.view2Show.isBusy }"
                style="position: relative; display: inline-flex; align-items: center;"
            >
                <!-- Spinner when busy -->
                <v-progress-circular
                    v-if="uiStore.view2Show.isBusy"
                    indeterminate
                    size="18"
                    width="2"
                    class="mr-2"
                />

                <!-- Icon when not busy -->
                <v-icon v-else class="mr-2">mdi-paperclip</v-icon>

                Chứng từ đính kèm

                <!-- Invisible file input -->
                <input
                    type="file"
                    accept="image/*, application/pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    @change="HandleFile"
                    :disabled="uiStore.view2Show.isBusy"
                    style="
                        position: absolute;
                        inset: 0;
                        opacity: 0;
                        cursor: pointer;
                    "
                />
            </label>
        </v-col>

        <v-col sm="12" md="3" lg="3">
            <v-checkbox variant="outlined" density="compact" class="mt-n3" color="red text-grey" 
                v-model="objUploadRqst.NoAttachement" v-show="showChkBox" @update:model-value="objUploadRqst.results=[]; responses=[]">
                <template v-slot:label>
                    <span style="font-size: 12px" >Không cần đính kèm chứng từ</span>
                </template>                
            </v-checkbox>
        </v-col>

    </v-row>
    <div v-show="responses.length>0" class="mt-4 text-green-700" v-for="rs in responses" :key="rs.fileUrl">
      ✅ Uploaded: <a :href="rs.fileUrl" target="_blank" class="underline">{{ rs.fileName }}</a>
    </div>
  </div>
</template>

<script>
    import { useSnackbarStore, useUIStore } from '#core/stores/ui.js'
    import imageCompression from 'browser-image-compression';
    export default {
        props: {
            // Add prop to receive expense data for editing
            objUploadRqst: {
                type: Object,
                default: null
            },
            showChkBox:{
                type: Boolean,
                default: true
            },
        },        
        created() {
            this.snackbar = useSnackbarStore()
            this.uiStore = useUIStore()
        },
        data() {
            return {
                snackbar: null,
                uiStore: null,
                files: [],
                responses: []
            }
        },
        methods:{
            async HandleFile (event){
                this.files = Array.from(event.target.files)
                this.responses = []
                //if (!this.file) return
                this.uiStore.view2Show.isBusy = true
                try {
                    for (const file of this.files) {
                        const reducedFile = await this.ResizeFile (file)
                        const res = await Client_UploadToGoogleDrive(reducedFile, this.objUploadRqst.folderID)
                        this.responses.push(res)
                    }                
                    // update thong tin duong dan vao bang luon.... ten bang la evidence, ten bang goc va recID lay tu objectRqst
                } catch (err) {
                    this.snackbar.trigger({message: err.message, color: 'warning'})
                } finally {
                    this.uiStore.view2Show.isBusy = false
                    this.objUploadRqst.results = this.responses
                }
            },

            async ResizeFile(File) {
                if (!File.type.startsWith('image/')) {
                    return File
                }
                const options = {
                    maxSizeMB: 0.5,           // Target size in MB (e.g., 1MB)
                    maxWidthOrHeight: 1024, // Max width/height to resize the image to
                    useWebWorker: true,     // Use a Web Worker for better performance
                };

                try {
                    const compressedFile = await imageCompression(File, options);
                    return compressedFile
                } catch (error) {
                    console.error('Compression failed:', error);
                }
            },            
        }
        
    }
</script>

<style scoped>
    .upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    cursor: pointer;

    /* match v-btn padding + radius */
    padding: 0 16px;
    height: 36px; /* default v-btn height */
    border-radius: 4px;

    /* match primary color button */
    background-color: rgb(var(--v-theme-primary));
    color: white;

    /* optional: add slight shadow like v-btn */
    box-shadow: var(--v-shadow-2);
    }

    /* hide real input */
    .upload-btn input[type="file"] {
    display: none;
    }

    .is-disabled {
    opacity: 0.5;             /* fade the button look */
    cursor: not-allowed;      /* disabled cursor */
    pointer-events: none;     /* fully block clicks */
    transition: opacity 0.3s ease;
    }
</style>