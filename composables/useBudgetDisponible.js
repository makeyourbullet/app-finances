import { ref, watch } from 'vue'
import { useSupabaseClient } from '#imports'

// Déclaration globale pour le callback de refresh
let refreshBudgetDisponible = null
function setRefreshBudgetDisponible(fn) {
  refreshBudgetDisponible = fn
}

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
  const loadBudgetDisponible = async (totalDepensesVariables = 0) => {
    // Nouvelle logique : somme des "Rentrée" du mois en cours - total des dépenses variables
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    // 1. Récupérer tous les mouvements variables de type "Rentrée"
    const { data: mouvementsRentree, error: errMouv } = await client
      .from('mouvements_variables')
      .select('id, montant')
      .eq('type', 'Rentrée')
    if (errMouv) {
      console.error('Erreur lors du chargement des mouvements variables de type Rentrée:', errMouv)
      return
    }
    const idsRentree = (mouvementsRentree || []).map(mv => mv.id)
    // 2. Récupérer tous les montants mensuels de ces mouvements pour le mois en cours
    let totalRentre = 0
    let montantsMensuels = []
    if (idsRentree.length > 0) {
      const { data: mensuels, error: errMensuels } = await client
        .from('mouvements_variables_mensuels')
        .select('montant, mouvements_variables_id')
        .in('mouvements_variables_id', idsRentree)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfMonth.toISOString().split('T')[0])
      if (errMensuels) {
        console.error('Erreur lors du chargement des montants mensuels Rentrée:', errMensuels)
        return
      }
      montantsMensuels = mensuels || []
    }
    // Pour chaque mouvement, on additionne toutes les lignes mensuelles si elles existent, sinon le montant de base
    for (const mv of mouvementsRentree || []) {
      const mensuels = montantsMensuels.filter(m => m.mouvements_variables_id === mv.id)
      if (mensuels.length > 0) {
        totalRentre += mensuels.reduce((sum, m) => sum + (m.montant || 0), 0)
      } else {
        totalRentre += mv.montant || 0
      }
    }
    budgetDisponibleInitial.value = totalRentre - totalDepensesVariables
    // Le reste à dépenser reste calculé comme avant
    if (depensesPerso.value.length > 0) {
      resteBudgetPerso.value = budgetDisponibleInitial.value - totalDepensesPerso.value
    }
  }

  // Charger les dépenses perso du mois
  const loadDepensesPerso = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    // 1. Chercher l'id du mouvement "Salaire MYB"
    const { data: mv, error: errMv } = await client
      .from('mouvements_variables')
      .select('id')
      .eq('nom', 'Salaire MYB')
      .single()
    if (errMv || !mv) {
      depensesPerso.value = []
      totalDepensesPerso.value = 0
      return
    }
    // 2. Charger les dépenses pour ce mouvement et ce mois
    const { data, error } = await client
      .from('suivi_budget')
      .select('*')
      .eq('mouvement_id', mv.id)
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false })
    if (error) {
      depensesPerso.value = []
      totalDepensesPerso.value = 0
      return
    }
    depensesPerso.value = data || []
    totalDepensesPerso.value = data?.reduce((sum, d) => sum + d.montant, 0) || 0
    resteBudgetPerso.value = budgetDisponibleInitial.value - totalDepensesPerso.value
  }

  // Nouvelle fonction pour la liste et le total "Autre" (uniquement Salaire MYB)
  const loadDepensesPersoSalaireMYB = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    // Chercher l'id du mouvement "Salaire MYB"
    const { data: mv, error: errMv } = await client
      .from('mouvements_variables')
      .select('id')
      .eq('nom', 'Salaire MYB')
      .single()
    if (errMv || !mv) {
      depensesPerso.value = []
      totalDepensesPerso.value = 0
      return
    }
    // Charger les dépenses pour ce mouvement et ce mois
    const { data, error } = await client
      .from('suivi_budget')
      .select('*')
      .eq('mouvement_id', mv.id)
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false })
    if (error) {
      depensesPerso.value = []
      totalDepensesPerso.value = 0
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
    loadingDepensePerso.value = true
    try {
      // Chercher l'id du mouvement "Salaire MYB"
      const { data: mv, error: errMv } = await client
        .from('mouvements_variables')
        .select('id')
        .eq('nom', 'Salaire MYB')
        .single()
      if (errMv || !mv) {
        alert('Erreur: Mouvement "Salaire MYB" non trouvé dans la base de données')
        loadingDepensePerso.value = false
        return
      }
      const montant = parseFloat(nouvelleDepensePerso.value.montant.replace(',', '.'))
      const currentDate = new Date()
      const { error } = await client
        .from('suivi_budget')
        .insert({
          date: currentDate.toISOString().split('T')[0],
          description: nouvelleDepensePerso.value.description,
          montant: montant,
          mouvement_id: mv.id
        })
      if (error) throw error
      nouvelleDepensePerso.value = { montant: '', description: '' }
      await loadDepensesPersoSalaireMYB()
      if (typeof refreshBudgetDisponible === 'function') {
        await refreshBudgetDisponible()
      }
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
      await loadDepensesPersoSalaireMYB()
      if (typeof refreshBudgetDisponible === 'function') {
        await refreshBudgetDisponible()
      }
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
    loadDepensesPersoSalaireMYB,
    ajouterDepensePerso,
    supprimerDepensePerso,
    setRefreshBudgetDisponible
  }
}

export { setRefreshBudgetDisponible } 