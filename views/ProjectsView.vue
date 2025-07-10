import { useProjectExpenses } from '@/composables/useProjectExpenses'

const { loading: expenseLoading, error: expenseError, addExpense, deleteExpense } = useProjectExpenses()

// Add these methods to handle expense operations
const handleExpenseAdded = async (expense) => {
  try {
    await addExpense(expense)
    // Refresh the project data to get updated expenses
    await fetchProjects()
    // Show success message
    showSnackbar('Dépense ajoutée avec succès', 'success')
  } catch (error) {
    showSnackbar(error, 'error')
  }
}

const handleExpenseDeleted = async (expenseId) => {
  try {
    await deleteExpense(expenseId)
    // Refresh the project data to get updated expenses
    await fetchProjects()
    // Show success message
    showSnackbar('Dépense supprimée avec succès', 'success')
  } catch (error) {
    showSnackbar(error, 'error')
  }
}

// Add these to your template where you render ProjectPanel
<ProjectPanel
  :project="project"
  :compte="getCompteById(project.compte_id)"
  :montantEpargne="getMontantEpargne(project)"
  @edit="handleEditProject"
  @delete="handleDeleteProject"
  @expense-added="handleExpenseAdded"
  @expense-deleted="handleExpenseDeleted"
/> 