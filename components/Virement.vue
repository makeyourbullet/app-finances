<template>
  <v-card>
    <v-card-title>Virement</v-card-title>
    <v-card-text>
      <!-- Graphique à barres des mouvements variables épargne et leur montant -->
      <div class="mb-4">
        <div class="text-subtitle-1">Épargne disponible par mouvement</div>
        <BarChartEpargnes :labels="labelsEpargne" :data="dataEpargne" />
      </div>
      <v-form @submit.prevent="validerVirement" ref="virementForm">
        <v-row>
          <v-col cols="12" sm="6">
            <v-select
              v-model="virement.source"
              :items="mouvementsVariablesEpargne"
              item-title="nom"
              item-value="id"
              label="Source (épargne)"
              :rules="[v => !!v || 'Source requise']"
              required
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="virement.cible"
              :items="recepteursVirement"
              item-title="nom"
              item-value="id"
              label="Récepteur"
              :rules="[v => !!v || 'Récepteur requis']"
              required
            ></v-select>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="virement.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || 'Montant requis',
                v => v > 0 || 'Le montant doit être positif',
                v => v <= (getMontantTotalMouvementVariableDashboard(virement.source) || 0) || 'Montant supérieur au disponible'
              ]"
              required
            ></v-text-field>
          </v-col>
        </v-row>
        <v-btn class="btn-principal" block type="submit" :loading="loadingVirement">Valider le virement</v-btn>
      </v-form>
      <!-- Historique des virements du mois en cours -->
      <div class="mt-4">
        <div class="text-subtitle-1 mb-2">Historique des virements du mois en cours</div>
        <v-table v-if="virementsMoisCourant.length">
          <thead>
            <tr>
              <th>Date</th>
              <th>Mouvement</th>
              <th>Source/Cible</th>
              <th class="text-right">Montant</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in virementsMoisCourant" :key="v.id">
              <td>{{ formatDate(v.created_at) }}</td>
              <td>{{ mouvementsVariablesMap[v.mouvement_id] || '-' }}</td>
              <td>{{ v.compte_linked }}</td>
              <td class="text-right">{{ formatAmount(v.montant) }} €</td>
              <td class="text-right">
                <v-btn class="btn-danger" icon="mdi-delete" size="small" variant="text" @click="supprimerVirement(v)"></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div v-else class="text-caption text-grey">Aucun virement ce mois-ci.</div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { toRefs, ref, watch, onMounted } from 'vue'
import BarChartEpargnes from './BarChartEpargnes.vue'
const props = defineProps({
  mouvementsVariablesEpargne: Array,
  virementsMoisCourant: Array,
  virement: Object,
  loadingVirement: Boolean,
  validerVirement: Function,
  supprimerVirement: Function,
  mouvementsVariablesMap: Object,
  recepteursVirement: Array,
  getMontantTotalMouvementVariableDashboard: Function,
  formatAmount: Function,
  formatDate: Function
})
const {
  mouvementsVariablesEpargne,
  virementsMoisCourant,
  virement,
  loadingVirement,
  validerVirement,
  supprimerVirement,
  mouvementsVariablesMap,
  recepteursVirement,
  getMontantTotalMouvementVariableDashboard,
  formatAmount,
  formatDate
} = toRefs(props)

const labelsEpargne = ref([])
const dataEpargne = ref([])

const updateBarChartData = async () => {
  const labels = []
  const data = []
  for (const mv of mouvementsVariablesEpargne.value) {
    labels.push(mv.nom)
    let montant = 0
    if (typeof getMontantTotalMouvementVariableDashboard.value === 'function') {
      montant = await getMontantTotalMouvementVariableDashboard.value(mv.id)
    }
    data.push(montant)
  }
  labelsEpargne.value = labels
  dataEpargne.value = data
}

watch(mouvementsVariablesEpargne, updateBarChartData, { immediate: true })
watch(() => props.loadingVirement, (nv, old) => {
  if (old && !nv) updateBarChartData()
})
onMounted(updateBarChartData)
</script> 