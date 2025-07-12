import { ref, watch } from 'vue'
import { useSupabaseClient } from '#imports'

export function useBudgetCourses() {
  const client = useSupabaseClient()
  const budgetCoursesTotal = ref(0)
  const mouvementCoursesId = ref(null)
  const depensesCourses = ref([])
  const totalDepensesCourses = ref(0)
  const resteBudgetCourses = ref(0)
  const nouvelleDepenseCourses = ref({ montant: '', description: '' })
  const loadingDepenseCourses = ref(false)
  const depenseCoursesForm = ref(null)

  // Charger le budget courses du mois
  const loadBudgetCourses = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const dateStr = firstDayOfMonth.toISOString().split('T')[0]
    // 1. Chercher dans mouvements_variables_mensuels
    const { data: montantMensuel, error: mensuelError } = await client
      .from('mouvements_variables_mensuels')
      .select('montant, mouvements_variables!inner(id, nom)')
      .eq('date', dateStr)
      .eq('mouvements_variables.nom', 'Budget Courses')
      .single()
    if (mensuelError && mensuelError.code !== 'PGRST116') {
      console.error('Erreur lors du chargement du budget courses:', mensuelError)
      return
    }
    if (montantMensuel) {
      budgetCoursesTotal.value = montantMensuel.montant
      mouvementCoursesId.value = montantMensuel.mouvements_variables.id
    } else {
      // 2. Si pas trouvé, chercher dans mouvements_variables
      const { data: montantBase, error: baseError } = await client
        .from('mouvements_variables')
        .select('id, montant')
        .eq('nom', 'Budget Courses')
        .single()
      if (baseError) {
        console.error('Erreur lors du chargement du budget courses de base:', baseError)
        return
      }
      budgetCoursesTotal.value = montantBase?.montant || 0
      mouvementCoursesId.value = montantBase?.id
    }
    // Recalculer le reste à dépenser après mise à jour du budget courses
    if (depensesCourses.value.length > 0) {
      resteBudgetCourses.value = budgetCoursesTotal.value - totalDepensesCourses.value
    }
  }

  // Charger les dépenses courses du mois
  const loadDepensesCourses = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const { data, error } = await client
      .from('suivi_budget')
      .select('*')
      .eq('mouvement_id', mouvementCoursesId.value)
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false })
    if (error) {
      return
    }
    depensesCourses.value = data || []
    totalDepensesCourses.value = data?.reduce((sum, d) => sum + d.montant, 0) || 0
    resteBudgetCourses.value = budgetCoursesTotal.value - totalDepensesCourses.value
  }

  // Ajouter une dépense courses
  const ajouterDepenseCourses = async () => {
    if (!depenseCoursesForm.value?.validate?.()) return
    if (!mouvementCoursesId.value) {
      alert('Erreur: Mouvement "Budget Courses" non trouvé dans la base de données')
      return
    }
    loadingDepenseCourses.value = true
    try {
      const montant = parseFloat(nouvelleDepenseCourses.value.montant.replace(',', '.'))
      const currentDate = new Date()
      const { error } = await client
        .from('suivi_budget')
        .insert({
          date: currentDate.toISOString().split('T')[0],
          description: nouvelleDepenseCourses.value.description,
          montant: montant,
          mouvement_id: mouvementCoursesId.value
        })
      if (error) throw error
      // Réinitialiser le formulaire
      nouvelleDepenseCourses.value = { montant: '', description: '' }
      depenseCoursesForm.value?.reset?.()
      // Recharger les dépenses
      await loadDepensesCourses()
      await loadBudgetCourses()
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dépense:', error)
      alert('Erreur lors de l\'ajout de la dépense')
    } finally {
      loadingDepenseCourses.value = false
    }
  }

  // Supprimer une dépense courses
  const supprimerDepenseCourses = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return
    try {
      const { error } = await client
        .from('suivi_budget')
        .delete()
        .eq('id', id)
      if (error) throw error
      await loadDepensesCourses()
      await loadBudgetCourses()
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error)
      alert('Erreur lors de la suppression de la dépense')
    }
  }

  // Ajout du watch pour charger les dépenses dès que l'id est disponible
  watch(mouvementCoursesId, (newId) => {
    if (newId) {
      loadDepensesCourses()
    }
  })

  return {
    budgetCoursesTotal,
    mouvementCoursesId,
    depensesCourses,
    totalDepensesCourses,
    resteBudgetCourses,
    nouvelleDepenseCourses,
    loadingDepenseCourses,
    depenseCoursesForm,
    loadBudgetCourses,
    loadDepensesCourses,
    ajouterDepenseCourses,
    supprimerDepenseCourses
  }
} 