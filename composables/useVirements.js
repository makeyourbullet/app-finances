import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export function useVirements() {
  const client = useSupabaseClient()
  const mouvementsVariablesEpargne = ref([])
  const virementsMoisCourant = ref([])
  const virement = ref({ source: null, cible: null, montant: '' })
  const loadingVirement = ref(false)
  const recepteursVirement = ref([])
  const mouvementsVariablesMap = ref({})

  // Charger les mouvements variables d'épargne
  const loadMouvementsVariablesEpargne = async () => {
    const { data, error } = await client
      .from('mouvements_variables')
      .select('*')
      .eq('nature', 'Épargne')
    if (error) {
      console.error('Erreur lors du chargement des mouvements variables épargne:', error)
      return
    }
    mouvementsVariablesEpargne.value = data || []
    mouvementsVariablesMap.value = Object.fromEntries((data || []).map(mv => [mv.id, mv.nom]))
  }

  // Charger les récepteurs de virement (ex: comptes, autres mouvements)
  const loadRecepteursVirement = async () => {
    // À adapter selon ta logique métier (ici, on prend tous les comptes)
    const { data, error } = await client
      .from('comptes')
      .select('id, nom_compte as nom')
    if (error) {
      console.error('Erreur lors du chargement des récepteurs de virement:', error)
      return
    }
    recepteursVirement.value = data || []
  }

  // Charger l'historique des virements du mois en cours
  const loadVirementsMoisCourant = async () => {
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const { data, error } = await client
      .from('virements_epargnes')
      .select('*')
      .gte('created_at', firstDayOfMonth.toISOString().split('T')[0])
      .lte('created_at', lastDayOfMonth.toISOString().split('T')[0])
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Erreur lors du chargement des virements:', error)
      return
    }
    virementsMoisCourant.value = data || []
  }

  // Calculer le montant total disponible pour un mouvement variable d'épargne
  const getMontantTotalMouvementVariableDashboard = async (mouvementId) => {
    // 1. Somme de tous les mouvements mensuels
    const { data: mvData } = await client
      .from('mouvements_variables_mensuels')
      .select('montant')
      .eq('mouvements_variables_id', mouvementId)
    const totalMouvement = (mvData || []).reduce((sum, m) => sum + (m.montant || 0), 0)

    // 2. Somme de tous les virements sortants/entrants
    const { data: virementData } = await client
      .from('virements_epargnes')
      .select('montant, mouvement_id')
      .eq('mouvement_id', mouvementId)
    const totalVirements = (virementData || []).reduce((sum, v) => sum + (v.montant || 0), 0)

    return totalMouvement + totalVirements
  }

  // Générateur UUID v4 pour le champ groupe
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Valider un virement
  const validerVirement = async () => {
    console.log('[VIREMENT] Appel de validerVirement', JSON.stringify(virement.value))
    if (!virement.value.source || !virement.value.cible || !virement.value.montant) {
      console.warn('[VIREMENT] Champs manquants', virement.value)
      alert('Veuillez remplir tous les champs du virement')
      return
    }
    loadingVirement.value = true
    try {
      const groupe = uuidv4() // Génère un identifiant unique pour la paire
      console.log('[VIREMENT] Groupe UUID généré:', groupe)
      const now = new Date().toISOString();

      // 1. Ligne de sortie (toujours)
      let compteLinked = virement.value.cible
      const cibleMouvement = mouvementsVariablesEpargne.value.find(mv => mv.id === virement.value.cible)
      if (cibleMouvement) {
        compteLinked = cibleMouvement.nom
      } else if (virement.value.cible === 'compte_pro') {
        compteLinked = 'Compte Pro'
      } else if (virement.value.cible === 'compte_perso') {
        compteLinked = 'Compte Perso'
      }
      const montant = Math.abs(parseFloat(virement.value.montant))
      const insertData = {
        mouvement_id: virement.value.source,
        compte_linked: compteLinked,
        montant: -montant,
        groupe,
        created_at: now,
        updated_at: now
      }
      console.log('[VIREMENT] Insertion ligne sortie:', insertData)
      await client.from('virements_epargnes').insert(insertData)

      // 2. Ligne d'entrée (si le récepteur n'est pas Compte Pro)
      if (virement.value.cible !== 'compte_pro') {
        let mouvementIdEntree = null
        let compteLinkedEntree = ''
        if (cibleMouvement) {
          // Si le récepteur est un mouvement d'épargne, on utilise son id
          mouvementIdEntree = virement.value.cible
          // Le compte_linked est le nom du mouvement source
          const sourceMouvement = mouvementsVariablesEpargne.value.find(mv => mv.id === virement.value.source)
          compteLinkedEntree = sourceMouvement ? sourceMouvement.nom : ''
        } else if (virement.value.cible === 'compte_perso') {
          // Si le récepteur est Compte Perso, on met "Autre revenu"
          mouvementIdEntree = null
          compteLinkedEntree = 'Autre revenu'
        }
        const insertEntree = {
          mouvement_id: mouvementIdEntree,
          compte_linked: compteLinkedEntree,
          montant: montant,
          groupe,
          created_at: now,
          updated_at: now
        }
        console.log('[VIREMENT] Insertion ligne entrée:', insertEntree)
        await client.from('virements_epargnes').insert(insertEntree)
      }

      virement.value = { source: null, cible: null, montant: '' }
      console.log('[VIREMENT] Virement validé, formulaire réinitialisé')
      await loadVirementsMoisCourant()
      console.log('[VIREMENT] Virements du mois rechargés')
    } catch (error) {
      console.error('Erreur lors de la validation du virement:', error)
      alert('Erreur lors de la validation du virement')
    } finally {
      loadingVirement.value = false
    }
  }

  // Supprimer un virement
  const supprimerVirement = async (v) => {
    if (!confirm('Voulez-vous vraiment supprimer ce virement ?')) return
    try {
      // Supprimer la ligne sélectionnée
      await client.from('virements_epargnes').delete().eq('id', v.id)

      // Supprimer toute autre ligne ayant exactement le même created_at
      await client
        .from('virements_epargnes')
        .delete()
        .neq('id', v.id)
        .eq('created_at', v.created_at)

      await loadVirementsMoisCourant()
    } catch (error) {
      console.error('Erreur lors de la suppression du virement:', error)
      alert('Erreur lors de la suppression du virement')
    }
  }

  return {
    mouvementsVariablesEpargne,
    virementsMoisCourant,
    virement,
    loadingVirement,
    recepteursVirement,
    mouvementsVariablesMap,
    loadMouvementsVariablesEpargne,
    loadRecepteursVirement,
    loadVirementsMoisCourant,
    getMontantTotalMouvementVariableDashboard,
    validerVirement,
    supprimerVirement
  }
} 