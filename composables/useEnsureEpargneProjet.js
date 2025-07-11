import { useSupabaseClient } from '#imports'

export default async function useEnsureEpargneProjet() {
  const supabase = useSupabaseClient();
  const now = new Date();

  // Date du mois courant (toujours au 1er du mois)
  const moisCourant = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const dateMoisCourant = `${moisCourant}-01`;

  // Date du mois précédent (toujours au 1er du mois)
  const moisPrecedentDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const moisPrecedent = moisPrecedentDate.getFullYear() + '-' + String(moisPrecedentDate.getMonth() + 1).padStart(2, '0');
  const dateMoisPrecedent = `${moisPrecedent}-01`;
  // Calcul du dernier jour du mois précédent
  const dernierJourMoisPrecedent = new Date(moisPrecedentDate.getFullYear(), moisPrecedentDate.getMonth() + 1, 0).getDate();
  const dateFinMoisPrecedent = `${moisPrecedent}-${String(dernierJourMoisPrecedent).padStart(2, '0')}`;

  // 1. Récupérer tous les projets
  const { data: projets, error: projetsError } = await supabase.from('projets').select('*');
  if (projetsError) throw projetsError;

  for (const projet of projets) {
    // 2. Vérifier s'il y a déjà une ligne pour ce projet et ce mois courant
    const { data: epargneExist, error: existError } = await supabase
      .from('epargne_projet')
      .select('id')
      .eq('projet_id', projet.id)
      .eq('date', dateMoisCourant);
    if (existError) throw existError;

    if (!epargneExist || epargneExist.length === 0) {
      // 3. Récupérer le montant_cumul du mois précédent (date exacte)
      const { data: epargnePrecedente, error: prevError } = await supabase
        .from('epargne_projet')
        .select('montant_cumul')
        .eq('projet_id', projet.id)
        .eq('date', dateMoisPrecedent)
        .limit(1);
      if (prevError) throw prevError;
      const montantPrecedent = epargnePrecedente?.[0]?.montant_cumul || 0;

      // 4. Récupérer la somme des dépenses du mois précédent pour ce projet (toutes les dates du mois)
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses_projet')
        .select('montant')
        .eq('projet_id', projet.id)
        .gte('date', dateMoisPrecedent)
        .lte('date', dateFinMoisPrecedent);
      if (depensesError) throw depensesError;
      // Somme des montants des dépenses
      const totalDepenses = depenses?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0;

      // 5. Calculer le nouveau montant_cumul
      const nouveauMontant = montantPrecedent + (projet.mensualite || 0) - totalDepenses;

      // 6. Créer la nouvelle ligne pour le mois courant
      const { error: insertError } = await supabase.from('epargne_projet').insert([
        {
          projet_id: projet.id,
          date: dateMoisCourant,
          montant_cumul: nouveauMontant,
        },
      ]);
      if (insertError) throw insertError;
    }
  }
} 