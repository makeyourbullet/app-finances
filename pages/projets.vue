<template>
  <v-container>
    <h1 class="text-h4 mb-4">Mes Projets</h1>

    <!-- Bouton Ajouter un projet -->
    <v-btn
      color="primary"
      class="mb-6"
      prepend-icon="mdi-plus"
      @click="dialog = true"
    >
      Ajouter un projet
    </v-btn>

    <!-- Modal formulaire -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Nouveau Projet</span>
        </v-card-title>

        <v-card-text>
          <ProjectForm
            ref="projectForm"
            :comptes="comptes"
            @submit="saveProject"
            @cancel="dialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Liste des projets -->
    <v-card v-if="projects.length > 0">
      <v-tabs
        v-model="activeTab"
        color="primary"
        align-tabs="start"
      >
        <v-tab
          v-for="project in projects"
          :key="project.id"
          :value="project.id"
        >
          {{ project.nom_projet }}
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item
          v-for="project in projects"
          :key="project.id"
          :value="project.id"
        >
          <ProjectPanel
            :project="project"
            :compte="getCompte(project.compte_id)"
            :montant-epargne="getMontantEpargne(project.id)"
            @edit="editProject"
            @delete="confirmDelete"
            @expense-added="handleExpenseAdded"
            @expense-deleted="handleExpenseDeleted"
            @expense-edited="handleExpenseEdited"
          />
        </v-window-item>
      </v-window>
    </v-card>

    <v-alert
      v-else
      type="info"
      class="mt-4"
    >
      Aucun projet pour le moment. Commencez par en créer un !
    </v-alert>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer le projet "{{ selectedProject?.nom_projet }}" ?
          Cette action est irréversible et supprimera également toutes les dépenses associées.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="deleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteProject"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog d'édition -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Modifier le projet</span>
        </v-card-title>
        <v-card-text>
          <ProjectForm
            v-if="selectedProject"
            ref="editProjectForm"
            :comptes="comptes"
            :initial-data="selectedProject"
            @submit="updateProject"
            @cancel="editDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProjectForm from '~/components/projects/ProjectForm.vue'
import ProjectPanel from '~/components/projects/ProjectPanel.vue'
import EditProjectButton from '~/components/projects/EditProjectButton.vue'
import DeleteProjectButton from '~/components/projects/DeleteProjectButton.vue'
import { useSupabaseClient } from '#imports'

const client = useSupabaseClient()

const dialog = ref(false)
const projectForm = ref(null)
const projects = ref([])
const comptes = ref([])
const epargneProjet = ref({})
const activeTab = ref(null)
const editDialog = ref(false)
const deleteDialog = ref(false)
const selectedProject = ref(null)

// Charger les projets et les comptes depuis Supabase
const loadProjects = async () => {
  // Charger les projets avec leurs dépenses
  const { data: projetsData, error: projetsError } = await client
    .from('projets')
    .select(`
      *,
      depenses_projet (
        id,
        description,
        montant,
        date
      )
    `)
    .order('date_debut', { ascending: true })

  if (projetsError) {
    console.error('Erreur lors du chargement des projets:', projetsError)
  } else {
    projects.value = projetsData
    // Définir le premier projet comme actif par défaut s'il y en a
    if (projetsData.length > 0 && !activeTab.value) {
      activeTab.value = projetsData[0].id
    }
  }
}

// Charger les données au montage du composant
onMounted(async () => {
  await loadProjects()

  // Charger les comptes
  const { data: comptesData, error: comptesError } = await client
    .from('comptes')
    .select('*')
    .order('nom_compte', { ascending: true })

  if (comptesError) {
    console.error('Erreur lors du chargement des comptes:', comptesError)
  } else {
    comptes.value = comptesData
  }

  // Charger les montants épargnés
  const { data: epargneData, error: epargneError } = await client
    .from('epargne_projet')
    .select('projet_id, montant_cumul, date')
    .order('date', { ascending: false })
    .then(({ data, error }) => {
      if (error) return { error }
      
      // Garder uniquement le montant le plus récent pour chaque projet
      const montantsRecents = data.reduce((acc, curr) => {
        if (!acc[curr.projet_id] || new Date(curr.date) > new Date(acc[curr.projet_id].date)) {
          acc[curr.projet_id] = curr
        }
        return acc
      }, {})

      // Convertir en format final
      const montantsFinal = Object.values(montantsRecents).reduce((acc, curr) => {
        acc[curr.projet_id] = curr.montant_cumul
        return acc
      }, {})

      return { data: montantsFinal }
    })

  if (epargneError) {
    console.error('Erreur lors du chargement des montants disponibles:', epargneError)
  } else {
    epargneProjet.value = epargneData
  }
})

