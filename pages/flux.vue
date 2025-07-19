<template>
  <v-container>
    <v-tabs v-model="activeTab" color="#f43662" align-tabs="center">
      <v-tab value="fixe">Mouvements fixes</v-tab>
      <v-tab value="variable">Mouvements variables</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <!-- Tab Mouvements Fixes -->
      <v-window-item value="fixe">
        <div class="flux-total">Total mensuel : {{ formatAmount(totalFixe) }}€</div>
        <div class="flux-btn-ajout">
          <v-btn
            class="btn-tangerine"
            prepend-icon="mdi-plus"
            @click="showAddFixeDialog = true"
          >
            Ajouter un mouvement fixe
          </v-btn>
        </div>
        <MouvementTable
          :mouvements="mouvementsFixesAvecComptes"
          type="fixe"
          @edit="editMouvementFixe"
          @delete="deleteMouvementFixe"
        />
      </v-window-item>

      <!-- Tab Mouvements Variables -->
      <v-window-item value="variable">
        <div class="flux-total">
          Total Dépenses : <span class="text-error">{{ formatAmount(totalVariableDepense) }}€</span><br>
          Total Rentrées : <span class="text-success">{{ formatAmount(totalVariableRentree, 'Rentrée') }}€</span>
        </div>
        <div class="flux-btn-ajout">
          <v-btn
            class="btn-tangerine"
            prepend-icon="mdi-plus"
            @click="showAddVariableDialog = true"
          >
            Ajouter un mouvement variable
          </v-btn>
        </div>
        <MouvementTable
          :mouvements="mouvementsVariablesAvecComptes"
          type="variable"
          @edit="editMouvementVariable"
          @delete="deleteMouvementVariable"
        />
      </v-window-item>
    </v-window>

    <!-- Dialog Ajout Mouvement Fixe -->
    <v-dialog v-model="showAddFixeDialog" max-width="600px">
      <v-card>
        <v-card-title>Ajouter un mouvement fixe</v-card-title>
        <v-card-text>
          <MouvementForm
            type="fixe"
            :initialData="newMouvementFixe"
            :comptes="comptes"
            :loading="loading"
            @submit="saveMouvementFixe"
            @cancel="() => showAddFixeDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog Ajout Mouvement Variable -->
    <v-dialog v-model="showAddVariableDialog" max-width="600px">
      <v-card>
        <v-card-title>Ajouter un mouvement variable</v-card-title>
        <v-card-text>
          <MouvementForm
            type="variable"
            :initialData="newMouvementVariable"
            :comptes="comptes"
            :loading="loading"
            @submit="saveMouvementVariable"
            @cancel="() => showAddVariableDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog Modification Mouvement Fixe -->
    <v-dialog v-model="showEditFixeDialog" max-width="600px">
      <v-card>
        <v-card-title>Modifier le mouvement fixe</v-card-title>
        <v-card-text>
          <MouvementForm
            type="fixe"
            :initialData="editedMouvementFixe"
            :comptes="comptes"
            :loading="loading"
            @submit="updateMouvementFixe"
            @cancel="() => showEditFixeDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog Modification Mouvement Variable -->
    <v-dialog v-model="showEditVariableDialog" max-width="600px">
      <v-card>
        <v-card-title>Modifier le mouvement variable</v-card-title>
        <v-card-text>
          <MouvementForm
            type="variable"
            :initialData="editedMouvementVariable"
            :comptes="comptes"
            :loading="loading"
            @submit="updateMouvementVariable"
            @cancel="() => showEditVariableDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import MouvementForm from '@/components/MouvementForm.vue'
import MouvementTable from '@/components/MouvementTable.vue'

console.log('[flux.vue] mounted')

const client = useSupabaseClient()

const activeTab = ref('fixe')
const showAddFixeDialog = ref(false)
const showAddVariableDialog = ref(false)
const showEditFixeDialog = ref(false)
const showEditVariableDialog = ref(false)
const loading = ref(false)

// Références des formulaires
const addFixeForm = ref(null)
const addVariableForm = ref(null)
const editFixeForm = ref(null)
const editVariableForm = ref(null)

