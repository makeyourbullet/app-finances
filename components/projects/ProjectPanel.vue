<template>
  <v-card flat class="pa-4">
    <v-row>
      <v-col cols="12" class="d-flex align-center mb-4">
        <span class="text-h6">{{ projectData ? projectData.nom_projet : '' }}</span>
        <v-spacer></v-spacer>
        <EditProjectButton color="error" @edit="$emit('edit', project)" />
        <DeleteProjectButton color="error" @delete="$emit('delete', project)" />
      </v-col>

      <v-col cols="12" md="6">
        <div class="text-body-1 mb-2">
          <strong>Objectif:</strong> {{ projectData ? (projectData.objectif ? `${projectData.objectif}€` : 'N/D') : 'N/D' }}
        </div>
        <div class="text-body-1 mb-2">
          <strong>Mensualité:</strong> {{ projectData ? projectData.mensualite : 'N/D' }}€
        </div>
        <div class="text-body-1 mb-2">
          <strong>Période:</strong> {{ projectData ? formatDate(projectData.date_debut) : 'N/D' }} - {{ projectData ? (projectData.date_fin ? formatDate(projectData.date_fin) : 'Non définie') : 'N/D' }}
        </div>
        <div class="text-body-1 mb-2">
          <strong>Compte:</strong> {{ compteName }}
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <template v-if="projectData && projectData.objectif">
          <v-progress-linear
            :model-value="progress"
            height="20"
            :color="progressColor"
            class="mb-4"
          >
            <template v-slot:default="{ value }">
              <strong>{{ Math.round(value) }}%</strong>
            </template>
          </v-progress-linear>
        </template>
        <div class="text-body-1">
          <strong>Montant disponible:</strong> {{ montantDisponible }}€
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="dialog = true"
        >
          Ajouter une dépense
        </v-btn>
      </v-col>

      <!-- Dépenses récurrentes -->
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <span class="text-h6">Dépenses récurrentes</span>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              @click="loadRecurringExpenses"
              :loading="loading"
            ></v-btn>
          </v-card-title>
          <v-card-text>
            <v-table v-if="recurringExpensesSorted.length > 0">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Montant</th>
                  <th>Date de début</th>
                  <th>Fréquence</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <draggable
                v-model="recurringExpenses"
                :list="recurringExpenses"
                item-key="id"
                tag="tbody"
                @end="updateRecurringOrder"
                handle=".drag-handle"
              >
                <template #item="{ element: expense }">
                  <tr>
                    <td><v-icon small class="mr-2 drag-handle">mdi-drag</v-icon>{{ expense.description }}</td>
                    <td>{{ expense.montant.toLocaleString('fr-FR') }} €</td>
                    <td>{{ formatDate(expense.date_debut) }}</td>
                    <td>
                      <v-chip
                        :color="getFrequencyColor(expense.frequence)"
                        size="small"
                      >
                        {{ getFrequencyLabel(expense.frequence) }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        @click="handleEditRecurringExpense(expense)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="error"
                        @click="handleDeleteRecurringExpense(expense)"
                      ></v-btn>
                    </td>
                  </tr>
                </template>
              </draggable>
            </v-table>
            <div v-else class="text-center pa-4">
              Aucune dépense récurrente
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <ForecastTable
          :project-expenses="projectData ? projectData.depenses_projet : []"
          :monthly-amount="projectData ? projectData.mensualite : 0"
          :current-amount="montantEpargne"
          :project-end-date="projectData ? projectData.date_fin : null"
          :project-objective="projectData ? projectData.objectif : null"
          :project-name="projectData ? projectData.nom_projet : ''"
          :project-id="projectData ? projectData.id : null"
          @delete-expense="handleDeleteExpense"
          @edit-expense="$emit('expense-edited', $event)"
          @expense-added="$emit('expense-added', $event)"
        />
      </v-col>
    </v-row>

    <!-- Dialog d'ajout/modification de dépense -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEdit ? 'Modifier' : 'Ajouter' }} une dépense</span>
        </v-card-title>
        <v-card-text>
          <ExpenseForm
            ref="expenseForm"
            :initial-data="selectedExpense"
            :is-edit="isEdit"
            :projet-id="project.id"
            @submit="handleSubmitExpense"
            @cancel="dialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import EditProjectButton from './EditProjectButton.vue'
import DeleteProjectButton from './DeleteProjectButton.vue'
import ForecastTable from './ForecastTable.vue'
import ExpenseForm from './ExpenseForm.vue'
import draggable from 'vuedraggable'

const client = useSupabaseClient()

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  compte: {
    type: Object,
    required: true
  },
  montantEpargne: {
    type: Number,
    default: 0
  }
})

