<template>
  <v-container fluid>
    <!-- Première ligne : Variables du mois (33%) et Budget courses + Budget disponible (66%) -->
    <v-row>
      <v-col cols="12" md="4">
        <!-- Variables du mois -->
        <v-card class="mb-4" style="padding-left:7%;padding-right:7%;padding-bottom:7%;">
          <v-card-text>
            <div class="text-h5 text-center mb-4">{{ moisEnCours }}</div>
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
                color="primary"
                block
                class="mt-4"
                @click="sauvegarderMontants"
              >
                C'est parti 🥳
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
        <!-- Dépenses (doughnut) -->
        <v-card elevation="0" color="transparent" rounded="0">
          <v-card-text class="pa-0">
            <DoughnutDepenses
              :totalDepensesProjets="totalProjetsListe"
              :totalDepensesFixes="totalFixesListe"
              :totalDepensesVariables="totalDepensesVariables"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <!-- Budget courses -->
        <v-card style="padding-left:3%;padding-right:3%;padding-bottom:3%;">
          <v-card-title>Courses 🍓</v-card-title>
          <v-card-text>
            <v-row align="stretch" no-gutters>
              <!-- Colonne 1 : demi-cercle progression + budget -->
              <v-col cols="12" md="4" class="d-flex flex-column align-center justify-center">
                <JaugeDemicercle
                  :value="budgetCoursesTotal > 0 ? (totalDepensesCourses / budgetCoursesTotal) * 100 : 0"
                  :max="100"
                  unit="%"
                  bgColor="#e0e0e0"
                  progressColor="#1976d2"
                  style="width:70%;"
                />
                <div class="text-center mt-2">
                  <span style="font-size:2em;font-weight:bold;">{{ formatAmount(totalDepensesCourses) }} €</span>
                  <span style="font-size:1.2em;color:#888;"> / {{ formatAmount(budgetCoursesTotal) }} €</span>
                </div>
              </v-col>
              <!-- Colonne 2 : tableau, total, reste, formulaire -->
              <v-col cols="12" md="8" style="padding-left:5%;">
                <v-table class="mt-0">
                  <tbody>
                    <tr v-for="depense in depensesCourses" :key="depense.id">
                      <td>{{ formatDate(depense.date) }}</td>
                      <td>{{ depense.description }}</td>
                      <td class="text-right">{{ formatAmount(depense.montant) }} €</td>
                      <td class="text-right">
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          @click="supprimerDepenseCourses(depense.id)"
                        ></v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <div style="border-top:1px solid #e0e0e0;margin:16px 0;"></div>
                <div class="mb-4 text-right">Reste à dépenser : {{ formatAmount(resteBudgetCourses) }} €</div>
                <v-form @submit.prevent="ajouterDepenseCourses" ref="depenseCoursesForm">
                  <div class="d-flex align-center" style="width:100%; gap: 8px;">
                    <v-text-field
                      v-model="nouvelleDepenseCourses.description"
                      label="Description"
                      type="text"
                      density="compact"
                      variant="outlined"
                      :rules="[v => !!v || 'Description requise']"
                      style="flex:1; min-width:0;"
                    ></v-text-field>
                    <v-text-field
                      v-model="nouvelleDepenseCourses.montant"
                      label="Montant"
                      type="text"
                      density="compact"
                      variant="outlined"
                      :rules="[v => !!v || 'Montant requis', v => !isNaN(parseFloat(v.replace(',', '.'))) || 'Montant invalide']"
                      style="flex:1; min-width:0;"
                      suffix="€"
                    ></v-text-field>
                    <v-btn
                      color="primary"
                      type="submit"
                      :loading="loadingDepenseCourses"
                      style="height:40px; align-self:stretch;"
                    >
                      Je valide 💰
                    </v-btn>
                  </div>
                </v-form>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <!-- Budget disponible -->
        <v-card class="mt-4" style="padding-left:3%;padding-right:3%;padding-bottom:3%;">
          <v-card-title>Autre 📈</v-card-title>
          <v-card-text>
            <v-row align="stretch" no-gutters>
              <!-- Colonne 1 : jauge + budget -->
              <v-col cols="12" md="4" class="d-flex flex-column align-center justify-center">
                <JaugeDemicercle
                  :value="budgetDisponibleInitial > 0 ? (totalDepensesPerso / budgetDisponibleInitial) * 100 : 0"
                  :max="100"
                  unit="%"
                  bgColor="#e0e0e0"
                  progressColor="#1976d2"
                  style="width:70%;"
                />
                <div class="text-center mt-2">
                  <span style="font-size:2em;font-weight:bold;">{{ formatAmount(totalDepensesPerso) }} €</span>
                  <span style="font-size:1.2em;color:#888;"> / {{ formatAmount(budgetDisponibleInitial) }} €</span>
                </div>
              </v-col>
              <!-- Colonne 2 : tableau, reste, formulaire -->
              <v-col cols="12" md="8" style="padding-left:5%;">
                <v-table class="mt-0">
                  <tbody>
                    <tr v-for="depense in depensesPerso" :key="depense.id">
                      <td>{{ formatDate(depense.date) }}</td>
                      <td>{{ depense.description }}</td>
                      <td class="text-right">{{ formatAmount(depense.montant) }} €</td>
                      <td class="text-right">
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          @click="supprimerDepensePerso(depense.id)"
                        ></v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <div style="border-top:1px solid #e0e0e0;margin:16px 0;"></div>
                <div class="mb-4 text-right">Reste à dépenser : {{ formatAmount(resteBudgetPerso) }} €</div>
                <v-form @submit.prevent="ajouterDepensePerso" ref="depensePersoForm">
                  <div class="d-flex align-center" style="width:100%; gap: 8px;">
                    <v-text-field
                      v-model="nouvelleDepensePerso.description"
                      label="Description"
                      type="text"
                      density="compact"
                      variant="outlined"
                      :rules="[v => !!v || 'Description requise']"
                      style="flex:1; min-width:0;"
                    ></v-text-field>
                    <v-text-field
                      v-model="nouvelleDepensePerso.montant"
                      label="Montant"
                      type="text"
                      density="compact"
                      variant="outlined"
                      :rules="[v => !!v || 'Montant requis', v => !isNaN(parseFloat(v.replace(',', '.'))) || 'Montant invalide']"
                      style="flex:1; min-width:0;"
                      suffix="€"
                    ></v-text-field>
                    <v-btn
                      color="primary"
                      type="submit"
                      :loading="loadingDepensePerso"
                      style="height:40px; align-self:stretch;"
                    >
                      Je valide 💰
                    </v-btn>
                  </div>
                </v-form>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!-- Deuxième ligne : 3 colonnes de 33% -->
    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <!-- Dépenses -->
        <!-- SUPPRESSION DÉFINITIVE DU DOUGHNUT ICI -->
        <!-- Transactions du mois -->
        <v-card>
          <v-card-title>Transactions du mois</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Compte</th>
                  <th class="text-right">Solde à transférer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in transactionsFiltered" :key="transaction.compte.id">
                  <td>{{ transaction.compte.nom_compte }}</td>
                  <td class="text-right">
                    <div :class="{ 
                      'text-success': transaction.solde > 0,
                      'text-error': transaction.solde < 0
                    }">
                      {{ transaction.message }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <!-- Virement -->
        <v-card>
          <v-card-title>Virement</v-card-title>
          <v-card-text>
            <!-- Liste des mouvements variables épargne et leur montant -->
            <div class="mb-4">
              <div class="text-subtitle-1">Épargne disponible par mouvement</div>
              <BarChartEpargnes :labels="barLabelsEpargne" :data="barDataEpargne" />
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
                    :items="recepteursVirementEtComptes"
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
              <v-btn color="primary" block type="submit" :loading="loadingVirement">Valider le virement</v-btn>
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
                      <v-btn icon="mdi-delete" color="error" size="small" variant="text" @click="supprimerVirement(v)"></v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <div v-else class="text-caption text-grey">Aucun virement ce mois-ci.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <!-- Notes -->
        <v-card class="mb-4">
          <v-card-title>Notes</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="sauvegarderNote" ref="noteForm">
              <v-textarea
                v-model="note"
                label="Écrire une note..."
                rows="4"
                auto-grow
                outlined
                class="mb-2"
              ></v-textarea>
              <v-btn color="primary" type="submit" :loading="loadingNote">Sauvegarder</v-btn>
            </v-form>
            <div v-if="notesList.length > 0" class="mt-4">
              <v-list>
                <v-list-item v-for="n in notesList" :key="n.id" class="align-start">
                  <div class="d-flex flex-column w-100">
                    <div v-if="editNoteId !== n.id">
                      <div style="white-space: pre-line">{{ n.notes }}</div>
                      <div class="text-caption text-grey">{{ formatDate(n.created_at) }}</div>
                    </div>
                    <div v-else>
                      <v-textarea v-model="editNoteContent" rows="2" auto-grow outlined></v-textarea>
                      <v-btn size="small" color="primary" @click="updateNote(n.id)">Enregistrer</v-btn>
                      <v-btn size="small" @click="cancelEditNote">Annuler</v-btn>
                    </div>
                  </div>
                  <template #append>
                    <v-btn icon="mdi-pencil" size="small" variant="text" @click="startEditNote(n)"></v-btn>
                    <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteNote(n.id)"></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
const client = useSupabaseClient()
import JaugeDemicercle from '@/components/JaugeDemicercle.vue'
import VariablesDuMois from '@/components/VariablesDuMois.vue'
import DoughnutDepenses from '@/components/DoughnutDepenses.vue'
import BudgetCourses from '@/components/BudgetCourses.vue'
import BudgetDisponible from '@/components/BudgetDisponible.vue'
import TransactionsMois from '@/components/TransactionsMois.vue'
import Virement from '@/components/Virement.vue'
import Notes from '@/components/Notes.vue'
import BarChartEpargnes from '@/components/BarChartEpargnes.vue'

import { useMouvementsVariables } from '@/composables/useMouvementsVariables.js'
import { useDepensesProjets } from '@/composables/useDepensesProjets.js'
import { useComptesTransactions } from '@/composables/useComptesTransactions.js'
import { useBudgetCourses } from '@/composables/useBudgetCourses.js'
import { useBudgetDisponible } from '@/composables/useBudgetDisponible.js'
import { useVirements } from '@/composables/useVirements.js'
import { useNotes } from '@/composables/useNotes.js'

// Mouvements variables
const {
  loading: loadingMouvementsVariables,
  mouvementsVariables,
  montantsMensuels,
  totalDepensesVariables,
  calculerRecapDepenses,
  loadMouvementsVariables,
  sauvegarderMontants
} = useMouvementsVariables()

// Dépenses projets
const {
  depensesProjets,
  montantsDepenses,
  loadDepensesProjets,
  updateDepenseProjet
} = useDepensesProjets()

// Comptes & transactions
const {
  comptes,
  transactionsMois,
  transactionsFiltered,
  loadComptes,
  calculerTransactionsMois
} = useComptesTransactions()

// Budget courses
const {
  budgetCoursesTotal,
  mouvementCoursesId,
  depensesCourses,
  totalDepensesCourses,
  resteBudgetCourses,
  nouvelleDepenseCourses,
  loadingDepenseCourses,
  depenseCoursesForm,
  loadBudgetCourses,
  loadDepensesCourses,
  ajouterDepenseCourses,
  supprimerDepenseCourses
} = useBudgetCourses()

// Budget disponible
const {
  budgetDisponibleInitial,
  depensesPerso,
  totalDepensesPerso,
  resteBudgetPerso,
  nouvelleDepensePerso,
  loadingDepensePerso,
  depensePersoForm,
  loadBudgetDisponible,
  loadDepensesPerso,
  ajouterDepensePerso,
  supprimerDepensePerso
} = useBudgetDisponible()

// Virements
const {
  mouvementsVariablesEpargne,
  virementsMoisCourant,
  virement,
  loadingVirement,
  recepteursVirement,
  mouvementsVariablesMap,
  loadMouvementsVariablesEpargne,
  loadRecepteursVirement,
  loadVirementsMoisCourant,
  getMontantTotalMouvementVariableDashboard,
  validerVirement,
  supprimerVirement
} = useVirements()

// Notes
const {
  notesList,
  note,
  loadingNote,
  editNoteId,
  editNoteContent,
  loadNotes,
  sauvegarderNote,
  startEditNote,
  cancelEditNote,
  updateNote,
  deleteNote
} = useNotes()

// Liste des mouvements fixes de type dépense
const mouvementsFixesDepense = ref([])
const loadMouvementsFixesDepense = async () => {
  const { data, error } = await client
    .from('mouvements_fixes')
    .select('nom, montant, type')
    .ilike('type', '%dépense%')
  if (!error) mouvementsFixesDepense.value = data || []
}

// Liste des mouvements variables de type dépense du mois courant
const mouvementsVariablesDepense = ref([])
const loadMouvementsVariablesDepense = async () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const { data, error } = await client
    .from('mouvements_variables_mensuels')
    .select('montant, mouvements_variables!inner(nom, type)')
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0])
  if (!error) {
    mouvementsVariablesDepense.value = (data || []).filter(
      m => m.mouvements_variables?.type?.toLowerCase().includes('dépense')
    )
  }
}