// États
const mouvementsFixes = ref([])
const mouvementsVariables = ref([])
const comptes = ref([])

// États pour les nouveaux mouvements
const newMouvementFixe = ref({
  nom: '',
  compte_id: null,
  type: null,
  montant: null,
  actif: true
})

const newMouvementVariable = ref({
  nom: '',
  compte_id: null,
  type: null,
  montant: null,
  nature: null
})

// États pour les mouvements en cours d'édition
const editedMouvementFixe = ref({
  id: null,
  nom: '',
  compte_id: null,
  type: null,
  montant: null,
  actif: true
})

const editedMouvementVariable = ref({
  id: null,
  nom: '',
  compte_id: null,
  type: null,
  montant: null,
  nature: null
})

// Charger les mouvements variables
const loadMouvementsVariables = async () => {
  const { data: variablesData, error: variablesError } = await client
    .from('mouvements_variables')
    .select('*')
    .order('nom')

  if (variablesError) {
    console.error('Erreur lors du chargement des mouvements variables:', variablesError)
    return
  }

  mouvementsVariables.value = variablesData
}

// Charger les données au montage du composant
onMounted(async () => {
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

  // Charger les mouvements fixes
  const { data: fixesData, error: fixesError } = await client
    .from('mouvements_fixes')
    .select('*')
    .order('nom', { ascending: true })

  if (fixesError) {
    console.error('Erreur lors du chargement des mouvements fixes:', fixesError)
  } else {
    mouvementsFixes.value = fixesData
  }

  await loadMouvementsVariables()
})

// Computed properties pour ajouter les noms des comptes
const mouvementsFixesAvecComptes = computed(() => {
  return mouvementsFixes.value.map(mouvement => ({
    ...mouvement,
    compte_nom: comptes.value.find(c => c.id === mouvement.compte_id)?.nom_compte || 'Compte inconnu'
  }))
})

const mouvementsVariablesAvecComptes = computed(() => {
  return mouvementsVariables.value.map(mouvement => ({
    ...mouvement,
    compte_nom: comptes.value.find(c => c.id === mouvement.compte_id)?.nom_compte || 'Compte inconnu'
  }))
})

// Calculer les totaux
const totalFixe = computed(() => {
  return mouvementsFixes.value.reduce((total, mouvement) => {
    return total + (mouvement.type === 'Rentrée' ? mouvement.montant : -mouvement.montant)
  }, 0)
})

const totalVariable = computed(() => {
  return mouvementsVariables.value.reduce((total, mouvement) => {
    return total + (mouvement.type === 'Rentrée' ? mouvement.montant : -mouvement.montant)
  }, 0)
})

const totalVariableDepense = computed(() => {
  return mouvementsVariables.value
    .filter(m => m.type === 'Dépense')
    .reduce((total, m) => total + m.montant, 0)
})

const totalVariableRentree = computed(() => {
  return mouvementsVariables.value
    .filter(m => m.type === 'Rentrée')
    .reduce((total, m) => total + m.montant, 0)
})

