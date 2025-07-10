<template>
  <div>
    <v-btn
      color="primary"
      variant="outlined"
      prepend-icon="mdi-plus"
      @click="dialog = true"
      class="mb-4"
    >
      Ajouter une dépense
    </v-btn>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>Ajouter une dépense</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitForm" ref="form">
            <v-text-field
              v-model="expense.description"
              label="Description"
              :rules="[v => !!v || 'La description est requise']"
              required
            ></v-text-field>

            <v-text-field
              v-model.number="expense.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || 'Le montant est requis',
                v => v > 0 || 'Le montant doit être positif'
              ]"
              required
            ></v-text-field>

            <v-text-field
              v-model="expense.date_prevue"
              label="Date prévue"
              type="date"
              :rules="[v => !!v || 'La date est requise']"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="dialog = false">Annuler</v-btn>
          <v-btn 
            color="primary" 
            @click="submitForm"
            :loading="loading"
            :disabled="loading"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>

        <v-snackbar
          v-model="showError"
          color="error"
          timeout="3000"
        >
          {{ errorMessage }}
        </v-snackbar>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['expense-added'])
const client = useSupabaseClient()

const dialog = ref(false)
const form = ref(null)
const loading = ref(false)
const showError = ref(false)
const errorMessage = ref('')

const expense = reactive({
  description: '',
  montant: null,
  date_prevue: '',
})

const submitForm = async () => {
  const { valid } = await form.value.validate()
  
  if (!valid) return

  loading.value = true
  showError.value = false

  try {
    const newExpense = {
      description: expense.description,
      montant: expense.montant,
      date: expense.date_prevue,
      projet_id: props.projectId
    }

    const { data, error } = await client
      .from('depenses_projet')
      .insert([newExpense])
      .select()

    if (error) {
      throw error
    }

    if (data && data[0]) {
      emit('expense-added', data[0])
      form.value.reset()
      dialog.value = false
      expense.description = ''
      expense.montant = null
      expense.date_prevue = ''
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la dépense:', error)
    errorMessage.value = 'Erreur lors de l\'ajout de la dépense. Veuillez réessayer.'
    showError.value = true
  } finally {
    loading.value = false
  }
}
</script> 