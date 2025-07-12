import { ref, watch } from 'vue'
import { useSupabaseClient } from '#imports'

export function useBudgetDisponible() {
  const client = useSupabaseClient()
  const budgetDisponibleInitial = ref(0)
  const depensesPerso = ref([])
  const totalDepensesPerso = ref(0)
  const resteBudgetPerso = ref(0)
  const nouvelleDepensePerso = ref({ montant: '', description: '' })
  const loadingDepensePerso = ref(false)
  const depensePersoForm = ref(null)
  const mouvementDisponibleId = ref(null)

  // Charger le budget disponible du mois
  const loadBudgetDisponible = async () => {
    // À adapter selon ta logique métier (ex: somme des mouvements variables "Autre" ou valeur fixe)
    // Ici, on suppose un mouvement variable nommé "Budget Disponible"
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const dateStr = firstDayOfMonth.toISOString().split('T')[0]
    const { data: montantMensuel, error: mensuelError } = await client
      .from('mouvements_variables_mensuels')
      .select('montant, mouvements_variables!inner(id, nom)')
      .eq('date', dateStr)
      .eq('mouvements_variables.nom', 'Salaire MYB')
      .single()
    if (mensuelError && mensuelError.code !== 'PGRST116') {
      console.error('Erreur lors du chargement du budget disponible:', mensuelError)
      return
    }
    if (montantMensuel) {
      budgetDisponibleInitial.value = montantMensuel.montant
      mouvementDisponibleId.value = montantMensuel.mouvements_variables.id
    } else {
      // 2. Si pas trouvé, chercher dans mouvements_variables
      const { data: montantBase, error: baseError } = await client
        .from('mouvements_variables')
        .select('id, montant')
        .eq('nom', 'Salaire MYB')
        .single()
      if (baseError) {
        console.error('Erreur lors du chargement du budget disponible de base:', baseError)
        return
      }
      budgetDisponibleInitial.value = montantBase?.montant || 0
      mouvementDisponibleId.value = montantBase?.id || null
    }
    if (depensesPerso.value.length > 0) {
      resteBudgetPerso.value = budgetDisponibleInitial.value - totalDepensesPerso.value
    }
  }

  // Charger les dépenses perso du mois
  const loadDepensesPerso = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    if (!mouvementDisponibleId.value) return
    const { data, error } = await client
      .from('suivi_budget')
      .select('*')
      .eq('mouvement_id', mouvementDisponibleId.value)
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false })
    if (error) {
      console.error('Erreur lors du chargement des dépenses perso:', error)
      return
    }
    depensesPerso.value = data || []
    totalDepensesPerso.value = data?.reduce((sum, d) => sum + d.montant, 0) || 0
    resteBudgetPerso.value = budgetDisponibleInitial.value - totalDepensesPerso.value
  }

  // Ajout du watch pour charger les dépenses dès que l'id est disponible
  watch(mouvementDisponibleId, (newId) => {
    if (newId) {
      loadDepensesPerso()
    }
  })

  // Ajouter une dépense perso
  const ajouterDepensePerso = async () => {
    if (!depensePersoForm.value?.validate?.()) return
    // Utiliser l'id déjà chargé du mouvement "Budget Disponible"
    if (!mouvementDisponibleId.value) {
      alert('Erreur: Mouvement "Budget Disponible" non trouvé dans la base de données')
      return
    }
    loadingDepensePerso.value = true
    try {
      const montant = parseFloat(nouvelleDepensePerso.value.montant.replace(',', '.'))
      const currentDate = new Date()
      const { error } = await client
        .from('suivi_budget')
        .insert({
          date: currentDate.toISOString().split('T')[0],
          description: nouvelleDepensePerso.value.description,
          montant: montant,
          mouvement_id: mouvementDisponibleId.value
        })
      if (error) throw error
      nouvelleDepensePerso.value = { montant: '', description: '' }
      depensePersoForm.value?.reset?.()
      await loadDepensesPerso()
      await loadBudgetDisponible()
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dépense:', error)
      alert('Erreur lors de l\'ajout de la dépense')
    } finally {
      loadingDepensePerso.value = false
    }
  }

  // Supprimer une dépense perso
  const supprimerDepensePerso = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return
    try {
      const { error } = await client
        .from('suivi_budget')
        .delete()
        .eq('id', id)
      if (error) throw error
      await loadDepensesPerso()
      await loadBudgetDisponible()
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error)
      alert('Erreur lors de la suppression de la dépense')
    }
  }

  return {
    budgetDisponibleInitial,
    depensesPerso,
    totalDepensesPerso,
    resteBudgetPerso,
    nouvelleDepensePerso,
    loadingDepensePerso,
    depensePersoForm,
    loadBudgetDisponible,
    loadDepensesPerso,
    ajouterDepensePerso,
    supprimerDepensePerso
  }
} 