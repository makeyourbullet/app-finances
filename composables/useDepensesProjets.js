import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export function useDepensesProjets() {
  const client = useSupabaseClient()
  const depensesProjets = ref([])
  const montantsDepenses = ref({})

  // Charger les dépenses projet prévues pour ce mois
  const loadDepensesProjets = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const { data, error } = await client
      .from('depenses_projet')
      .select(`*, projet:projets(nom_projet)`)
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
    if (error) {
      console.error('Erreur lors du chargement des dépenses projet:', error)
      return
    }
    depensesProjets.value = data
    // Initialiser les montants des dépenses
    montantsDepenses.value = {}
    data.forEach(depense => {
      montantsDepenses.value[depense.id] = depense.montant.toString()
    })
  }

  // Mettre à jour une dépense projet
  const updateDepenseProjet = async (depenseId, montantSaisi) => {
    // Nettoyer la valeur saisie
    const montantNettoye = montantSaisi.replace(/[^0-9.,-]/g, '').replace(',', '.')
    const montantFinal = parseFloat(montantNettoye)
    if (isNaN(montantFinal)) {
      console.error(`[updateDepenseProjet] Montant invalide pour dépense ${depenseId}: saisi='${montantSaisi}' nettoyé='${montantNettoye}'`)
      alert(`Montant invalide pour dépense ${depenseId}: '${montantSaisi}'`)
      return
    }
    console.log(`[updateDepenseProjet] Update depense id=${depenseId} montant=${montantFinal}`)
    const { data, error } = await client
      .from('depenses_projet')
      .update({ montant: montantFinal })
      .eq('id', depenseId)
      .select()
    console.log('[updateDepenseProjet] Supabase update result:', { data, error });
    if (error) {
      console.error('Erreur mise à jour dépense:', error)
      throw error
    }
    // Mettre à jour localement
    montantsDepenses.value[depenseId] = montantFinal.toString()
    // Optionnel : recharger les dépenses
    await loadDepensesProjets()
  }

  return {
    depensesProjets,
    montantsDepenses,
    loadDepensesProjets,
    updateDepenseProjet
  }
} 