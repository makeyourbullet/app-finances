<template>
  <v-container>
    <div class="coffre-title-container">
      <v-icon class="coffre-title-icon" size="56" color="#f43662">mdi-bank-outline</v-icon>
      <span class="coffre-title-text">Mon coffre</span>
    </div>
    <!-- Bouton Ajouter -->
     <div style="text-align: center;">
    <v-btn
      class="mb-6 btn-tangerine"
      style="background:#ffa726; color:#fff;"
      prepend-icon="mdi-plus"
      @click="showAddDialog = true"
    >
      Ajouter un compte
    </v-btn>
    </div>
    <!-- Liste des comptes par colonne de type -->
    <v-row>
      <v-col
        v-for="type in typesCompte"
        :key="type"
        cols="12"
        md="6"
        lg="3"
      >
        <div class="type-col-title">{{ type }}</div>
        <draggable
          :list="comptesParType[type]"
          item-key="id"
          handle=".drag-handle"
          @end="evt => onDragEnd(type, evt)"
          animation="200"
        >
          <template #item="{ element: compte }">
            <v-card class="mb-4 drag-card compte-card-flex">
              <div class="compte-card-actions-col">
                <span class="drag-handle" style="cursor: grab; margin-bottom: 12px; display: flex; justify-content: center;">
                  <v-icon size="20">mdi-drag</v-icon>
                </span>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  color="warning"
                  variant="text"
                  @click="editCompte(compte)"
                  class="mb-1"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  color="error"
                  variant="text"
                  @click="confirmDelete(compte)"
                ></v-btn>
              </div>
              <div class="compte-card-main-col">
                <div class="compte-card-title-main">{{ compte.nom_compte }}</div>
                <div class="compte-card-center mb-2">
                  {{ compte.banque }}
                </div>
                <div class="compte-card-center mb-2">
                  {{ compte.type_compte === 'PEA' ? 'Investissement' : compte.type_compte }}
                </div>
              </div>
            </v-card>
          </template>
        </draggable>
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useSupabaseClient } from '#imports'
import draggable from 'vuedraggable'

const client = useSupabaseClient()

// États
const comptes = ref([])
// Comptes triés par type et ordre
const comptesTries = computed(() => {
  return [...comptes.value].sort((a, b) => {
    if (a.type_compte < b.type_compte) return -1;
    if (a.type_compte > b.type_compte) return 1;
    // Tri par ordre croissant si même type
    return (a.ordre ?? 0) - (b.ordre ?? 0)
  })
})
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const loading = ref(false)
const form = ref(null)

// Types de compte disponibles
const typesCompte = ['Courant', 'Épargne', 'Investissement', 'Autre']

// Pour chaque type, on garde une liste réactive pour le drag & drop
const comptesParType = reactive({})

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
      .order('type_compte', { ascending: true })
      .order('ordre', { ascending: true })
    if (error) throw error
    comptes.value = data
    // Initialiser les listes par type pour le drag & drop
    typesCompte.forEach(type => {
      if (type === 'Investissement') {
        comptesParType[type] = data.filter(c => c.type_compte === 'Investissement' || c.type_compte === 'PEA')
      } else {
        comptesParType[type] = data.filter(c => c.type_compte === type)
      }
    })
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
      // Mettre à jour dans comptesParType
      const type = data.type_compte === 'PEA' ? 'Investissement' : data.type_compte
      if (comptesParType[type]) {
        const idx = comptesParType[type].findIndex(c => c.id === data.id)
        if (idx !== -1) {
          comptesParType[type][idx] = data
        }
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
      // Ajouter dans la bonne colonne
      const type = data.type_compte === 'PEA' ? 'Investissement' : data.type_compte
      if (!comptesParType[type]) comptesParType[type] = []
      comptesParType[type].push(data)
      // Trier par ordre si besoin
      comptesParType[type].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
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
    // Supprimer aussi de la colonne
    const type = selectedCompte.value.type_compte === 'PEA' ? 'Investissement' : selectedCompte.value.type_compte
    if (comptesParType[type]) {
      comptesParType[type] = comptesParType[type].filter(c => c.id !== selectedCompte.value.id)
    }
    showDeleteDialog.value = false
    selectedCompte.value = null
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  } finally {
    loading.value = false
  }
}

// Drag & drop persistant : mise à jour de l'ordre en base et dans comptes.value
const onDragEnd = async (type, evt) => {
  // La nouvelle liste ordonnée pour ce type est comptesParType[type]
  comptesParType[type].forEach((compte, idx) => {
    compte.ordre = idx
  })
  // Mettre à jour comptes.value (le tableau source)
  comptes.value = [
    ...comptes.value.filter(c => {
      if (type === 'Investissement') {
        return !(c.type_compte === 'Investissement' || c.type_compte === 'PEA')
      } else {
        return c.type_compte !== type
      }
    }),
    ...comptesParType[type]
  ]
  // Mettre à jour en base
  try {
    for (const compte of comptesParType[type]) {
      await client.from('comptes').update({ ordre: compte.ordre }).eq('id', compte.id)
    }
  } catch (e) {
    alert('Erreur lors de la sauvegarde de l\'ordre des comptes !')
    console.error(e)
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
/* Style pour le titre principal "Mon coffre" */
.coffre-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  margin-top: 12px;
}
.coffre-title-icon {
  margin-right: 18px;
}
.coffre-title-text {
  font-family: 'Lobster Two', cursive;
  font-size: 3.2em;
  color: #f43662;
  font-weight: 700;
  letter-spacing: 1px;
}
.btn-tangerine {
  border-radius: 32px !important;
  font-weight: 600;
}
.type-col-title {
  font-family: 'Lobster Two', cursive;
  font-size: 1.5em;
  color: #f43662;
  font-weight: 700;
  text-align: center;
  margin-bottom: 18px;
  margin-top: 8px;
  letter-spacing: 1px;
}
.drag-card {
  transition: box-shadow 0.2s;
}
.drag-handle {
  cursor: grab;
}
.compte-card-flex {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 170px;
  padding-left: 10px;
  padding-right: 10px;
}
.compte-card-title {
  font-family: inherit !important;
  font-size: 1.25em;
  font-weight: 700;
}
.compte-card-title-main {
  font-family: inherit !important;
  font-size: 1.5em;
  font-style: italic;
  text-align: center;
  margin-bottom: 8px;
  color: #f691a9;
}
.compte-card-actions-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
  color:#f43662;
}
.compte-card-main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.compte-card-center {
  text-align: center;
  width: 100%;
}
</style>

