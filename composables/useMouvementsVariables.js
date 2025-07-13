import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export function useMouvementsVariables() {
  const client = useSupabaseClient()
  const loading = ref(false)
  const mouvementsVariables = ref([])
  const montantsMensuels = ref({})

  // Calcul des dépenses globales variables
  const totalDepensesVariables = ref(0)

  const calculerRecapDepenses = async () => {
    const { data: mouvementsVariablesData } = await client
      .from('mouvements_variables')
      .select('id, montant, type')
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const { data: mouvementsVariablesMensuels } = await client
      .from('mouvements_variables_mensuels')
      .select('mouvements_variables_id, montant')
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
    let total = 0
    if (mouvementsVariablesData) {
      for (const mv of mouvementsVariablesData) {
        if (mv.type && mv.type.toLowerCase() === 'dépense') {
          const mensuel = mouvementsVariablesMensuels?.find(m => m.mouvements_variables_id === mv.id)
          total += mensuel ? mensuel.montant : (mv.montant || 0)
        }
      }
    }
    totalDepensesVariables.value = total
  }

  // Chargement des mouvements variables
  const loadMouvementsVariables = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    // 1. Charger tous les mouvements variables
    const { data: mouvementsData, error: mouvementsError } = await client
      .from('mouvements_variables')
      .select('*')
      .order('nom')
    if (mouvementsError) {
      console.error('Erreur lors du chargement des mouvements variables:', mouvementsError)
      return
    }
    // 2. Charger tous les montants mensuels du mois courant
    const { data: montantsMensuelsData, error: mensuelsError } = await client
      .from('mouvements_variables_mensuels')
      .select('*')
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0])
    if (mensuelsError) {
      console.error('Erreur lors du chargement des montants mensuels:', mensuelsError)
      return
    }
    // 3. Pour chaque mouvement, on cherche s'il a un montant mensuel ce mois-ci
    mouvementsVariables.value = mouvementsData
    montantsMensuels.value = {}
    mouvementsData.forEach(mouvement => {
      const mensuel = montantsMensuelsData?.find(m => m.mouvements_variables_id === mouvement.id)
      montantsMensuels.value[mouvement.id] = mensuel ? mensuel.montant.toString() : (mouvement.montant?.toString() || '')
    })
  }

  // Sauvegarde des montants saisis
  const sauvegarderMontants = async () => {
    loading.value = true
    const currentDate = new Date()
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
    try {
      for (const mouvement of mouvementsVariables.value) {
        const montantSaisi = montantsMensuels.value[mouvement.id]
        let montantFinal
        if (montantSaisi) {
          const montantNettoye = montantSaisi.replace(/[^0-9.,-]/g, '').replace(',', '.')
          montantFinal = parseFloat(montantNettoye)
        } else {
          montantFinal = mouvement.montant
        }
        if (isNaN(montantFinal)) {
          throw new Error(`Montant invalide pour ${mouvement.nom}: ${montantSaisi}`)
        }
        const { data: existingEntry } = await client
          .from('mouvements_variables_mensuels')
          .select('id')
          .eq('mouvements_variables_id', mouvement.id)
          .eq('date', dateStr)
          .single()
        if (existingEntry) {
          const { error: updateError } = await client
            .from('mouvements_variables_mensuels')
            .update({ montant: montantFinal })
            .eq('id', existingEntry.id)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await client
            .from('mouvements_variables_mensuels')
            .insert({
              mouvements_variables_id: mouvement.id,
              date: dateStr,
              montant: montantFinal
            })
          if (insertError) throw insertError
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    mouvementsVariables,
    montantsMensuels,
    totalDepensesVariables,
    calculerRecapDepenses,
    loadMouvementsVariables,
    sauvegarderMontants
  }
} 