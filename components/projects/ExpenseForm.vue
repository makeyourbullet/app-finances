<template>
  <v-form ref="form" @submit.prevent="handleSubmit">
    <v-container>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.description"
            label="Description"
            :rules="[v => !!v || 'La description est requise']"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="formData.montant"
            label="Montant"
            type="number"
            :rules="[
              v => !!v || 'Le montant est requis',
              v => v > 0 || 'Le montant doit être positif',
              v => !isNaN(v) || 'Le montant doit être un nombre valide'
            ]"
            required
          ></v-text-field>
        </v-col>
        <template v-if="!isEdit">
          <v-col cols="12" sm="6">
            <v-menu
              v-model="menu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="formData.date"
                  label="Date"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  :rules="[v => !!v || 'La date est requise']"
                  required
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="formData.date"
                @update:model-value="menu = false"
              ></v-date-picker>
            </v-menu>
          </v-col>
          <v-col cols="12" sm="6">
            <v-switch
              v-model="formData.is_recurrent"
              label="Dépense récurrente"
              color="primary"
            ></v-switch>
          </v-col>
        </template>
        <v-col cols="12" sm="6" v-if="formData.is_recurrent || isEdit">
          <v-select
            v-model="formData.frequence"
            :items="[
              { title: 'Mensuel', value: 'mensuel' },
              { title: 'Bimestriel', value: 'bimestriel' },
              { title: 'Trimestriel', value: 'trimestriel' },
              { title: 'Annuel', value: 'annuel' },
              { title: 'Bisannuel', value: 'bisannuel' }
            ]"
            label="Fréquence"
            :rules="[v => (formData.is_recurrent || isEdit) && !!v || 'La fréquence est requise pour une dépense récurrente']"
            required
          ></v-select>
        </v-col>
      </v-row>
    </v-container>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="grey-darken-1"
        variant="text"
        @click="$emit('cancel')"
      >
        Annuler
      </v-btn>
      <v-btn
        color="primary"
        type="submit"
        :loading="loading"
      >
        {{ isEdit ? 'Modifier' : 'Ajouter' }}
      </v-btn>
    </v-card-actions>
  </v-form>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  projetId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['submit', 'cancel'])

const client = useSupabaseClient()
const form = ref(null)
const menu = ref(false)
const loading = ref(false)

// Debug: Log initialData and its properties
console.log('ExpenseForm: Initial props.initialData:', props.initialData)
console.log('ExpenseForm: Initial props.isEdit:', props.isEdit)
console.log('ExpenseForm: Initial props.initialData.is_recurrent:', props.initialData?.is_recurrent)

const formData = ref({
  description: props.initialData?.description || '',
  montant: props.initialData?.montant || null,
  date: props.initialData?.date || new Date().toISOString().split('T')[0],
  frequence: props.initialData?.frequence || 'mensuel',
  is_recurrent: props.initialData?.is_recurrent || false,
})

// Debug: Log formData after initial setup
console.log('ExpenseForm: Initial formData:', formData.value)

