<template>
  <v-app>
    <Navigation />
    <v-main>
      <div class="main-container">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import Navigation from '~/components/Navigation.vue'
</script>

<style scoped>
.main-container {
  max-width: 2000px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 24px;
  padding-right: 24px;
  width: 100%;
  box-sizing: border-box;
}
</style> 