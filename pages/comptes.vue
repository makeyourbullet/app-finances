<template>
  <v-container>
    <h1 class="text-h4 mb-4">Mes Comptes</h1>

    <!-- Bouton Ajouter -->
    <v-btn
      color="primary"
      class="mb-6"
      prepend-icon="mdi-plus"
      @click="showAddDialog = true"
    >
      Ajouter un compte
    </v-btn>

    <!-- Liste des comptes -->
    <v-row>
      <v-col
        v-for="compte in comptes"
        :key="compte.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            {{ compte.nom_compte }}
            <div class="d-flex gap-2">
              <v-btn
                icon="mdi-pencil"
                size="small"
                color="primary"
                variant="text"
                @click="editCompte(compte)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                color="error"
                variant="text"
                @click="confirmDelete(compte)"
              ></v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <div class="text-subtitle-1 mb-2">
              <v-icon icon="mdi-bank" class="mr-2"></v-icon>
              {{ compte.banque }}
            </div>
            <div class="text-body-1 mb-2">
              <strong>Type:</strong> {{ compte.type_compte }}
            </div>
            <div class="text-h6" :class="{ 'text-error': compte.solde_init < 0 }">
              Solde initial: {{ formatAmount(compte.solde_init) }}€
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Ajout/Modification -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Modifier le compte' : 'Nouveau compte' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveCompte">
            <v-text-field
              v-model="editedCompte.nom_compte"
              label="Nom du compte"
              :rules="[v => !!v || 'Le nom est requis']"
              required
            ></v-text-field>

            <v-text-field
              v-model="editedCompte.banque"
              label="Banque"
              :rules="[v => !!v || 'La banque est requise']"
              required
            ></v-text-field>

            <v-select
              v-model="editedCompte.type_compte"
              :items="typesCompte"
              label="Type de compte"
              :rules="[v => !!v || 'Le type est requis']"
              required
            ></v-select>

            <v-text-field
              v-model.number="editedCompte.solde_init"
              label="Solde initial (€)"
              type="number"
              :rules="[v => v !== null || 'Le solde initial est requis']"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="showAddDialog = false">Annuler</v-btn>
          <v-btn 
            color="primary" 
            @click="saveCompte"
            :loading="loading"
          >
            {{ isEditing ? 'Modifier' : 'Ajouter' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer le compte "{{ selectedCompte?.nom_compte }}" ?
          Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteCompte"
            :loading="loading"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const client = useSupabaseClient()

// États
const comptes = ref([])
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const loading = ref(false)
const form = ref(null)

// Types de compte disponibles
const typesCompte = ['Courant', 'Épargne', 'PEA', 'Autre']

// État pour le compte en cours d'édition
const editedCompte = ref({
  id: null,
  nom_compte: '',
  banque: '',
  type_compte: '',
  solde_init: null
})

const selectedCompte = ref(null)

// Indique si on est en mode édition
const isEditing = computed(() => !!editedCompte.value.id)

// Charger les comptes
onMounted(async () => {
  loading.value = true
  try {
    const { data, error } = await client
      .from('comptes')
      .select('*')
      .order('nom_compte', { ascending: true })

    if (error) throw error
    comptes.value = data
  } catch (error) {
    console.error('Erreur lors du chargement des comptes:', error)
  } finally {
    loading.value = false
  }
})

// Formater les montants
const formatAmount = (amount) => {
  return amount.toLocaleString('fr-FR')
}

// Réinitialiser le formulaire
const resetForm = () => {
  editedCompte.value = {
    id: null,
    nom_compte: '',
    banque: '',
    type_compte: '',
    solde_init: null
  }
}

// Éditer un compte
const editCompte = (compte) => {
  editedCompte.value = { ...compte }
  showAddDialog.value = true
}

// Confirmer la suppression
const confirmDelete = (compte) => {
  selectedCompte.value = compte
  showDeleteDialog.value = true
}

// Sauvegarder un compte (ajout ou modification)
const saveCompte = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  try {
    if (isEditing.value) {
      // Modification
      const { data, error } = await client
        .from('comptes')
        .update({
          nom_compte: editedCompte.value.nom_compte,
          banque: editedCompte.value.banque,
          type_compte: editedCompte.value.type_compte,
          solde_init: editedCompte.value.solde_init
        })
        .eq('id', editedCompte.value.id)
        .select()
        .single()

      if (error) throw error

      // Mettre à jour le compte dans la liste locale
      const index = comptes.value.findIndex(c => c.id === editedCompte.value.id)
      if (index !== -1) {
        comptes.value[index] = data
      }
    } else {
      // Ajout
      const { data, error } = await client
        .from('comptes')
        .insert([{
          nom_compte: editedCompte.value.nom_compte,
          banque: editedCompte.value.banque,
          type_compte: editedCompte.value.type_compte,
          solde_init: editedCompte.value.solde_init
        }])
        .select()
        .single()

      if (error) throw error
      comptes.value.push(data)
    }

    showAddDialog.value = false
    resetForm()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  } finally {
    loading.value = false
  }
}

// Supprimer un compte
const deleteCompte = async () => {
  if (!selectedCompte.value) return

  loading.value = true
  try {
    const { error } = await client
      .from('comptes')
      .delete()
      .eq('id', selectedCompte.value.id)

    if (error) throw error

    // Supprimer le compte de la liste locale
    comptes.value = comptes.value.filter(c => c.id !== selectedCompte.value.id)
    showDeleteDialog.value = false
    selectedCompte.value = null
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.text-error {
  color: red !important;
}
</style>

