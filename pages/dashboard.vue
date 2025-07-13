<template>
  <v-container fluid>
    <!-- Première ligne : Variables du mois (33%) et Budget courses + Budget disponible (66%) -->
    <v-row>
      <v-col cols="12" md="4">
        <!-- Variables du mois -->
        <VariablesDuMois
          :mois-en-cours="moisEnCours"
          :mouvements-variables="mouvementsVariables"
          :montants-mensuels="montantsMensuels"
          :depenses-projets="depensesProjets"
          :montants-depenses="montantsDepenses"
          :loading="savingMontants"
          :sauvegarder-montants="saveAllMontants"
          :format-amount="formatAmount"
        />
        <!-- Dépenses (doughnut) -->
        <v-card elevation="0" color="transparent" rounded="0">
          <v-card-text class="pa-0">
            <DoughnutDepenses
              :key="totalDepensesVariables"
              :totalDepensesProjets="totalProjetsListe"
              :totalDepensesFixes="totalFixesListe"
              :totalDepensesVariables="totalDepensesVariables"
            />
          </v-card-text>
        </v-card>
        <!-- Transactions du mois -->
        <TransactionsMois :transactions-filtered="transactionsFiltered" />
      </v-col>
      <v-col cols="12" md="8">
        <BudgetCourses
          ref="depenseCoursesForm"
          :budget-courses-total="budgetCoursesTotal"
          :total-depenses-courses="totalDepensesCourses"
          :depenses-courses="depensesCourses"
          :reste-budget-courses="resteBudgetCourses"
          :nouvelle-depense-courses="nouvelleDepenseCourses"
          :loading-depense-courses="loadingDepenseCourses"
          :ajouter-depense-courses="ajouterDepenseCourses"
          :supprimer-depense-courses="supprimerDepenseCourses"
          :format-amount="formatAmount"
          :format-date="formatDate"
        />
        <BudgetDisponible
          :budget-disponible-initial="budgetDisponibleInitial"
          :total-depenses-perso="totalDepensesPerso"
          :depenses-perso="depensesPerso"
          :reste-budget-perso="resteBudgetPerso"
          :nouvelle-depense-perso="nouvelleDepensePerso"
          :loading-depense-perso="loadingDepensePerso"
          :ajouter-depense-perso="ajouterDepensePerso"
          :supprimer-depense-perso="supprimerDepensePerso"
          :format-amount="formatAmount"
          :format-date="formatDate"
        />
        <v-row class="mt-4">
          <v-col cols="12" md="6">
            <Virement
              :mouvements-variables-epargne="mouvementsVariablesEpargne"
              :virements-mois-courant="virementsMoisCourant"
              :virement="virement"
              :loading-virement="loadingVirement"
              :valider-virement="validerVirement"
              :supprimer-virement="supprimerVirement"
              :mouvements-variables-map="mouvementsVariablesMap"
              :recepteurs-virement="recepteursVirementEtComptes"
              :get-montant-total-mouvement-variable-dashboard="getMontantTotalMouvementVariableDashboard"
              :format-amount="formatAmount"
              :format-date="formatDate"
            />
          </v-col>
          <v-col cols="12" md="6">
            <Notes
              :notes-list="notesList"
              :loading-note="loadingNote"
              :edit-note-id="editNoteId"
              :edit-note-content="editNoteContent"
              :sauvegarder-note="sauvegarderNote"
              :start-edit-note="startEditNote"
              :cancel-edit-note="cancelEditNote"
              :update-note="updateNote"
              :delete-note="deleteNote"
              :format-date="formatDate"
            />
          </v-col>
        </v-row>
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
const notesComposable = useNotes()
const note = notesComposable.note
const notesList = notesComposable.notesList
const loadingNote = notesComposable.loadingNote
const editNoteId = notesComposable.editNoteId
const editNoteContent = notesComposable.editNoteContent
const sauvegarderNote = notesComposable.sauvegarderNote
const startEditNote = notesComposable.startEditNote
const cancelEditNote = notesComposable.cancelEditNote
const updateNote = notesComposable.updateNote
const deleteNote = notesComposable.deleteNote
const loadNotes = notesComposable.loadNotes

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
const totalDepensesVariables = computed(() => {
  const total = mouvementsVariablesDepense.value.reduce((sum, m) => sum + (m.montant || 0), 0)
  console.log('[DEBUG] totalDepensesVariables', total)
  return total
})

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

// Fusion des mouvements variables et des dépenses projet pour l'encart Variables du mois
// (SUPPRIMER l'import redondant de computed ici)
// Liste combinée pour l'affichage dans l'encart Variables du mois
const variablesEtDepensesMois = computed(() => {
  // On tag chaque entrée pour savoir si c'est un mouvement ou une dépense projet
  const mouvements = mouvementsVariables.value.map(mv => ({
    ...mv,
    _type: 'mouvement',
  }))
  const depenses = depensesProjets.value.map(dp => ({
    ...dp,
    _type: 'depense',
  }))
  // On fusionne les deux listes
  return [...mouvements, ...depenses]
})

const savingMontants = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref('')

const saveAllMontants = async () => {
  savingMontants.value = true
  feedbackMessage.value = ''
  feedbackType.value = ''
  try {
    await sauvegarderMontants()
    const promises = [];
    for (const depense of depensesProjets.value) {
      const montantSaisi = montantsDepenses.value[depense.id] !== undefined
        ? montantsDepenses.value[depense.id]
        : depense.montant?.toString();
      if (
        montantSaisi !== undefined &&
        parseFloat((montantSaisi || '').replace(',', '.')) !== parseFloat(depense.montant)
      ) {
        promises.push(updateDepenseProjet(depense.id, montantSaisi));
      }
    }
    await Promise.all(promises)
    await loadDepensesProjets()
    await loadMouvementsVariables()
    // Mise à jour dynamique de la part Variables du graphique Dépenses
    await loadMouvementsVariablesDepense()
    feedbackMessage.value = 'Montants sauvegardés avec succès !'
    feedbackType.value = 'success'
  } catch (e) {
    feedbackMessage.value = 'Erreur lors de la sauvegarde.'
    feedbackType.value = 'error'
    console.error(e)
  } finally {
    savingMontants.value = false
  }
}

// Ajout du log juste avant l'appel au composant Notes
console.log('[DEBUG] note.value dans dashboard', note.value)
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