// Watch for changes in initialData prop
watchEffect(() => {
  if (props.initialData) {
    console.log('ExpenseForm: watchEffect - props.initialData changed:', props.initialData)
    formData.value = {
      description: props.initialData.description || '',
      montant: props.initialData.montant || null,
      date: props.initialData.date || new Date().toISOString().split('T')[0],
      frequence: props.initialData.frequence || 'mensuel',
      is_recurrent: props.initialData.is_recurrent || false,
    }
    console.log('ExpenseForm: watchEffect - formData updated to:', formData.value)
  }
})

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  try {
    console.log('handleSubmit: Début de la soumission.')
    console.log('handleSubmit: props.isEdit =', props.isEdit)
    console.log('handleSubmit: props.initialData =', props.initialData)
    console.log('handleSubmit: props.initialData.is_recurrent =', props.initialData ? props.initialData.is_recurrent : 'N/A')
    console.log('handleSubmit: formData.value.is_recurrent =', formData.value.is_recurrent)

    if (props.isEdit && props.initialData && props.initialData.is_recurrent) {
      // 1. Mettre à jour la dépense récurrente parente dans depenses_projet_recurrentes
      console.log('Mise à jour de la dépense récurrente parente dans depenses_projet_recurrentes...', props.initialData.id)
      const { error: updateRecurringError } = await client
        .from('depenses_projet_recurrentes')
        .update({
          description: formData.value.description,
          montant: formData.value.montant,
          frequence: formData.value.frequence,
        })
        .eq('id', props.initialData.id)

      if (updateRecurringError) {
        console.error('Erreur lors de la mise à jour de la dépense récurrente parente:', updateRecurringError);
        throw updateRecurringError;
      }
      console.log('Dépense récurrente parente mise à jour avec succès.')

      // Après la mise à jour de la dépense parente, nous supprimons et régénérons les occurrences.
      // La logique ci-dessous s'appliquera. Il est important de passer la nouvelle description.

      // Obtenir le premier jour du mois en cours (en UTC pour éviter les décalages horaires)
      const aujourdhui = new Date();
      const premierJourMois = new Date(Date.UTC(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1));
      const dateDebutString = premierJourMois.toISOString().split('T')[0];

      console.log('Date actuelle:', aujourdhui.toISOString());
      console.log('Date de début pour les nouvelles occurrences (attendue - premier jour du mois UTC): ', dateDebutString);
      console.log('Nouvelle fréquence:', formData.value.frequence);
      console.log('Description de la dépense (actuelle dans le formulaire):', formData.value.description); // Utiliser la nouvelle description

      // Déterminer la description à utiliser pour la suppression des anciennes occurrences.
      // Si c'est une édition de dépense récurrente, on se base sur l'ancienne description pour la suppression.
      const descriptionToTargetForDeletion = (props.isEdit && props.initialData && props.initialData.is_recurrent) ? props.initialData.description : formData.value.description;
      console.log('Description ciblée pour la suppression:', descriptionToTargetForDeletion);

      // Récupérer TOUTES les dépenses existantes avec la description ciblée et le même projet_id
      const { data: allExistingExpenses, error: errorAllExisting } = await client
        .from('depenses_projet')
        .select('id, date, description, projet_id, montant')
        .eq('projet_id', props.projetId)
        .eq('description', descriptionToTargetForDeletion); 

      if (errorAllExisting) {
        console.error('Erreur lors de la récupération de toutes les dépenses existantes avant suppression:', errorAllExisting);
        throw errorAllExisting;
      }
      console.log('Toutes les dépenses existantes pour cette description/projet avant suppression:', allExistingExpenses);

      // Supprimer TOUTES les occurrences de la même description et du même projet_id
      const { error: deleteError } = await client
        .from('depenses_projet')
        .delete()
        .match({
          projet_id: props.projetId,
          description: descriptionToTargetForDeletion // Utiliser la description ciblée pour la suppression
        });

      if (deleteError) {
        console.error('Erreur lors de la suppression des occurrences:', deleteError);
        throw deleteError;
      }
      console.log('Suppression des anciennes occurrences réussie pour la description:', descriptionToTargetForDeletion);

      // Vérifier les dépenses après suppression (doit être vide pour cette description/projet)
      const { data: depensesApresSuppression, error: errorApresSuppression } = await client
        .from('depenses_projet')
        .select('id, date, description, projet_id, montant')
        .eq('projet_id', props.projetId)
        .eq('description', descriptionToTargetForDeletion); // Vérifier avec la description ciblée
      
      if (errorApresSuppression) {
        console.error('Erreur lors de la vérification après suppression:', errorApresSuppression);
        throw errorApresSuppression;
      }
      console.log('Dépenses existantes après suppression (doit être vide pour', descriptionToTargetForDeletion, '):', depensesApresSuppression);

      const nouvellesDepenses = [];
      let currentDate = new Date(premierJourMois); // Démarrer à partir du premier jour du mois en cours
      
      // Calculer le nombre d'occurrences en fonction de la fréquence (comme défini précédemment)
      let nombreOccurrences;
      switch (formData.value.frequence) {
        case 'mensuel':
          nombreOccurrences = 12;
          break;
        case 'bimestriel':
          nombreOccurrences = 6;
          break;
        case 'trimestriel':
          nombreOccurrences = 4;
          break;
        case 'annuel':
          nombreOccurrences = 1; // Pour annuel, on génère 1 occurrence pour les 12 prochains mois
          break;
        case 'bisannuel':
          nombreOccurrences = 1; // Pour bisannuel, on génère 1 occurrence pour les 12 prochains mois
          break;
        default:
          nombreOccurrences = 12; // Par défaut à 12 si la fréquence n'est pas reconnue
      }

      console.log('Nombre d\'occurrences à générer:', nombreOccurrences);

      // Générer les occurrences
      for (let i = 0; i < nombreOccurrences; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`Génération de la dépense ${i + 1} pour la date:`, dateStr);

        nouvellesDepenses.push({
          projet_id: props.projetId,
          description: formData.value.description, // Utiliser la nouvelle description ici
          montant: formData.value.montant,
          date: dateStr
        });

        // Calculer la prochaine date
        const nextDate = new Date(currentDate); // Créer un nouvel objet Date pour éviter de modifier currentDate directement
        switch (formData.value.frequence) {
          case 'mensuel':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'bimestriel':
            nextDate.setMonth(nextDate.getMonth() + 2);
            break;
          case 'trimestriel':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'annuel':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          case 'bisannuel':
            nextDate.setFullYear(nextDate.getFullYear() + 2);
            break;
        }
        currentDate = nextDate;
      }

      console.log('Nouvelles dépenses à créer:', nouvellesDepenses);

      // Insérer les nouvelles occurrences
      const { error: insertError } = await client
        .from('depenses_projet')
        .insert(nouvellesDepenses);

      if (insertError) {
        console.error('Erreur lors de l\'insertion des nouvelles occurrences:', insertError);
        throw insertError;
      }
      console.log('Insertion des nouvelles occurrences réussie.');

      // Vérifier les dépenses finales (devrait contenir exactement le nombre généré)
      const { data: depensesFinales, error: errorFinales } = await client
        .from('depenses_projet')
        .select('id, date, description, projet_id, montant')
        .eq('projet_id', props.projetId)
        .eq('description', formData.value.description) // Requête avec la nouvelle description
        .order('date', { ascending: true });

      if (errorFinales) {
        console.error('Erreur lors de la vérification finale après insertion:', errorFinales);
        throw errorFinales;
      }
      console.log('Dépenses finales après insertion:', depensesFinales);

    } else if (!props.isEdit && formData.value.is_recurrent) { // Nouvel ajout récurrent
      // Insérer dans la table des dépenses récurrentes
      console.log('Ajout d\'une nouvelle dépense récurrente à depenses_projet_recurrentes.');
      const { data: newRecurringExpense, error: insertRecurringError } = await client
        .from('depenses_projet_recurrentes')
        .insert([{
          projet_id: props.projetId,
          description: formData.value.description,
          montant: formData.value.montant,
          date_debut: formData.value.date,
          frequence: formData.value.frequence
        }])
        .select()
        .single();

      if (insertRecurringError) {
        console.error('Erreur lors de l\'ajout de la nouvelle dépense récurrente:', insertRecurringError);
        throw insertRecurringError;
      }
      console.log('Nouvelle dépense récurrente ajoutée:', newRecurringExpense);

      // Générer et insérer les occurrences initiales pour cette nouvelle dépense récurrente
      console.log('Génération des occurrences initiales pour la nouvelle dépense récurrente.');
      const nouvellesDepenses = [];
      let currentDate = new Date(formData.value.date); // La date de début de l'occurrence récurrente
      let nombreOccurrences;

      switch (formData.value.frequence) {
        case 'mensuel':
          nombreOccurrences = 12;
          break;
        case 'bimestriel':
          nombreOccurrences = 6;
          break;
        case 'trimestriel':
          nombreOccurrences = 4;
          break;
        case 'annuel':
          nombreOccurrences = 1;
          break;
        case 'bisannuel':
          nombreOccurrences = 1;
          break;
        default:
          nombreOccurrences = 12;
      }

      for (let i = 0; i < nombreOccurrences; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        nouvellesDepenses.push({
          projet_id: props.projetId,
          description: formData.value.description,
          montant: formData.value.montant,
          date: dateStr
        });

        const nextDate = new Date(currentDate);
        switch (formData.value.frequence) {
          case 'mensuel':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'bimestriel':
            nextDate.setMonth(nextDate.getMonth() + 2);
            break;
          case 'trimestriel':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'annuel':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          case 'bisannuel':
            nextDate.setFullYear(nextDate.getFullYear() + 2);
            break;
        }
        currentDate = nextDate;
      }

      const { error: insertOccurrencesError } = await client
        .from('depenses_projet')
        .insert(nouvellesDepenses);

      if (insertOccurrencesError) {
        console.error('Erreur lors de l\'insertion des occurrences pour la nouvelle dépense récurrente:', insertOccurrencesError);
        throw insertOccurrencesError;
      }
      console.log('Occurrences initiales générées et insérées.');

    } else { // Nouvel ajout non récurrent
      console.log('Ajout d\'une nouvelle dépense non récurrente à depenses_projet.');
      const { data, error } = await client
        .from('depenses_projet')
        .insert([{
          projet_id: props.projetId,
          description: formData.value.description,
          montant: formData.value.montant,
          date: formData.value.date
        }])
        .select()

      if (error) {
        console.error('Erreur lors de l\'ajout de la dépense non récurrente:', error);
        throw error;
      }
      console.log('Dépense non récurrente ajoutée:', data);
    }

    // Émettre l'événement de soumission pour déclencher le rechargement des données dans le composant parent
    emit('submit');

  } catch (error) {
    console.error('Erreur inattendue lors de la soumission de la dépense:', error);
    alert('Une erreur est survenue lors de l\'enregistrement de la dépense: ' + error.message);
  } finally {
    loading.value = false;
  }
}
</script> 