defineEmits(['edit', 'delete', 'expense-added', 'expense-deleted', 'expense-edited'])

const dialog = ref(false)
const expenseForm = ref(null)
const recurringExpenses = ref([])
const isEdit = ref(false)
const selectedExpense = ref(null)
const loading = ref(false)
const projectData = ref(null)

// Fonction pour vérifier et mettre à jour les dépenses récurrentes (si dernier jour du mois)
const checkAndUpdateRecurringExpenses = async () => {
  try {
    const aujourdhui = new Date()
    const dernierJourMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0)
    const dateFinMois = dernierJourMois.toISOString().split('T')[0]

    if (aujourdhui.getDate() === dernierJourMois.getDate()) {
      console.log('checkAndUpdateRecurringExpenses: Début de la vérification des dépenses récurrentes...')
      const { data: depensesRecurrentes, error: errorRecurrentes } = await client
        .from('depenses_projet_recurrentes')
        .select('*')
        .eq('projet_id', props.project.id)

      if (errorRecurrentes) {
        console.error('checkAndUpdateRecurringExpenses: Erreur lors de la récupération des dépenses récurrentes:', errorRecurrentes)
        throw errorRecurrentes
      }
      console.log('checkAndUpdateRecurringExpenses: Dépenses récurrentes trouvées:', depensesRecurrentes)

      for (const depense of depensesRecurrentes) {
        const { data: derniereDepense, error: errorDerniere } = await client
          .from('depenses_projet')
          .select('*')
          .eq('projet_id', props.project.id)
          .eq('description', depense.description)
          .lte('date', dateFinMois)
          .order('date', { ascending: false })
          .limit(1)

        if (errorDerniere) {
          console.error('checkAndUpdateRecurringExpenses: Erreur lors de la récupération de la dernière dépense:', errorDerniere)
          throw errorDerniere
        }
        console.log('checkAndUpdateRecurringExpenses: Dernière dépense pour', depense.description, ':', derniereDepense)

        if (!derniereDepense || derniereDepense.length === 0) {
          console.log('checkAndUpdateRecurringExpenses: Génération de la prochaine occurrence pour', depense.description)
          const dateDerniereOccurrence = derniereDepense && derniereDepense.length > 0
            ? new Date(derniereDepense[0].date)
            : new Date(depense.date_debut)

          const prochaineDate = new Date(dateDerniereOccurrence)
          switch (depense.frequence) {
            case 'mensuel':
              prochaineDate.setMonth(prochaineDate.getMonth() + 1)
              break
            case 'bimestriel':
              prochaineDate.setMonth(prochaineDate.getMonth() + 2)
              break
            case 'trimestriel':
              prochaineDate.setMonth(prochaineDate.getMonth() + 3)
              break
            case 'annuel':
              prochaineDate.setFullYear(prochaineDate.getFullYear() + 1)
              break
            case 'bisannuel':
              prochaineDate.setFullYear(prochaineDate.getFullYear() + 2)
              break
          }

          const { error: insertError } = await client
            .from('depenses_projet')
            .insert({
              projet_id: props.project.id,
              description: depense.description,
              montant: depense.montant,
              date: prochaineDate.toISOString().split('T')[0]
            })

          if (insertError) {
            console.error('checkAndUpdateRecurringExpenses: Erreur lors de l\'insertion de la nouvelle occurrence:', insertError)
            throw insertError
          }
          console.log('checkAndUpdateRecurringExpenses: Nouvelle occurrence insérée pour', depense.description, ':', prochaineDate.toISOString().split('T')[0])
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des dépenses récurrentes:', error)
  }
}

// Fonction pour charger les dépenses du projet (pour ForecastTable)
const loadExpenses = async () => {
  console.log('loadExpenses: Rechargement des dépenses du projet...')
  try {
    const { data, error } = await client
      .from('depenses_projet')
      .select('*')
      .eq('projet_id', props.project.id) // Utilise props.project.id
      .order('date', { ascending: true }) // Trier pour la cohérence

    if (error) {
      console.error('loadExpenses: Erreur lors du rechargement des dépenses:', error)
      throw error
    }
    if (projectData.value) {
      projectData.value.depenses_projet = data
    }
    console.log('loadExpenses: Dépenses du projet rechargées:', data)
  } catch (error) {
    console.error('loadExpenses: Erreur lors du rechargement des dépenses du projet:', error)
  }
}

// Fonction pour charger les données complètes du projet (incluant les dépenses)
const loadProjectData = async () => {
  console.log('loadProjectData: Début du chargement des données du projet...')
  try {
    loading.value = true
    const { data, error } = await client
      .from('projets')
      .select('*, depenses_projet(*)') // Sélectionne le projet et ses dépenses
      .eq('id', props.project.id)
      .single()

    if (error) {
      console.error('loadProjectData: Erreur lors de la récupération des données du projet:', error)
      throw error
    }
    projectData.value = data // Assigne les données à la variable réactive locale
    console.log('loadProjectData: Données du projet chargées:', projectData.value)

    await checkAndUpdateRecurringExpenses() // Appel de la vérification des dépenses récurrentes
    await loadExpenses() // Rechargera les dépenses dans projectData.value.depenses_projet

  } catch (error) {
    console.error('Erreur lors du chargement des données du projet:', error)
  } finally {
    loading.value = false
    console.log('loadProjectData: Fin du chargement des données du projet.')
  }
}

// Fonctions utilitaires
function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR')
}

// Calculer le pourcentage de progression
const progress = computed(() => {
  if (!props.project.objectif) return 0
  return Math.round((props.montantEpargne / props.project.objectif) * 100)
})

// Déterminer la couleur de la progression
const progressColor = computed(() => {
  if (progress.value >= 100) return 'success'
  if (progress.value >= 50) return 'warning'
  return 'error'
})

// Obtenir le nom complet du compte
const compteName = computed(() => {
  if (!props.compte) return 'Compte inconnu'
  return `${props.compte.nom_compte} (${props.compte.banque})`
})

// Obtenir le label de la fréquence
const getFrequencyLabel = (frequence) => {
  const labels = {
    mensuel: 'Mensuel',
    bimestriel: 'Bimestriel',
    trimestriel: 'Trimestriel',
    annuel: 'Annuel',
    bisannuel: 'Bisannuel'
  }
  return labels[frequence] || frequence
}

// Obtenir la couleur de la fréquence
const getFrequencyColor = (frequence) => {
  const colors = {
    mensuel: 'primary',
    bimestriel: 'info',
    trimestriel: 'success',
    annuel: 'warning',
    bisannuel: 'error'
  }
  return colors[frequence] || 'grey'
}

// Charger les dépenses récurrentes
const loadRecurringExpenses = async () => {
  loading.value = true
  console.log('loadRecurringExpenses: Début du chargement des dépenses récurrentes...')
  try {
    const { data, error } = await client
      .from('depenses_projet_recurrentes')
      .select('*')
      .eq('projet_id', props.project.id)
    if (error) {
      console.error('loadRecurringExpenses: Erreur lors de la récupération des dépenses récurrentes:', error)
      throw error
    }
    recurringExpenses.value = data
    console.log('loadRecurringExpenses: Dépenses récurrentes chargées:', recurringExpenses.value)
    console.log('loadRecurringExpenses: Contenu réel de recurringExpenses:', JSON.parse(JSON.stringify(recurringExpenses.value)))

    // Recharger les dépenses du projet pour que ForecastTable soit à jour
    await loadExpenses()

  } catch (error) {
    console.error('Erreur lors du chargement des dépenses récurrentes:', error)
  } finally {
    loading.value = false
    console.log('loadRecurringExpenses: Fin du chargement.')
  }
}

// Gérer l'édition d'une dépense récurrente
const handleEditRecurringExpense = (expense) => {
  console.log('handleEditRecurringExpense: Édition de la dépense récurrente:', expense)
  selectedExpense.value = { ...expense, is_recurrent: true }
  isEdit.value = true
  dialog.value = true
}

// Gérer la suppression d'une dépense récurrente
const handleDeleteRecurringExpense = async (expense) => {
  if (!confirm('Voulez-vous vraiment supprimer cette dépense récurrente ? Toutes les occurrences futures seront également supprimées.')) return

  console.log('handleDeleteRecurringExpense: Suppression de la dépense récurrente:', expense)
  try {
    loading.value = true
    // Supprimer la dépense récurrente
    const { error } = await client
      .from('depenses_projet_recurrentes')
      .delete()
      .eq('id', expense.id)

    if (error) {
      console.error('handleDeleteRecurringExpense: Erreur lors de la suppression de la dépense récurrente du tableau recurrentes:', error)
      throw error
    }
    console.log('handleDeleteRecurringExpense: Dépense récurrente supprimée de depenses_projet_recurrentes.')

    // Supprimer toutes les occurrences futures
    const { error: deleteError } = await client
      .from('depenses_projet')
      .delete()
      .eq('projet_id', expense.projet_id)
      .eq('description', expense.description)
      .gte('date', expense.date_debut)

    if (deleteError) {
      console.error('handleDeleteRecurringExpense: Erreur lors de la suppression des occurrences futures:', deleteError)
      throw deleteError
    }
    console.log('handleDeleteRecurringExpense: Occurrences futures supprimées de depenses_projet.')

    // Recharger les données
    await loadRecurringExpenses()
    console.log('handleDeleteRecurringExpense: Dépenses récurrentes rechargées.')
  } catch (error) {
    console.error('Erreur lors de la suppression de la dépense récurrente:', error)
  } finally {
    loading.value = false
    console.log('handleDeleteRecurringExpense: Fin de la suppression.')
  }
}

// Gérer la soumission du formulaire
const handleSubmitExpense = async () => {
  console.log('handleSubmitExpense: Soumission du formulaire de dépense...')
  await loadRecurringExpenses()
  await loadProjectData() // Recharger aussi les données du projet pour que ForecastTable soit à jour
  dialog.value = false
  console.log('handleSubmitExpense: Formulaire soumis, rechargement des dépenses et fermeture du dialogue.')
}

// Ajout de la méthode pour gérer la suppression d'une dépense projet
const handleDeleteExpense = async (expenseId) => {
  try {
    const { error } = await client
      .from('depenses_projet')
      .delete()
      .eq('id', expenseId)
    if (error) throw error
    // Recharger les données du projet pour mettre à jour le tableau
    await loadProjectData()
  } catch (error) {
    console.error('Erreur lors de la suppression de la dépense projet:', error)
  }
}

// Charger les données au montage du composant
onMounted(async () => {
  console.log('onMounted: Composant ProjectPanel monté. Chargement des données...')
  await loadProjectData() // Cette fonction appelle déjà checkAndUpdateRecurringExpenses
  await loadRecurringExpenses() // Appel pour s'assurer que le tableau récurrent est à jour après les éventuelles générations
  console.log('onMounted: Chargement initial terminé.')
})

const montantDisponible = computed(() => {
  // Montant brut de l'épargne projet
  const cumul = props.montantEpargne || 0
  // Dépenses du mois courant
  if (!projectData.value || !projectData.value.depenses_projet) return cumul
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const depensesMois = projectData.value.depenses_projet.filter(dep => {
    const d = new Date(dep.date)
    return d >= firstDay && d <= lastDay
  })
  const totalDepensesMois = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0)
  return cumul - totalDepensesMois
})

// Pour l'affichage trié par ordre
const recurringExpensesSorted = computed(() => {
  return [...recurringExpenses.value].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
})

// Mettre à jour l'ordre en base après drag & drop
const updateRecurringOrder = async (evt) => {
  // evt est l'événement de vuedraggable
  // On met à jour l'ordre pour chaque dépense
  for (let i = 0; i < recurringExpenses.value.length; i++) {
    const expense = recurringExpenses.value[i]
    if (expense.ordre !== i) {
      expense.ordre = i
      await client.from('depenses_projet_recurrentes').update({ ordre: i }).eq('id', expense.id)
    }
  }
}
</script> 