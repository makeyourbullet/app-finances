<template>
  <v-app-bar color="primary" app>
    <v-container class="pa-0 d-flex align-center" fluid>
      <!-- Titre à gauche -->
      <v-app-bar-title class="mr-4">Mes finances</v-app-bar-title>

      <!-- Navigation au centre -->
      <div class="d-flex align-center flex-wrap">
        <v-btn to="/dashboard" variant="text" class="px-2">Dashboard</v-btn>
        <v-btn to="/epargnes" variant="text" class="px-2">Épargnes</v-btn>
        <v-btn to="/projets" variant="text" class="px-2">Projets</v-btn>
        <v-btn to="/flux" variant="text" class="px-2">Flux</v-btn>
      </div>

      <!-- Menu paramètres à droite -->
      <v-spacer></v-spacer>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-cog</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/comptes">
            <v-list-item-title>Comptes</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout" class="logout-item">
            <v-list-item-title>Déconnexion</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

const client = useSupabaseClient()
const router = useRouter()

const logout = async () => {
  await client.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.logout-item {
  color: #e53935;
}
</style> 