// Formatage
const formatAmount = (amount, type) => {
  const prefix = type === 'Dépense' ? '-' : '+'
  return `${prefix}${Math.abs(amount).toLocaleString('fr-FR')}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

// Fonctions de gestion des mouvements fixes
const saveMouvementFixe = async (payload) => {
  console.log('saveMouvementFixe called with:', payload)
  loading.value = true
  // On retire le champ nature
  const { nature, ...toInsert } = payload
  const { data, error } = await client
    .from('mouvements_fixes')
    .insert([{ ...toInsert, actif: true }])
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de l\'ajout:', error)
  } else {
    mouvementsFixes.value.push(data)
    showAddFixeDialog.value = false
    newMouvementFixe.value = {
      nom: '',
      compte_id: null,
      type: null,
      montant: null,
      actif: true
    }
  }
  loading.value = false
}

const editMouvementFixe = (mouvement) => {
  editedMouvementFixe.value = {
    id: mouvement.id,
    nom: mouvement.nom,
    compte_id: mouvement.compte_id,
    type: mouvement.type,
    montant: mouvement.montant,
    actif: mouvement.actif
  }
  showEditFixeDialog.value = true
}

const updateMouvementFixe = async (payload) => {
  console.log('updateMouvementFixe called with:', payload)
  loading.value = true
  try {
    // On retire le champ nature
    const { nature, ...toUpdate } = payload
    const { data, error } = await client
      .from('mouvements_fixes')
      .update({
        ...toUpdate,
        actif: toUpdate.actif ?? true
      })
      .eq('id', editedMouvementFixe.value.id)
      .select()
      .single()

    if (error) throw error

    // Mettre à jour le mouvement dans la liste locale
    const index = mouvementsFixes.value.findIndex(m => m.id === editedMouvementFixe.value.id)
    if (index !== -1) {
      mouvementsFixes.value[index] = data
    }
    showEditFixeDialog.value = false
  } catch (error) {
    console.error('Erreur lors de la modification:', error)
  } finally {
    loading.value = false
  }
}

// Fonctions de gestion des mouvements variables
const saveMouvementVariable = async (payload) => {
  console.log('saveMouvementVariable called with:', payload)
  loading.value = true
  try {
    const { data, error } = await client
      .from('mouvements_variables')
      .insert([{
        nom: payload.nom,
        compte_id: payload.compte_id,
        type: payload.type,
        montant: payload.montant,
        nature: payload.nature
      }])
      .select()
      .single()

    if (error) throw error

    mouvementsVariables.value.unshift(data)
    showAddVariableDialog.value = false
    newMouvementVariable.value = {
      nom: '',
      compte_id: null,
      type: null,
      montant: null,
      nature: null
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error)
  }
  loading.value = false
}

const editMouvementVariable = (mouvement) => {
  editedMouvementVariable.value = {
    id: mouvement.id,
    nom: mouvement.nom,
    compte_id: mouvement.compte_id,
    type: mouvement.type,
    montant: mouvement.montant,
    nature: mouvement.nature
  }
  showEditVariableDialog.value = true
}

const updateMouvementVariable = async (payload) => {
  console.log('updateMouvementVariable called with:', payload)
  loading.value = true
  try {
    const { data, error } = await client
      .from('mouvements_variables')
      .update({
        nom: payload.nom,
        compte_id: payload.compte_id,
        type: payload.type,
        montant: payload.montant,
        nature: payload.nature
      })
      .eq('id', editedMouvementVariable.value.id)
      .select()
      .single()

    if (error) throw error

    const index = mouvementsVariables.value.findIndex(m => m.id === editedMouvementVariable.value.id)
    if (index !== -1) {
      mouvementsVariables.value[index] = data
    }
    showEditVariableDialog.value = false
  } catch (error) {
    console.error('Erreur lors de la modification:', error)
  }
  loading.value = false
}

const deleteMouvementFixe = async (id) => {
  loading.value = true
  const { error } = await client
    .from('mouvements_fixes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
  } else {
    mouvementsFixes.value = mouvementsFixes.value.filter(m => m.id !== id)
  }
  loading.value = false
}

const deleteMouvementVariable = async (id) => {
  loading.value = true
  try {
    const { error } = await client
      .from('mouvements_variables')
      .delete()
      .eq('id', id)

    if (error) throw error

    mouvementsVariables.value = mouvementsVariables.value.filter(m => m.id !== id)
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  }
  loading.value = false
}
</script>

<style scoped>
.text-success {
  color: green !important;
}
.text-error {
  color: red !important;
}
.gap-2 {
  gap: 8px;
}
.text-right {
  text-align: right;
}
.flux-total {
  font-size: 1.3em;
  margin-bottom: 18px;
  margin-top: 18px;
  text-align: center;
}
.flux-btn-ajout {
  margin-bottom: 18px;
  text-align: center;
}
.btn-tangerine {
  border-radius: 32px !important;
  background: #ffa726 !important;
  color: #fff !important;
  box-shadow: 0 2px 8px 0 rgba(244,54,98,0.08);
  margin-bottom: 18px;
}
</style>
  