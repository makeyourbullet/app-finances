<template>
  <v-card class="mb-4" style="padding-left:7%;padding-right:7%;padding-bottom:7%;">
    <v-card-text>
      <div class="dashboard-title text-center mb-4">{{ moisEnCours }}</div>
      <v-form ref="variablesForm">
        <v-table>
          <tbody>
            <!-- Mouvements variables -->
            <template v-for="mouvement in mouvementsVariables" :key="`mv-${mouvement.id}`">
              <tr>
                <td>{{ mouvement.nom }}</td>
                <td>
                  <v-text-field
                    v-model="montantsMensuels[mouvement.id]"
                    type="text"
                    variant="plain"
                    hide-details
                    class="montant-input text-center"
                    :placeholder="formatAmount(mouvement.montant)"
                    suffix="€"
                  >
                  </v-text-field>
                </td>
              </tr>
            </template>
            <!-- Dépenses projet -->
            <template v-for="depense in depensesProjets" :key="`dp-${depense.id}`">
              <tr>
                <td>{{ depense.description }} ({{ depense.projet.nom_projet }})</td>
                <td>
                  <v-text-field
                    v-model="montantsDepenses[depense.id]"
                    type="text"
                    variant="plain"
                    hide-details
                    class="montant-input text-center"
                    :placeholder="formatAmount(depense.montant)"
                    suffix="€"
                  >
                  </v-text-field>
                </td>
              </tr>
            </template>
          </tbody>
        </v-table>
        <v-btn
          class="btn-principal mt-4"
          block
          color="primary"
          @click="sauvegarderMontants"
          :loading="loading"
        >
          C'est parti 🥳
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { toRefs } from 'vue'
const props = defineProps({
  moisEnCours: String,
  mouvementsVariables: Array,
  montantsMensuels: Object,
  depensesProjets: Array,
  montantsDepenses: Object,
  loading: Boolean,
  sauvegarderMontants: Function,
  formatAmount: Function
})
const {
  moisEnCours,
  mouvementsVariables,
  montantsMensuels,
  depensesProjets,
  montantsDepenses,
  loading,
  sauvegarderMontants,
  formatAmount
} = toRefs(props)
</script> 