// Liste des projets
const projets = ref([])
const loadProjets = async () => {
  const { data, error } = await client
    .from('projets')
    .select('mensualite')
  if (!error) {
    projets.value = data || []
  }
}

// Helpers
const formatAmount = (amount) => {
  if (!amount) return '0'
  return amount.toLocaleString('fr-FR')
}
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Ajout de la variable moisEnCours pour l'affichage du mois en cours
const moisEnCours = new Date().toLocaleDateString('fr-FR', {
  month: 'long',
  year: 'numeric'
}).replace(/^\w/, c => c.toUpperCase())

// Calcul des totaux pour le graphique Doughnut
const totalDepensesProjets = computed(() => depensesProjets.value?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0)
const totalDepensesFixes = ref(0) // À calculer selon ta logique métier
// const totalDepensesVariables = totalDepensesVariables // déjà fourni par useMouvementsVariables

// Orchestration au montage
const totalFixesListe = computed(() =>
  mouvementsFixesDepense.value.reduce((sum, m) => sum + (m.montant || 0), 0)
)

const recepteursVirementEtComptes = computed(() => [
  ...mouvementsVariablesEpargne.value,
  { id: 'compte_pro', nom: 'Compte Pro' },
  { id: 'compte_perso', nom: 'Compte Perso' }
])

