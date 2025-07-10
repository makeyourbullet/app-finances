<template>
  <v-btn
    icon
    size="large"
    variant="tonal"
    :color="color"
    class="mr-1"
    @click.stop="$emit('edit')"
  >
    <v-icon>mdi-pencil</v-icon>
  </v-btn>
</template>

<script setup>
defineProps({
  color: {
    type: String,
    default: 'error'
  }
})

defineEmits(['edit'])
</script> 