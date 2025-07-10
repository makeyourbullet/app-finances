import { ref } from 'vue'

export function useProjectExpenses() {
  const supabase = useSupabaseClient()
  const loading = ref(false)
  const error = ref(null)

  const addExpense = async (expense) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: supaError } = await supabase
        .from('depenses_projet')
        .insert({
          description: expense.description,
          montant: expense.montant,
          date: expense.date_prevue,
          projet_id: expense.projet_id
        })
        .select()
        .single()

      if (supaError) throw supaError

      return data
    } catch (err) {
      error.value = err.message || 'Erreur lors de l\'ajout de la dépense'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const deleteExpense = async (expenseId) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: supaError } = await supabase
        .from('depenses_projet')
        .delete()
        .eq('id', expenseId)

      if (supaError) throw supaError
    } catch (err) {
      error.value = err.message || 'Erreur lors de la suppression de la dépense'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const getProjectExpenses = async (projectId) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: supaError } = await supabase
        .from('depenses_projet')
        .select('*')
        .eq('projet_id', projectId)
        .order('date', { ascending: true })

      if (supaError) throw supaError

      return data
    } catch (err) {
      error.value = err.message || 'Erreur lors de la récupération des dépenses'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    addExpense,
    deleteExpense,
    getProjectExpenses
  }
} 