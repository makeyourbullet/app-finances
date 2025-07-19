<template>
  <v-app>
    <Navigation />
    <v-main>
      <div class="main-container">
        <v-container fluid style="margin-top: 24px;">
          <v-row>
            <!-- Colonne d'icônes -->
            <v-col md="1">
              <IconSidebar />
            </v-col>
            <v-col md="11">
              <slot />
            </v-col>
          </v-row>
        </v-container>
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
<style>
.v-card {
  border-radius: 30px !important;
}
/* Appliquer la police Jua uniquement aux titres d'encarts */
.v-card-title, .dashboard-title {
  font-family: 'Lobster Two', cursive;
  font-size: 2.2em;
  color: #f43662;
  font-weight: 700;
  margin-top: 10px;
}
/* Style personnalisé pour les lignes de séparation des tableaux */
div[style*="border-top"] {
  border-top: 3px dotted #f43662 !important;
}
/* Style pour les lignes à l'intérieur des tableaux Vuetify */
.v-table tbody tr {
  border-bottom: 2px dotted #f43662 !important;
}
.v-table thead tr {
  border-bottom: 2px solid #f43662 !important;
}
</style> 