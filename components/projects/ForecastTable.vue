<template>
  <v-card flat>
    <v-table>
      <thead>
        <tr>
          <th>Mois</th>
          <th>Description</th>
          <th>Montant</th>
          <th class="text-right">Somme cumulée</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in forecastData" :key="index">
          <td>{{ item.month }}</td>
          <td>{{ item.description }}</td>
          <td>{{ formatAmount(item.amount) }}€</td>
          <td class="text-right" :class="{ 'text-success': item.cumulative > 0, 'text-error': item.cumulative < 0 }">
            {{ formatAmount(item.cumulative) }}€
          </td>
          <td>
            <div v-if="item.isExpense" class="d-flex gap-2">
              <v-btn
                icon="mdi-pencil"
                size="small"
                color="primary"
                variant="text"
                @click="handleEditExpense(item.expense)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                color="error"
                variant="text"
                @click="handleDeleteExpense(item.expenseId)"
              ></v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Dialog de modification -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title>Modifier la dépense</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitEdit" ref="editForm">
            <v-text-field
              v-model="editedExpense.description"
              label="Description"
              :rules="[v => !!v || 'La description est requise']"
              required
            ></v-text-field>

            <v-text-field
              v-model.number="editedExpense.montant"
              label="Montant (€)"
              type="number"
              :rules="[
                v => !!v || 'Le montant est requis',
                v => v > 0 || 'Le montant doit être positif'
              ]"
              required
            ></v-text-field>

            <v-text-field
              v-model="editedExpense.date"
              label="Date prévue"
              type="date"
              :rules="[v => !!v || 'La date est requise']"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="editDialog = false">Annuler</v-btn>
          <v-btn 
            color="primary" 
            @click="submitEdit"
            :loading="loading"
            :disabled="loading"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'

const props = defineProps({
  projectExpenses: {
    type: Array,
    default: () => []
  },
  monthlyAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    required: true
  },
  projectEndDate: {
    type: String,
    default: null
  },
  projectObjective: {
    type: Number,
    default: null
  },
  projectName: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['delete-expense', 'edit-expense', 'expense-added'])

const editDialog = ref(false)
const editForm = ref(null)
const loading = ref(false)
const editedExpense = reactive({
  id: null,
  description: '',
  montant: null,
  date: ''
})

const formatAmount = (amount) => {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}${amount.toLocaleString('fr-FR')}`
}

const handleDeleteExpense = (expenseId) => {
  console.log('Tentative de suppression de la dépense:', expenseId)
  emit('delete-expense', expenseId)
}

const handleEditExpense = (expense) => {
  editedExpense.id = expense.id
  editedExpense.description = expense.description
  editedExpense.montant = expense.montant
  editedExpense.date = expense.date
  editDialog.value = true
}

const submitEdit = async () => {
  const { valid } = await editForm.value.validate()
  if (!valid) return

  loading.value = true
  emit('edit-expense', { ...editedExpense })
  loading.value = false
  editDialog.value = false
}

const forecastData = computed(() => {
  const months = []
  const now = new Date()
  let cumulativeAmount = props.currentAmount

  // Generate next 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
    
    // Format month name
    const monthName = date.toLocaleDateString('fr-FR', { 
      month: 'long',
      year: 'numeric'
    })

    // Vérifier si on doit encore afficher la mensualité (si on a une date de fin)
    const shouldShowMonthly = !props.projectEndDate || new Date(props.projectEndDate) > date

    // Find expenses for this month
    const monthExpenses = props.projectExpenses?.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getFullYear() === date.getFullYear() && 
             expenseDate.getMonth() === date.getMonth()
    }) || []

    // Add monthly contribution first
    if (i === 0) {
      // Pour le premier mois, on affiche juste le montant actuel
      months.push({
        month: monthName,
        description: 'Montant actuel',
        amount: cumulativeAmount,
        cumulative: cumulativeAmount,
        isExpense: false
      })
    } else if (shouldShowMonthly) {
      // Pour les mois suivants, on ajoute la mensualité si on n'a pas dépassé la date de fin
      cumulativeAmount += props.monthlyAmount
      months.push({
        month: monthName,
        description: 'Mensualité',
        amount: props.monthlyAmount,
        cumulative: cumulativeAmount,
        isExpense: false
      })
    }

    // Add expenses for the month
    for (const expense of monthExpenses) {
      cumulativeAmount -= expense.montant
      months.push({
        month: monthName,
        description: expense.description,
        amount: -expense.montant,
        cumulative: cumulativeAmount,
        isExpense: true,
        expenseId: expense.id,
        expense // Ajout de l'objet expense complet pour l'édition
      })
    }
  }

  return months
})
</script>

<style scoped>
.text-success {
  color: green !important;
}
.text-error {
  color: red !important;
}
.text-right {
  text-align: right;
}
.gap-2 {
  gap: 8px;
}
</style> 