const montantsEpargneDisponibles = ref({})

const updateMontantsEpargneDisponibles = async () => {
  const result = {}
  for (const mv of mouvementsVariablesEpargne.value) {
    result[mv.id] = await getMontantTotalMouvementVariableDashboard(mv.id)
  }
  montantsEpargneDisponibles.value = result
}

watch(mouvementsVariablesEpargne, () => {
  updateMontantsEpargneDisponibles()
})

// Rafraîchir dynamiquement les épargnes disponibles après validation d'un virement
watch(loadingVirement, async (nv, old) => {
  if (old && !nv) { // On vient de finir un virement
    await loadMouvementsVariablesEpargne()
    await updateMontantsEpargneDisponibles()
  }
})

onMounted(() => {
  updateMontantsEpargneDisponibles()
})

onMounted(async () => {
  await Promise.all([
    loadProjets(),
    loadMouvementsVariables(),
    loadDepensesProjets(),
    loadComptes(),
    loadBudgetCourses(),
    loadDepensesCourses(),
    loadBudgetDisponible(),
    loadDepensesPerso(),
    loadMouvementsVariablesEpargne(),
    loadRecepteursVirement(),
    loadVirementsMoisCourant(),
    loadNotes(),
    loadMouvementsFixesDepense(),
    loadMouvementsVariablesDepense()
  ])
  await calculerRecapDepenses()
  await calculerTransactionsMois()
})

const totalVariablesListe = computed(() =>
  mouvementsVariablesDepense.value.reduce((sum, m) => sum + (m.montant || 0), 0)
)
const totalProjetsListe = computed(() =>
  projets.value.reduce((sum, p) => sum + (p.mensualite || 0), 0)
)

// Préparation des données pour le graphique à barres des épargnes disponibles
const barLabelsEpargne = computed(() => mouvementsVariablesEpargne.value.map(mv => mv.nom))
const barDataEpargne = computed(() => mouvementsVariablesEpargne.value.map(mv => montantsEpargneDisponibles.value[mv.id] || 0))
</script>

<style scoped>
.montant-input {
  max-width: 120px;
}

.v-table {
  width: 100%;
}

.v-table td, .v-table th, td, th {
  vertical-align: middle !important;
}

/* Cacher les flèches des inputs number */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>

<style>
body,
.v-application,
.v-main,
.v-application--wrap {
  background: #f7e6e8 !important;
}
</style>
