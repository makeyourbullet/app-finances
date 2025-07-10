<template>
  <v-btn
    icon
    size="large"
    variant="tonal"
    :color="color"
    @click.stop="$emit('delete')"
  >
    <v-icon>mdi-delete</v-icon>
  </v-btn>
</template>

<script setup>
defineProps({
  color: {
    type: String,
    default: 'error'
  }
})

defineEmits(['delete'])
</script> 