<template>
  <v-card style="padding:20px;">
    <v-card-title class="text-center w-100">Épargnes</v-card-title>
    <v-card-text>
      <!-- Graphique à barres des mouvements variables épargne et leur montant -->
      <div class="mb-4">
        <BarChartEpargnes :labels="labelsEpargne" :data="dataEpargne" />
      </div>
      <v-form @submit.prevent="onSubmitVirement" ref="virementForm">
        <v-row >
          <v-col style="padding-bottom:0;" cols="12" sm="6">
            <v-select
              v-model="virement.source"
              :items="mouvementsVariablesEpargne"
              item-title="nom"
              item-value="id"
              label="Source (épargne)"
              :rules="[v => !!v || 'Source requise']"
              required
              variant="outlined"
            ></v-select>
          </v-col>
          <v-col style="padding-bottom:0;" cols="12" sm="6">
            <v-select
              v-model="virement.cible"
              :items="recepteursVirementSorted"
              item-title="nom"
              item-value="id"
              label="Récepteur"
              :rules="[v => !!v || 'Récepteur requis']"
              required
              variant="outlined"
            ></v-select>
          </v-col>
          <v-col style="padding-top:0;" cols="12">
            <v-text-field
              v-model="virement.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || 'Montant requis',
                v => v > 0 || 'Le montant doit être positif',
                v => v <= montantDisponibleSource || 'Montant supérieur au disponible'
              ]"
              required
              variant="outlined"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-btn class="btn-principal" block type="submit" :loading="loadingVirement" color="primary">Valider le virement 👉</v-btn>
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
                <v-btn class="btn-danger" icon="mdi-delete" size="small" variant="text" @click="supprimerVirement(v)" color="error"></v-btn>
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
import { toRefs, ref, watch, onMounted, computed } from 'vue'
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

// Liste des récepteurs avec Compte Perso et Compte Pro en premier
const recepteursVirementSorted = computed(() => {
  const comptes = [
    { id: 'compte_perso', nom: 'Compte Perso' },
    { id: 'compte_pro', nom: 'Compte Pro' }
  ]
  // Filtrer les mouvements pour ne pas dupliquer Compte Perso/Pro si déjà dans la liste
  const autres = (recepteursVirement.value || []).filter(r => r.id !== 'compte_perso' && r.id !== 'compte_pro')
  return [...comptes, ...autres]
})

const labelsEpargne = ref([])
const dataEpargne = ref([])

// Ajout : montant disponible sur la source sélectionnée
const montantDisponibleSource = ref(0)

watch(() => virement.value.source, async (newSource) => {
  if (newSource) {
    montantDisponibleSource.value = await getMontantTotalMouvementVariableDashboard.value(newSource)
  } else {
    montantDisponibleSource.value = 0
  }
}, { immediate: true })

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

const virementForm = ref(null)

async function onSubmitVirement() {
  const { valid } = await virementForm.value.validate()
  if (!valid) return
  validerVirement.value()
}
</script>
<style scoped>
/* Supprimer le padding-bottom des champs v-select dans le formulaire virement */
.v-col .v-select {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
/* Supprimer le margin et padding de la ligne contenant les champs source et récepteur */
.no-mb-row {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
/* Forcer les labels à aller à la ligne si besoin */
.v-label {
  white-space: pre-line !important;
  width: 100% !important;
  text-align: left;
}
/* Pour les en-têtes de tableau (labels penchés) */
.v-table__th, .v-data-table__th {
  transform: none !important;
  white-space: normal !important;
  text-align: left !important;
  vertical-align: bottom !important;
  line-height: 1.2;
  padding-bottom: 8px;
  max-width: 120px;
  word-break: break-word;
}
/* Pour forcer les labels d'en-tête de tableau à être horizontaux, même en cas de style inline ou descendant */
.v-table__th,
.v-table__th *,
.v-table__th[style*="rotate"],
.v-table__th *[style*="rotate"] {
  transform: none !important;
  rotate: none !important;
  writing-mode: initial !important;
  white-space: normal !important;
  text-align: left !important;
  vertical-align: bottom !important;
  line-height: 1.2;
  padding-bottom: 8px;
  max-width: 120px;
  word-break: break-word;
}
</style> 