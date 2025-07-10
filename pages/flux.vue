<template>
  <v-container>
    <v-tabs v-model="activeTab">
      <v-tab value="fixe">Mouvements fixes</v-tab>
      <v-tab value="variable">Mouvements variables</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <!-- Tab Mouvements Fixes -->
      <v-window-item value="fixe">
        <v-card flat>
          <!-- Total -->
          <v-card-text class="text-h6">
            Total mensuel : {{ formatAmount(totalFixe) }}€
          </v-card-text>

          <!-- Bouton Ajouter -->
          <v-card-text>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showAddFixeDialog = true"
            >
              Ajouter un mouvement fixe
            </v-btn>
          </v-card-text>

          <!-- Tableau -->
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Compte</th>
                  <th class="text-right">Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mouvement in mouvementsFixesAvecComptes" :key="mouvement.id">
                  <td>{{ mouvement.nom }}</td>
                  <td>{{ mouvement.compte_nom }}</td>
                  <td class="text-right" :class="{ 'text-success': mouvement.type === 'Rentrée', 'text-error': mouvement.type === 'Dépense' }">
                    {{ formatAmount(mouvement.montant, mouvement.type) }}€
                  </td>
                  <td>
                    <div class="d-flex gap-2">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        color="primary"
                        variant="text"
                        @click="editMouvementFixe(mouvement)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        variant="text"
                        @click="deleteMouvementFixe(mouvement.id)"
                      ></v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Tab Mouvements Variables -->
      <v-window-item value="variable">
        <v-card flat>
          <!-- Total -->
          <v-card-text class="text-h6">
            Total Dépenses : <span class="text-error">{{ formatAmount(totalVariableDepense) }}€</span><br>
            Total Rentrées : <span class="text-success">{{ formatAmount(totalVariableRentree, 'Rentrée') }}€</span>
          </v-card-text>

          <!-- Bouton Ajouter -->
          <v-card-text>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showAddVariableDialog = true"
            >
              Ajouter un mouvement variable
            </v-btn>
          </v-card-text>

          <!-- Tableau -->
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Compte</th>
                  <th class="text-right">Montant</th>
                  <th>Type</th>
                  <th>Nature</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mouvement in mouvementsVariablesAvecComptes" :key="mouvement.id">
                  <td>{{ mouvement.nom }}</td>
                  <td>{{ mouvement.compte_nom }}</td>
                  <td class="text-right" :class="{ 'text-success': mouvement.type === 'Rentrée', 'text-error': mouvement.type === 'Dépense' }">
                    {{ formatAmount(mouvement.montant, mouvement.type) }}€
                  </td>
                  <td>{{ mouvement.type }}</td>
                  <td>{{ mouvement.nature }}</td>
                  <td>
                    <div class="d-flex gap-2">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        color="primary"
                        variant="text"
                        @click="editMouvementVariable(mouvement)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        variant="text"
                        @click="deleteMouvementVariable(mouvement.id)"
                      ></v-btn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Dialog Ajout Mouvement Fixe -->
    <v-dialog v-model="showAddFixeDialog" max-width="600px">
      <v-card>
        <v-card-title>Ajouter un mouvement fixe</v-card-title>
        <v-card-text>
          <v-form ref="addFixeForm" @submit.prevent="saveMouvementFixe">
            <v-text-field
              v-model="newMouvementFixe.nom"
              label="Description"
              :rules="[v => !!v || 'La description est requise']"
              required
            ></v-text-field>

            <v-select
              v-model="newMouvementFixe.compte_id"
              :items="comptes"
              item-title="nom_compte"
              item-value="id"
              label="Compte"
              :rules="[v => !!v || 'Le compte est requis']"
              required
            ></v-select>

            <v-select
              v-model="newMouvementFixe.type"
              :items="['Rentrée', 'Dépense']"
              label="Type"
              :rules="[v => !!v || 'Le type est requis']"
              required
            ></v-select>

            <v-text-field
              v-model.number="newMouvementFixe.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || 'Le montant est requis',
                v => v > 0 || 'Le montant doit être positif'
              ]"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showAddFixeDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="saveMouvementFixe" :loading="loading">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Ajout Mouvement Variable -->
    <v-dialog v-model="showAddVariableDialog" max-width="600px">
      <v-card>
        <v-card-title>Ajouter un mouvement variable</v-card-title>
        <v-card-text>
          <v-form ref="addVariableForm" @submit.prevent="saveMouvementVariable">
            <v-text-field
              v-model="newMouvementVariable.nom"
              label="Description"
              :rules="[v => !!v || 'La description est requise']"
              required
            ></v-text-field>

            <v-select
              v-model="newMouvementVariable.compte_id"
              :items="comptes"
              item-title="nom_compte"
              item-value="id"
              label="Compte"
              :rules="[v => !!v || 'Le compte est requis']"
              required
            ></v-select>

            <v-select
              v-model="newMouvementVariable.type"
              :items="['Rentrée', 'Dépense']"
              label="Type"
              :rules="[v => !!v || 'Le type est requis']"
              required
            ></v-select>

            <v-select
              v-model="newMouvementVariable.nature"
              :items="['Courant', 'Épargne']"
              label="Nature"
              :rules="[v => !!v || 'La nature est requise']"
              required
            ></v-select>

            <v-text-field
              v-model.number="newMouvementVariable.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || v === 0 || 'Le montant est requis',
                v => v >= 0 || 'Le montant doit être positif ou nul'
              ]"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showAddVariableDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="saveMouvementVariable" :loading="loading">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Modification Mouvement Fixe -->
    <v-dialog v-model="showEditFixeDialog" max-width="600px">
      <v-card>
        <v-card-title>Modifier le mouvement fixe</v-card-title>
        <v-card-text>
          <v-form ref="editFixeForm" @submit.prevent="updateMouvementFixe">
            <v-text-field
              v-model="editedMouvementFixe.nom"
              label="Description"
              :rules="[v => !!v || 'La description est requise']"
              required
            ></v-text-field>

            <v-select
              v-model="editedMouvementFixe.compte_id"
              :items="comptes"
              item-title="nom_compte"
              item-value="id"
              label="Compte"
              :rules="[v => !!v || 'Le compte est requis']"
              required
            ></v-select>

            <v-select
              v-model="editedMouvementFixe.type"
              :items="['Rentrée', 'Dépense']"
              label="Type"
              :rules="[v => !!v || 'Le type est requis']"
              required
            ></v-select>

            <v-text-field
              v-model.number="editedMouvementFixe.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || 'Le montant est requis',
                v => v > 0 || 'Le montant doit être positif'
              ]"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showEditFixeDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="updateMouvementFixe" :loading="loading">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Modification Mouvement Variable -->
    <v-dialog v-model="showEditVariableDialog" max-width="600px">
      <v-card>
        <v-card-title>Modifier le mouvement variable</v-card-title>
        <v-card-text>
          <v-form ref="editVariableForm" @submit.prevent="updateMouvementVariable">
            <v-text-field
              v-model="editedMouvementVariable.nom"
              label="Description"
              :rules="[v => !!v || 'La description est requise']"
              required
            ></v-text-field>

            <v-select
              v-model="editedMouvementVariable.compte_id"
              :items="comptes"
              item-title="nom_compte"
              item-value="id"
              label="Compte"
              :rules="[v => !!v || 'Le compte est requis']"
              required
            ></v-select>

            <v-select
              v-model="editedMouvementVariable.type"
              :items="['Rentrée', 'Dépense']"
              label="Type"
              :rules="[v => !!v || 'Le type est requis']"
              required
            ></v-select>

            <v-select
              v-model="editedMouvementVariable.nature"
              :items="['Courant', 'Épargne']"
              label="Nature"
              :rules="[v => !!v || 'La nature est requise']"
              required
            ></v-select>

            <v-text-field
              v-model.number="editedMouvementVariable.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || v === 0 || 'Le montant est requis',
                v => v >= 0 || 'Le montant doit être positif ou nul'
              ]"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showEditVariableDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="updateMouvementVariable" :loading="loading">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

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
const saveMouvementFixe = async () => {
  const { valid } = await addFixeForm.value.validate()
  if (!valid) return

  loading.value = true
  const { data, error } = await client
    .from('mouvements_fixes')
    .insert([newMouvementFixe.value])
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

const updateMouvementFixe = async () => {
  const { valid } = await editFixeForm.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const { data, error } = await client
      .from('mouvements_fixes')
      .update({
        nom: editedMouvementFixe.value.nom,
        compte_id: editedMouvementFixe.value.compte_id,
        type: editedMouvementFixe.value.type,
        montant: editedMouvementFixe.value.montant,
        actif: editedMouvementFixe.value.actif
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
const saveMouvementVariable = async () => {
  const { valid } = await addVariableForm.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const { data, error } = await client
      .from('mouvements_variables')
      .insert([{
        nom: newMouvementVariable.value.nom,
        compte_id: newMouvementVariable.value.compte_id,
        type: newMouvementVariable.value.type,
        montant: newMouvementVariable.value.montant,
        nature: newMouvementVariable.value.nature
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

const updateMouvementVariable = async () => {
  const { valid } = await editVariableForm.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const { data, error } = await client
      .from('mouvements_variables')
      .update({
        nom: editedMouvementVariable.value.nom,
        compte_id: editedMouvementVariable.value.compte_id,
        type: editedMouvementVariable.value.type,
        montant: editedMouvementVariable.value.montant,
        nature: editedMouvementVariable.value.nature
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
</style>
  