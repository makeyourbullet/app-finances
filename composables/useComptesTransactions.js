import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export function useComptesTransactions() {
  const client = useSupabaseClient()
  const comptes = ref([])
  const transactionsMois = ref([])
  const transactionsFiltered = ref([])
  const totalDepensesFixes = ref(0)

  // Charger les comptes
  const loadComptes = async () => {
    const { data, error } = await client
      .from('comptes')
      .select('*')
      .order('nom_compte')
    if (error) {
      console.error('Erreur lors du chargement des comptes:', error)
      return
    }
    comptes.value = data
  }

  // Calculer les transactions du mois pour chaque compte
  const calculerTransactionsMois = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    let totalFixes = 0
    // Pour chaque compte
    const transactions = await Promise.all(comptes.value
      .filter(compte => compte.nom_compte.toLowerCase() !== 'cash')
      .map(async (compte) => {
        // 1. Récupérer les mensualités des projets
        const { data: projets } = await client
          .from('projets')
          .select('mensualite')
          .eq('compte_id', compte.id)
        const totalMensualites = projets?.reduce((sum, p) => sum + (p.mensualite || 0), 0) || 0
        // 2. Récupérer les dépenses projet du mois
        const { data: depenses } = await client
          .from('depenses_projet')
          .select('montant, projets!inner(compte_id)')
          .eq('projets.compte_id', compte.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('date', lastDayOfMonth.toISOString().split('T')[0])
        const totalDepenses = depenses?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0
        // 3. Récupérer les mouvements fixes
        const { data: mouvementsFixes } = await client
          .from('mouvements_fixes')
          .select('*')
          .eq('compte_id', compte.id)
          .eq('actif', true)
        const totalMouvementsFixes = mouvementsFixes?.reduce((sum, m) => {
          return sum + (m.type === 'depense' ? -m.montant : m.montant)
        }, 0) || 0
        // Ajout pour totalDepensesFixes (somme des dépenses fixes)
        const depensesFixes = mouvementsFixes?.filter(m => m.type === 'depense') || []
        totalFixes += depensesFixes.reduce((sum, m) => sum + m.montant, 0)
        // 4. Récupérer les mouvements variables mensuels
        const { data: mouvementsVariablesMensuels } = await client
          .from('mouvements_variables_mensuels')
          .select(`
            montant,
            mouvements_variables!inner (
              id,
              type,
              compte_id
            )
          `)
          .eq('mouvements_variables.compte_id', compte.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('date', lastDayOfMonth.toISOString().split('T')[0])
        let totalMouvementsVariables = 0
        if (mouvementsVariablesMensuels?.length > 0) {
          totalMouvementsVariables = mouvementsVariablesMensuels.reduce((sum, m) => {
            return sum + (m.mouvements_variables.type.toLowerCase() === 'depense' ? -m.montant : m.montant)
          }, 0)
        } else {
          const { data: mouvementsVariables } = await client
            .from('mouvements_variables')
            .select('*')
            .eq('compte_id', compte.id)
          totalMouvementsVariables = mouvementsVariables?.reduce((sum, m) => {
            return sum + (m.type.toLowerCase() === 'depense' ? -m.montant : m.montant)
          }, 0) || 0
        }
        // Calculer le solde final
        const solde = totalMensualites - totalDepenses + totalMouvementsFixes + totalMouvementsVariables
        // Générer le message selon le type de compte
        let message
        if (compte.nom_compte.toLowerCase().includes('pro')) {
          message = solde !== 0 ? `Prendre ${Math.abs(solde).toLocaleString('fr-FR')} € sur ${compte.nom_compte}` : `Aucun mouvement à faire sur ${compte.nom_compte}`
        } else {
          message = solde === 0 
            ? `Aucun mouvement à faire sur ${compte.nom_compte}`
            : solde > 0
              ? `Mettre ${Math.abs(solde).toLocaleString('fr-FR')} € sur ${compte.nom_compte}`
              : `Retirer ${Math.abs(solde).toLocaleString('fr-FR')} € du ${compte.nom_compte}`
        }
        return {
          compte,
          solde,
          message
        }
      }))
    transactionsMois.value = transactions
    transactionsFiltered.value = transactions.filter(t => t.solde !== 0)
    totalDepensesFixes.value = totalFixes
  }

  const loadTotalDepensesFixes = async () => {
    const { data, error } = await client
      .from('mouvements_fixes')
      .select('montant, type')
      .ilike('type', '%dépense%')
    if (error) {
      console.error('Erreur lors du chargement des mouvements fixes:', error)
      totalDepensesFixes.value = 0
      return
    }
    totalDepensesFixes.value = data?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0
  }

  return {
    comptes,
    transactionsMois,
    transactionsFiltered,
    loadComptes,
    calculerTransactionsMois,
    totalDepensesFixes,
    loadTotalDepensesFixes
  }
} 