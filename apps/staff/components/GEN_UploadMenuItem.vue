<template>
    <label 
        class="upload-btn v-btn v-btn--variant-elevated v-theme--light text-none" 
        :class="{ 'v-btn--disabled': disabled }"
        style="width: 512px; justify-content: flex-start;"
    >
        <v-icon class="mr-2">mdi-upload</v-icon>
        {{ item.label }}
        <input type="file" :accept="item.accept" @change="item.action" :disabled="disabled"/>
    </label>
</template>

<script>
export default {
    props: {
        item: {
            type: Object,
            required: true
        },
        disabled: {
            type: Boolean, // FIXED: Capitalized 'Boolean'
            default: tryUseNuxtApp
        }
    }
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

    /* Style for when the label button is disabled */
    .upload-btn.v-btn--disabled {
        pointer-events: none;
        opacity: 0.6;
    }

    .upload-btn input[type="file"] {
        display: none;
    }
</style>