// Sauvegarder un nouveau projet
async function saveProject(projectData) {
  try {
    // Créer d'abord le projet
    const { data, error } = await client
      .from('projets')
      .insert([projectData])
      .select()

    if (error) throw error

    // Si le projet a une date de fin et un objectif, créer la dépense finale
    if (projectData.date_fin && projectData.objectif) {
      const { error: depenseError } = await client
        .from('depenses_projet')
        .insert([{
          description: `Objectif final - ${projectData.nom_projet}`,
          montant: projectData.objectif,
          date: projectData.date_fin,
          projet_id: data[0].id
        }])

      if (depenseError) throw depenseError
    }

    // Recharger les projets pour avoir les données à jour
    await loadProjects()
    activeTab.value = data[0].id // Activer le nouvel onglet
    dialog.value = false
    projectForm.value?.resetForm()
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error)
  }
}

// Obtenir les informations d'un compte
function getCompte(compteId) {
  return comptes.value.find(c => c.id === compteId)
}

// Obtenir le montant épargné pour un projet
function getMontantEpargne(projetId) {
  return epargneProjet.value[projetId] || 0
}

// Fonction pour éditer un projet
function editProject(project) {
  selectedProject.value = { ...project }
  editDialog.value = true
}

// Fonction pour confirmer la suppression
function confirmDelete(project) {
  selectedProject.value = project
  deleteDialog.value = true
}

// Fonction pour supprimer un projet
async function deleteProject() {
  if (!selectedProject.value) return

  try {
    // Supprimer d'abord toutes les dépenses associées
    const { error: depensesError } = await client
      .from('depenses_projet')
      .delete()
      .eq('projet_id', selectedProject.value.id)

    if (depensesError) throw depensesError

    // Supprimer ensuite le projet
    const { error: projetError } = await client
      .from('projets')
      .delete()
      .eq('id', selectedProject.value.id)

    if (projetError) throw projetError

    // Recharger les projets
    await loadProjects()
    
    // Réinitialiser la sélection et fermer la boîte de dialogue
    deleteDialog.value = false
    selectedProject.value = null

    // Si c'était le projet actif, sélectionner le premier projet restant
    if (projects.value.length > 0) {
      activeTab.value = projects.value[0].id
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error)
  }
}

// Fonction pour mettre à jour un projet
async function updateProject(projectData) {
  const { data, error } = await client
    .from('projets')
    .update(projectData)
    .eq('id', selectedProject.value.id)
    .select()

  if (error) {
    console.error('Erreur lors de la mise à jour du projet:', error)
  } else {
    // Mettre à jour le projet dans la liste locale
    const index = projects.value.findIndex(p => p.id === selectedProject.value.id)
    if (index !== -1) {
      projects.value[index] = data[0]
    }
    editDialog.value = false
    selectedProject.value = null
  }
}

// Gérer l'ajout d'une dépense
const handleExpenseAdded = async (expense) => {
  try {
    const { data, error } = await client
      .from('depenses_projet')
      .insert([expense])
      .select()

    if (error) throw error

    // Recharger les projets pour avoir les données à jour
    await loadProjects()
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la dépense:', error)
  }
}

// Gérer la suppression d'une dépense
const handleExpenseDeleted = async (expenseId) => {
  try {
    const { error } = await client
      .from('depenses_projet')
      .delete()
      .eq('id', expenseId)

    if (error) throw error

    // Recharger les projets pour avoir les données à jour
    await loadProjects()
  } catch (error) {
    console.error('Erreur lors de la suppression de la dépense:', error)
  }
}

// Gérer la modification d'une dépense
const handleExpenseEdited = async (expense) => {
  try {
    const { error } = await client
      .from('depenses_projet')
      .update({
        description: expense.description,
        montant: expense.montant,
        date: expense.date
      })
      .eq('id', expense.id)

    if (error) throw error

    // Recharger les projets pour avoir les données à jour
    await loadProjects()
  } catch (error) {
    console.error('Erreur lors de la modification de la dépense:', error)
  }
}
</script>
  