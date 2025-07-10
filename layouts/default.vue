<template>
  <v-app>
    <Navigation />
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup>
import Navigation from '~/components/Navigation.vue'
</script> 