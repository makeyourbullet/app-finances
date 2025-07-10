<template>
  <v-container fluid>
    <v-row>
      <!-- Première colonne -->
      <v-col cols="12" md="4">
        <!-- Variables du mois -->
        <v-card class="mb-4">
          <v-card-title>Variables du mois</v-card-title>
          <v-card-text>
            <v-form ref="variablesForm">
              <v-table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-right">Montant du mois</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Mouvements variables -->
                  <template v-for="mouvement in mouvementsVariables" :key="`mv-${mouvement.id}`">
                    <tr>
                      <td>{{ mouvement.nom }}</td>
                      <td>
                        <v-text-field
                          v-model="montantsMensuels[mouvement.id]"
                          type="text"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="montant-input"
                          :placeholder="formatAmount(mouvement.montant)"
                        ></v-text-field>
                      </td>
                    </tr>
                  </template>

                  <!-- Dépenses projet -->
                  <template v-for="depense in depensesProjets" :key="`dp-${depense.id}`">
                    <tr>
                      <td>{{ depense.description }} ({{ depense.projet.nom_projet }})</td>
                      <td>
                        <v-text-field
                          v-model="montantsDepenses[depense.id]"
                          type="text"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="montant-input"
                          :placeholder="formatAmount(depense.montant)"
                        ></v-text-field>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </v-table>

              <v-btn
                color="primary"
                block
                class="mt-4"
                @click="sauvegarderMontants"
                :loading="loading"
              >
                Valider les montants du mois
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Transactions du mois -->
        <v-card>
          <v-card-title>Transactions du mois</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Compte</th>
                  <th class="text-right">Solde à transférer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in transactionsFiltered" :key="transaction.compte.id">
                  <td>{{ transaction.compte.nom_compte }}</td>
                  <td class="text-right">
                    <div :class="{ 
                      'text-success': transaction.solde > 0,
                      'text-error': transaction.solde < 0
                    }">
                      {{ transaction.message }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Deuxième colonne : Budget courses puis Budget disponible -->
      <v-col cols="12" md="4">
        <!-- Suivi du budget courses -->
        <v-card>
          <v-card-title>Suivi du budget courses</v-card-title>
          <v-card-text>
            <!-- Budget total du mois -->
            <div class="mb-4">
              <div class="text-subtitle-1">Budget total du mois</div>
              <div class="text-h5">{{ formatAmount(budgetCoursesTotal) }} €</div>
            </div>

            <!-- Formulaire d'ajout de dépense -->
            <v-form @submit.prevent="ajouterDepenseCourses" ref="depenseCoursesForm">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="nouvelleDepenseCourses.montant"
                    label="Montant"
                    type="text"
                    density="compact"
                    variant="outlined"
                    :rules="[v => !!v || 'Montant requis', v => !isNaN(parseFloat(v.replace(',', '.'))) || 'Montant invalide']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="nouvelleDepenseCourses.description"
                    label="Description"
                    type="text"
                    density="compact"
                    variant="outlined"
                    :rules="[v => !!v || 'Description requise']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn
                color="primary"
                block
                type="submit"
                :loading="loadingDepenseCourses"
              >
                Ajouter la dépense
              </v-btn>
            </v-form>

            <!-- Liste des dépenses -->
            <v-table class="mt-4">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th class="text-right">Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="depense in depensesCourses" :key="depense.id">
                  <td>{{ formatDate(depense.date) }}</td>
                  <td>{{ depense.description }}</td>
                  <td class="text-right">{{ formatAmount(depense.montant) }} €</td>
                  <td class="text-right">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click="supprimerDepenseCourses(depense.id)"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" class="text-right font-weight-bold">Total dépensé</td>
                  <td class="text-right font-weight-bold">{{ formatAmount(totalDepensesCourses) }} €</td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="2" class="text-right font-weight-bold">Reste à dépenser</td>
                  <td class="text-right font-weight-bold" :class="{
                    'text-success': resteBudgetCourses > 0,
                    'text-error': resteBudgetCourses < 0
                  }">
                    {{ formatAmount(resteBudgetCourses) }} €
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </v-table>
          </v-card-text>
        </v-card>
        <!-- Suivi du budget disponible -->
        <v-card class="mt-4">
          <v-card-title>Budget disponible</v-card-title>
          <v-card-text>
            <!-- Budget total du mois -->
            <div class="mb-4">
              <div class="text-subtitle-1">Budget disponible du mois</div>
              <div class="text-h5" :class="{
                'text-success': budgetDisponible > 0,
                'text-error': budgetDisponible < 0
              }">{{ formatAmount(budgetDisponible) }} €</div>
            </div>

            <!-- Formulaire d'ajout de dépense -->
            <v-form @submit.prevent="ajouterDepensePerso" ref="depensePersoForm">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="nouvelleDepensePerso.montant"
                    label="Montant"
                    type="text"
                    density="compact"
                    variant="outlined"
                    :rules="[v => !!v || 'Montant requis', v => !isNaN(parseFloat(v.replace(',', '.'))) || 'Montant invalide']"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="nouvelleDepensePerso.description"
                    label="Description"
                    type="text"
                    density="compact"
                    variant="outlined"
                    :rules="[v => !!v || 'Description requise']"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn
                color="primary"
                block
                type="submit"
                :loading="loadingDepensePerso"
              >
                Ajouter la dépense
              </v-btn>
            </v-form>

            <!-- Liste des dépenses -->
            <v-table class="mt-4">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th class="text-right">Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="depense in depensesPerso" :key="depense.id">
                  <td>{{ formatDate(depense.date) }}</td>
                  <td>{{ depense.description }}</td>
                  <td class="text-right">{{ formatAmount(depense.montant) }} €</td>
                  <td class="text-right">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click="supprimerDepensePerso(depense.id)"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" class="text-right font-weight-bold">Total dépensé</td>
                  <td class="text-right font-weight-bold">{{ formatAmount(totalDepensesPerso) }} €</td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="2" class="text-right font-weight-bold">Reste à dépenser</td>
                  <td class="text-right font-weight-bold" :class="{
                    'text-success': resteBudgetPerso > 0,
                    'text-error': resteBudgetPerso < 0
                  }">
                    {{ formatAmount(resteBudgetPerso) }} €
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Troisième colonne : Dépenses, Notes, Virement -->
      <v-col cols="12" md="4">
        <!-- Encart Dépenses -->
        <v-card class="mb-4">
          <v-card-title>Dépenses</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Alloué aux projets</v-list-item-title>
                <v-list-item-subtitle>{{ formatAmount(totalDepensesProjets) }} €</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Mouvements fixes</v-list-item-title>
                <v-list-item-subtitle>{{ formatAmount(totalDepensesFixes) }} €</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Mouvements variables</v-list-item-title>
                <v-list-item-subtitle>{{ formatAmount(totalDepensesVariables) }} €</v-list-item-subtitle>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Total Dépenses</v-list-item-title>
                <v-list-item-subtitle class="font-weight-bold">
                  {{ formatAmount(totalDepensesProjets + totalDepensesFixes + totalDepensesVariables) }} €
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Encart Notes -->
        <v-card class="mb-4">
          <v-card-title>Notes</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="sauvegarderNote" ref="noteForm">
              <v-textarea
                v-model="note"
                label="Écrire une note..."
                rows="4"
                auto-grow
                outlined
                class="mb-2"
              ></v-textarea>
              <v-btn color="primary" type="submit" :loading="loadingNote">Sauvegarder</v-btn>
            </v-form>
            <div v-if="notesList.length > 0" class="mt-4">
              <v-list>
                <v-list-item v-for="n in notesList" :key="n.id" class="align-start">
                  <div class="d-flex flex-column w-100">
                    <div v-if="editNoteId !== n.id">
                      <div style="white-space: pre-line">{{ n.notes }}</div>
                      <div class="text-caption text-grey">{{ formatDate(n.created_at) }}</div>
                    </div>
                    <div v-else>
                      <v-textarea v-model="editNoteContent" rows="2" auto-grow outlined></v-textarea>
                      <v-btn size="small" color="primary" @click="updateNote(n.id)">Enregistrer</v-btn>
                      <v-btn size="small" @click="cancelEditNote">Annuler</v-btn>
                    </div>
                  </div>
                  <template #append>
                    <v-btn icon="mdi-pencil" size="small" variant="text" @click="startEditNote(n)"></v-btn>
                    <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteNote(n.id)"></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>

        <!-- Encart Virement -->
        <v-card>
          <v-card-title>Virement</v-card-title>
          <v-card-text>
            <!-- Liste des mouvements variables épargne et leur montant -->
            <div class="mb-4">
              <div class="text-subtitle-1">Épargne disponible par mouvement</div>
              <v-row>
                <v-col cols="12" sm="6" v-for="(mv, idx) in mouvementsVariablesEpargne" :key="mv.id">
                  <div class="d-flex justify-space-between align-center">
                    <span>{{ mv.nom }}</span>
                    <span :class="{ 'text-error': getMontantTotalMouvementVariableDashboard(mv.id) < 0 }">
                      {{ formatAmount(getMontantTotalMouvementVariableDashboard(mv.id)) }} €
                    </span>
                  </div>
                </v-col>
              </v-row>
            </div>
            <v-form @submit.prevent="validerVirement" ref="virementForm">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="virement.source"
                    :items="mouvementsVariablesEpargne"
                    item-title="nom"
                    item-value="id"
                    label="Source (épargne)"
                    :rules="[v => !!v || 'Source requise']"
                    required
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="virement.cible"
                    :items="recepteursVirement"
                    item-title="nom"
                    item-value="id"
                    label="Récepteur"
                    :rules="[v => !!v || 'Récepteur requis']"
                    required
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="virement.montant"
                    label="Montant (€)"
                    type="number"
                    :rules="[
                      v => !!v || 'Montant requis',
                      v => v > 0 || 'Le montant doit être positif',
                      v => v <= (getMontantTotalMouvementVariableDashboard(virement.source) || 0) || 'Montant supérieur au disponible'
                    ]"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn color="primary" block type="submit" :loading="loadingVirement">Valider le virement</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'

const client = useSupabaseClient()
const loading = ref(false)
const mouvementsVariables = ref([])
const depensesProjets = ref([])
const montantsMensuels = ref({})
const montantsDepenses = ref({})
const variablesForm = ref(null)
const comptes = ref([])
const transactionsMois = ref([])
const transactionsFiltered = ref([])
const budgetCoursesTotal = ref(0)
const totalDepensesCourses = ref(0)
const resteBudgetCourses = ref(0)
const budgetDisponible = ref(0)
const totalDepensesPerso = ref(0)
const resteBudgetPerso = ref(0)
const nouvelleDepenseCourses = ref({})
const nouvelleDepensePerso = ref({})
const depenseCoursesForm = ref(null)
const depensePersoForm = ref(null)
const loadingDepenseCourses = ref(false)
const loadingDepensePerso = ref(false)
const depensesCourses = ref([])
const depensesPerso = ref([])
const mouvementCoursesId = ref(null)
const mouvementSalaireId = ref(null)

// Dépenses globales
const totalDepensesProjets = ref(0)
const totalDepensesFixes = ref(0)
const totalDepensesVariables = ref(0)

const calculerRecapDepenses = async () => {
  // 1. Somme allouée aux projets (mensualités)
  const { data: projets } = await client
    .from('projets')
    .select('mensualite')
  totalDepensesProjets.value = projets?.reduce((sum, p) => sum + (p.mensualite || 0), 0) || 0

  // 2. Somme des mouvements fixes (tous les actifs)
  const { data: mouvementsFixes } = await client
    .from('mouvements_fixes')
    .select('montant')
    .eq('actif', true)
  totalDepensesFixes.value = mouvementsFixes?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0

  // 3. Somme des mouvements variables (logique spéciale)
  // a. Récupérer tous les mouvements variables
  const { data: mouvementsVariables } = await client
    .from('mouvements_variables')
    .select('id, montant, type')
  // b. Récupérer les montants mensuels pour le mois en cours
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const { data: mouvementsVariablesMensuels } = await client
    .from('mouvements_variables_mensuels')
    .select('mouvements_variables_id, montant')
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0])
  // c. Pour chaque mouvement variable de type "dépense", prendre le montant mensuel s'il existe, sinon le montant de base
  let total = 0
  if (mouvementsVariables) {
    for (const mv of mouvementsVariables) {
      if (mv.type && mv.type.toLowerCase() === 'dépense') {
        const mensuel = mouvementsVariablesMensuels?.find(m => m.mouvements_variables_id === mv.id)
        total += mensuel ? mensuel.montant : (mv.montant || 0)
      }
    }
  }
  totalDepensesVariables.value = total
}

// Charger les mouvements variables
const loadMouvementsVariables = async () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  console.log('Période recherchée:', {
    debut: firstDayOfMonth.toISOString().split('T')[0],
    fin: lastDayOfMonth.toISOString().split('T')[0]
  })

  // 1. Vérifier s'il y a des mouvements variables mensuels pour ce mois
  const { data: montantsMensuelsData, error: mensuelsError } = await client
    .from('mouvements_variables_mensuels')
    .select(`
      id,
      date,
      montant,
      mouvements_variables_id,
      mouvements_variables!inner (
        id,
        nom,
        type,
        compte_id,
        nature
      )
    `)
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0])

  console.log('Montants mensuels trouvés:', montantsMensuelsData)

  if (mensuelsError) {
    console.error('Erreur lors du chargement des montants mensuels:', mensuelsError)
    return
  }

  // 2. Si on a des mouvements mensuels pour ce mois, on les utilise
  if (montantsMensuelsData && montantsMensuelsData.length > 0) {
    console.log('Utilisation des montants mensuels')
    mouvementsVariables.value = montantsMensuelsData.map(mensuel => {
      const mouvement = {
        id: mensuel.mouvements_variables.id,
        nom: mensuel.mouvements_variables.nom,
        type: mensuel.mouvements_variables.type,
        compte_id: mensuel.mouvements_variables.compte_id,
        montant: mensuel.montant,
        nature: mensuel.mouvements_variables.nature // <-- ajout nature
      }
      console.log('Mouvement mensuel traité:', mouvement)
      return mouvement
    }).sort((a, b) => a.nom.localeCompare(b.nom))

    // Initialiser les montants mensuels avec les montants mensuels existants
    montantsMensuels.value = {}
    mouvementsVariables.value.forEach(mouvement => {
      montantsMensuels.value[mouvement.id] = mouvement.montant.toString()
      console.log(`Initialisation montant pour ${mouvement.nom}:`, mouvement.montant)
    })
  } 
  // 3. Sinon, on utilise les montants de base de mouvements_variables
  else {
    console.log('Aucun montant mensuel trouvé, utilisation des montants de base')
    const { data: mouvementsData, error: mouvementsError } = await client
      .from('mouvements_variables')
      .select('*')
      .order('nom')

    if (mouvementsError) {
      console.error('Erreur lors du chargement des mouvements variables:', mouvementsError)
      return
    }

    console.log('Mouvements de base chargés:', mouvementsData)
    mouvementsVariables.value = mouvementsData
    
    // Initialiser les montants mensuels avec les montants de base
    montantsMensuels.value = {}
    mouvementsData.forEach(mouvement => {
      montantsMensuels.value[mouvement.id] = mouvement.montant.toString()
    })
  }
}

// Charger les dépenses projet prévues pour ce mois
const loadDepensesProjets = async () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data, error } = await client
    .from('depenses_projet')
    .select(`
      *,
      projet:projets(nom_projet)
    `)
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
  const dateStr = firstDayOfMonth.toISOString().split('T')[0]

  // Pour chaque compte
  const transactions = await Promise.all(comptes.value
    .filter(compte => compte.nom_compte.toLowerCase() !== 'cash') // Exclure le compte cash
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
        // Utiliser les montants mensuels s'ils existent
        totalMouvementsVariables = mouvementsVariablesMensuels.reduce((sum, m) => {
          return sum + (m.mouvements_variables.type.toLowerCase() === 'depense' ? -m.montant : m.montant)
        }, 0)
      } else {
        // Sinon, utiliser les montants de base
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
  // Ne garder que les transactions avec un solde non nul
  transactionsFiltered.value = transactions.filter(t => t.solde !== 0)
}

// Sauvegarder tous les montants
const sauvegarderMontants = async () => {
  console.log('Début de sauvegarderMontants')
  console.log('État initial:', {
    mouvementsVariables: mouvementsVariables.value,
    montantsMensuels: montantsMensuels.value,
    depensesProjets: depensesProjets.value,
    montantsDepenses: montantsDepenses.value
  })

  loading.value = true
  const currentDate = new Date()
  // Utiliser le premier jour du mois comme date de référence
  const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
  console.log('Date de référence:', dateStr)

  try {
    // 1. Sauvegarder les mouvements variables mensuels
    for (const mouvement of mouvementsVariables.value) {
      const montantSaisi = montantsMensuels.value[mouvement.id]
      console.log('Montant saisi pour', mouvement.nom, ':', montantSaisi)
      
      let montantFinal
      if (montantSaisi) {
        // Nettoyer la valeur saisie
        const montantNettoye = montantSaisi.replace(/[^\d,.-]/g, '').replace(',', '.')
        montantFinal = parseFloat(montantNettoye)
        console.log('Montant nettoyé pour', mouvement.nom, ':', montantFinal)
      } else {
        montantFinal = mouvement.montant
        console.log('Utilisation du montant par défaut pour', mouvement.nom, ':', montantFinal)
      }

      if (isNaN(montantFinal)) {
        console.error('Montant invalide pour', mouvement.nom, ':', montantSaisi)
        throw new Error(`Montant invalide pour ${mouvement.nom}: ${montantSaisi}`)
      }

      // Vérifier si l'entrée existe déjà
      const { data: existingEntry } = await client
        .from('mouvements_variables_mensuels')
        .select('id')
        .eq('mouvements_variables_id', mouvement.id)
        .eq('date', dateStr)
        .single()

      if (existingEntry) {
        // Mise à jour de l'entrée existante
        console.log('Mise à jour de l\'entrée existante pour', mouvement.nom)
        const { error: updateError } = await client
          .from('mouvements_variables_mensuels')
          .update({ montant: montantFinal })
          .eq('id', existingEntry.id)

        if (updateError) {
          console.error('Erreur mise à jour:', updateError)
          throw updateError
        }
      } else {
        // Création d'une nouvelle entrée
        console.log('Création d\'une nouvelle entrée pour', mouvement.nom)
        const { error: insertError } = await client
          .from('mouvements_variables_mensuels')
          .insert({
            mouvements_variables_id: mouvement.id,
            date: dateStr,
            montant: montantFinal
          })

        if (insertError) {
          console.error('Erreur insertion:', insertError)
          throw insertError
        }
      }
    }

    // 2. Mettre à jour les dépenses projet
    for (const depense of depensesProjets.value) {
      const montantSaisi = montantsDepenses.value[depense.id]
      if (montantSaisi) {
        // Nettoyer la valeur saisie
        const montantNettoye = montantSaisi.replace(/[^\d,.-]/g, '').replace(',', '.')
        const montantFinal = parseFloat(montantNettoye)
        
        if (isNaN(montantFinal)) {
          console.error('Montant invalide pour dépense', depense.id, ':', montantSaisi)
          throw new Error(`Montant invalide pour dépense ${depense.id}: ${montantSaisi}`)
        }

        console.log('Mise à jour dépense projet:', depense.id, montantFinal)
        const { error: updateError } = await client
          .from('depenses_projet')
          .update({ montant: montantFinal })
          .eq('id', depense.id)

        if (updateError) {
          console.error('Erreur mise à jour dépense:', updateError)
          throw updateError
        }
      }
    }

    // 3. Recalculer les transactions du mois
    await calculerTransactionsMois()

    // Recharger les données
    await Promise.all([
      loadMouvementsVariables(),
      loadDepensesProjets()
    ])

    // Recalculer le récapitulatif des dépenses
    await calculerRecapDepenses()
    // Recalculer le budget disponible
    await calculerBudgetDisponible()
    // Recalculer le budget courses
    await loadBudgetCourses()

    console.log('Sauvegarde terminée avec succès')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des montants:', error)
    // Afficher l'erreur à l'utilisateur
    alert(`Erreur lors de la sauvegarde: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// Formater les montants
const formatAmount = (amount) => {
  if (!amount) return '0'
  return amount.toLocaleString('fr-FR')
}

// Formater la date
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

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
    console.log('Budget courses mensuel trouvé:', montantMensuel)
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
    console.log('Budget courses de base trouvé:', montantBase)
  }

  // Recalculer le reste à dépenser après mise à jour du budget courses
  if (depensesCourses.value.length > 0) {
    resteBudgetCourses.value = budgetCoursesTotal.value - totalDepensesCourses.value
    console.log('Mise à jour du reste à dépenser courses:', {
      budgetTotal: budgetCoursesTotal.value,
      totalDepenses: totalDepensesCourses.value,
      reste: resteBudgetCourses.value
    })
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
    console.error('Erreur lors du chargement des dépenses courses:', error)
    return
  }

  depensesCourses.value = data || []
  totalDepensesCourses.value = data?.reduce((sum, d) => sum + d.montant, 0) || 0
  resteBudgetCourses.value = budgetCoursesTotal.value - totalDepensesCourses.value
  console.log('Calcul budget courses:', {
    total: budgetCoursesTotal.value,
    depenses: totalDepensesCourses.value,
    reste: resteBudgetCourses.value
  })
}

// Ajouter une dépense courses
const ajouterDepenseCourses = async () => {
  if (!depenseCoursesForm.value.validate()) return
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
    nouvelleDepenseCourses.value = {
      montant: '',
      description: ''
    }
    depenseCoursesForm.value.reset()

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

    // Recharger les dépenses
    await loadDepensesCourses()
    await loadBudgetCourses()
  } catch (error) {
    console.error('Erreur lors de la suppression de la dépense:', error)
    alert('Erreur lors de la suppression de la dépense')
  }
}

// Charger les dépenses personnelles du mois
const loadDepensesPerso = async () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data, error } = await client
    .from('suivi_budget')
    .select('*')
    .eq('mouvement_id', mouvementSalaireId.value)
    .gte('date', firstDayOfMonth.toISOString().split('T')[0])
    .lte('date', lastDayOfMonth.toISOString().split('T')[0])
    .order('date', { ascending: false })

  if (error) {
    console.error('Erreur lors du chargement des dépenses personnelles:', error)
    return
  }

  depensesPerso.value = data || []
  totalDepensesPerso.value = data?.reduce((sum, d) => sum + d.montant, 0) || 0
  resteBudgetPerso.value = budgetDisponible.value - totalDepensesPerso.value
  console.log('Calcul budget perso:', {
    disponible: budgetDisponible.value,
    depenses: totalDepensesPerso.value,
    reste: resteBudgetPerso.value
  })
}

// Ajouter une dépense personnelle
const ajouterDepensePerso = async () => {
  if (!depensePersoForm.value.validate()) return
  if (!mouvementSalaireId.value) {
    alert('Erreur: Mouvement "Salaire MYB" non trouvé dans la base de données')
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
        mouvement_id: mouvementSalaireId.value
      })

    if (error) throw error

    // Réinitialiser le formulaire
    nouvelleDepensePerso.value = {
      montant: '',
      description: ''
    }
    depensePersoForm.value.reset()

    // Recharger les dépenses
    await loadDepensesPerso()
    await calculerBudgetDisponible()
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la dépense:', error)
    alert('Erreur lors de l\'ajout de la dépense')
  } finally {
    loadingDepensePerso.value = false
  }
}

// Supprimer une dépense personnelle
const supprimerDepensePerso = async (id) => {
  if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return

  try {
    const { error } = await client
      .from('suivi_budget')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Recharger les dépenses
    await loadDepensesPerso()
    await calculerBudgetDisponible()
  } catch (error) {
    console.error('Erreur lors de la suppression de la dépense:', error)
    alert('Erreur lors de la suppression de la dépense')
  }
}

// Calculer le budget disponible
const calculerBudgetDisponible = async () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const dateStr = firstDayOfMonth.toISOString().split('T')[0]

  try {
    // 1. Récupérer le salaire MYB
    let salaire = 0
    console.log('Recherche du salaire MYB pour la date:', dateStr)

    // D'abord chercher dans les mouvements mensuels
    const { data: salaireMensuel, error: salaireMensuelError } = await client
      .from('mouvements_variables_mensuels')
      .select('montant, mouvements_variables!inner(id, nom, type)')
      .eq('date', dateStr)
      .eq('mouvements_variables.nom', 'Salaire MYB')

    if (salaireMensuelError) {
      console.error('Erreur lors de la recherche du salaire mensuel:', salaireMensuelError)
    } else if (salaireMensuel && salaireMensuel.length > 0) {
      salaire = salaireMensuel[0].montant
      mouvementSalaireId.value = salaireMensuel[0].mouvements_variables.id
      console.log('Salaire mensuel trouvé:', {
        montant: salaire,
        type: salaireMensuel[0].mouvements_variables.type,
        id: mouvementSalaireId.value
      })
    } else {
      console.log('Aucun salaire mensuel trouvé, recherche dans les variables de base')
      // Si pas trouvé dans les mensuels, chercher dans les variables
      const { data: mouvementsVariables, error: mouvementsVariablesError } = await client
        .from('mouvements_variables')
        .select('id, montant, nom, type')
        .eq('nom', 'Salaire MYB')

      if (mouvementsVariablesError) {
        console.error('Erreur lors de la recherche du salaire de base:', mouvementsVariablesError)
      } else if (mouvementsVariables && mouvementsVariables.length > 0) {
        salaire = mouvementsVariables[0].montant
        mouvementSalaireId.value = mouvementsVariables[0].id
        console.log('Salaire de base trouvé:', {
          montant: salaire,
          type: mouvementsVariables[0].type,
          id: mouvementSalaireId.value
        })
      } else {
        console.log('Aucun salaire trouvé ni dans les mensuels ni dans les variables de base')
      }
    }

    // 2. Récupérer les mouvements fixes
    const { data: mouvementsFixes, error: mouvementsFixesError } = await client
      .from('mouvements_fixes')
      .select('montant, type')
      .eq('actif', true)

    let totalMouvementsFixes = 0
    if (mouvementsFixes) {
      totalMouvementsFixes = mouvementsFixes.reduce((sum, m) => {
        // Tous les mouvements fixes sont des dépenses
        return sum - m.montant
      }, 0)
    }

    // 3. Récupérer les mouvements variables
    let totalMouvementsVariables = 0
    const { data: mouvementsVariablesMensuels, error: mouvementsVariablesMensuelsError } = await client
      .from('mouvements_variables_mensuels')
      .select(`
        montant,
        mouvements_variables!inner (
          id,
          type,
          nom
        )
      `)
      .eq('date', dateStr)

    if (mouvementsVariablesMensuels) {
      totalMouvementsVariables = mouvementsVariablesMensuels.reduce((sum, m) => {
        // Ne pas compter le salaire MYB car déjà compté
        if (m.mouvements_variables.nom === 'Salaire MYB') return sum
        // Tous les mouvements variables sont des dépenses
        return sum - m.montant
      }, 0)
    } else {
      const { data: mouvementsVariables, error: mouvementsVariablesError } = await client
        .from('mouvements_variables')
        .select('montant, type, nom')

      if (mouvementsVariables) {
        totalMouvementsVariables = mouvementsVariables.reduce((sum, m) => {
          // Ne pas compter le salaire MYB car déjà compté
          if (m.nom === 'Salaire MYB') return sum
          // Tous les mouvements variables sont des dépenses
          return sum - m.montant
        }, 0)
      }
    }

    // 4. Récupérer les mensualités des projets
    const { data: projets, error: projetsError } = await client
      .from('projets')
      .select('mensualite')

    let totalMensualites = 0
    if (projets) {
      totalMensualites = projets.reduce((sum, p) => sum + (p.mensualite || 0), 0)
    }

    // 1. Charger les virements vers Compte Perso
    let totalVirementsPerso = 0
    try {
      const { data: virementsPerso, error: virementsPersoError } = await client
        .from('virements_epargnes')
        .select('montant')
        .eq('compte_linked', 'Compte Perso')
      if (!virementsPersoError && virementsPerso) {
        totalVirementsPerso = virementsPerso.reduce((sum, v) => sum + Math.abs(v.montant || 0), 0)
      }
    } catch (e) { console.error('Erreur chargement virements Compte Perso', e) }

    // 5. Calculer le budget disponible
    // On commence avec le salaire et on soustrait toutes les dépenses
    budgetDisponible.value = salaire + totalMouvementsFixes + totalMouvementsVariables - totalMensualites + totalVirementsPerso

    console.log('Calcul du budget disponible:', {
      salaire,
      totalMouvementsFixes,
      totalMouvementsVariables,
      totalMensualites,
      budgetDisponible: budgetDisponible.value
    })

    // Recalculer le reste à dépenser après mise à jour du budget disponible
    if (depensesPerso.value.length > 0) {
      resteBudgetPerso.value = budgetDisponible.value - totalDepensesPerso.value
      console.log('Mise à jour du reste à dépenser:', {
        budgetDisponible: budgetDisponible.value,
        totalDepenses: totalDepensesPerso.value,
        reste: resteBudgetPerso.value
      })
    }

  } catch (error) {
    console.error('Erreur lors du calcul du budget disponible:', error)
  }
}

// Calcul du montant disponible pour les mouvements variables de nature épargne (comme dans epargnes.vue)
const montantDispoEpargne = ref(0)
const calculerMontantDispoEpargne = async () => {
  // 1. Récupérer tous les mouvements variables de nature épargne
  const { data: mouvements, error: errMouv } = await client
    .from('mouvements_variables')
    .select('id')
    .eq('nature', 'Épargne')
  if (errMouv || !mouvements) {
    montantDispoEpargne.value = 0
    return
  }
  const ids = mouvements.map(mv => mv.id)
  // 2. Additionner tous les mouvements mensuels
  let totalMensuels = 0
  if (ids.length > 0) {
    const { data: mensuels, error: errMensuels } = await client
      .from('mouvements_variables_mensuels')
      .select('montant, mouvements_variables_id')
      .in('mouvements_variables_id', ids)
    if (!errMensuels && mensuels) {
      totalMensuels = mensuels.reduce((sum, m) => sum + (m.montant || 0), 0)
    }
  }
  // 3. Additionner tous les virements épargnes
  let totalVirements = 0
  if (ids.length > 0) {
    const { data: virements, error: errVirements } = await client
      .from('virements_epargnes')
      .select('montant, mouvement_id')
      .in('mouvement_id', ids)
    if (!errVirements && virements) {
      totalVirements = virements.reduce((sum, v) => sum + (v.montant || 0), 0)
    }
  }
  montantDispoEpargne.value = totalMensuels + totalVirements
}

// Calcul du montant pour chaque mouvement variable épargne (comme dans epargnes.vue)
const totalMouvementVariableMensuelDashboard = ref({})
const totalVirementVariableDashboard = ref({})

const loadTotalMouvementVariableMensuelDashboard = async () => {
  for (const mv of mouvementsVariablesEpargne.value) {
    const { data, error } = await client
      .from('mouvements_variables_mensuels')
      .select('montant')
      .eq('mouvements_variables_id', mv.id)
    if (error) {
      totalMouvementVariableMensuelDashboard.value[mv.id] = 0
    } else {
      totalMouvementVariableMensuelDashboard.value[mv.id] = data?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0
    }
  }
}
const loadTotalVirementVariableDashboard = async () => {
  for (const mv of mouvementsVariablesEpargne.value) {
    const { data, error } = await client
      .from('virements_epargnes')
      .select('montant')
      .eq('mouvement_id', mv.id)
    if (error) {
      totalVirementVariableDashboard.value[mv.id] = 0
    } else {
      totalVirementVariableDashboard.value[mv.id] = data?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0
    }
  }
}
const getMontantTotalMouvementVariableDashboard = (mouvementId) => {
  return (totalMouvementVariableMensuelDashboard.value[mouvementId] || 0) + (totalVirementVariableDashboard.value[mouvementId] || 0)
}

// Charger les données au montage du composant
onMounted(async () => {
  try {
    // 1. Charger d'abord les mouvements variables pour avoir les IDs
    await loadMouvementsVariables()
    
    // 2. Charger le budget courses et son ID
    await loadBudgetCourses()
    
    // 3. Calculer le budget disponible et récupérer l'ID du salaire
    await calculerBudgetDisponible()
    
    // 4. Charger les dépenses une fois que les IDs sont disponibles
    if (mouvementCoursesId.value) {
      await loadDepensesCourses()
    }
    if (mouvementSalaireId.value) {
      await loadDepensesPerso()
    }
    
    // 5. Charger les autres données
    await Promise.all([
      loadComptes(),
      loadDepensesProjets()
    ])
    
    // 6. Calculer les transactions
    await calculerTransactionsMois()

    // 7. Calculer le récapitulatif des dépenses
    await calculerRecapDepenses()
    await calculerMontantDispoEpargne()
    await loadTotalMouvementVariableMensuelDashboard()
    await loadTotalVirementVariableDashboard()
  } catch (error) {
    console.error('Erreur lors du chargement initial:', error)
  }
})

const virement = ref({ source: null, cible: null, montant: null })
const virementForm = ref(null)
const loadingVirement = ref(false)

// Liste des mouvements variables de nature 'Épargne'
const mouvementsVariablesEpargne = computed(() =>
  mouvementsVariables.value.filter(mv => mv.nature === 'Épargne')
)

// Liste des récepteurs : mouvements variables épargne + comptes spéciaux
const recepteursVirement = computed(() => [
  ...mouvementsVariables.value.filter(mv => mv.nature === 'Épargne'),
  { id: 'perso', nom: 'Compte Perso' },
  { id: 'pro', nom: 'Compte Pro' }
])

const validerVirement = async () => {
  if (!virementForm.value.validate()) return
  // Vérification stricte côté JS
  const max = getMontantTotalMouvementVariableDashboard(virement.value.source) || 0
  if (Number(virement.value.montant) > max) {
    alert('Le montant ne peut pas dépasser le disponible du compte source.')
    return
  }
  if (!virement.value.source || !virement.value.cible || !virement.value.montant) return
  loadingVirement.value = true
  try {
    // Récupérer les objets source et cible
    const sourceObj = mouvementsVariables.value.find(mv => mv.id === virement.value.source)
    const cibleObj = mouvementsVariables.value.find(mv => mv.id === virement.value.cible)
    // Texte pour le compte_linked
    const sourceNom = sourceObj ? sourceObj.nom : virement.value.source
    const cibleNom = cibleObj ? cibleObj.nom : (virement.value.cible === 'perso' ? 'Compte Perso' : 'Compte Pro')
    // 1. Créer l'entrée négative pour la source
    const insertData = [
      {
        mouvement_id: virement.value.source,
        compte_linked: cibleNom,
        montant: -Math.abs(Number(virement.value.montant))
      }
    ]
    // 2. Si le récepteur est un mouvement variable (nature épargne), créer l'entrée positive
    if (cibleObj) {
      insertData.push({
        mouvement_id: virement.value.cible,
        compte_linked: sourceNom,
        montant: Math.abs(Number(virement.value.montant))
      })
    }
    // 3. Insertion dans la table virements_epargnes
    const { error } = await client
      .from('virements_epargnes')
      .insert(insertData)
    if (error) throw error
    // Reset form
    virement.value = { source: null, cible: null, montant: null }
    virementForm.value.reset()
    // Mettre à jour dynamiquement le budget disponible
    await calculerBudgetDisponible()
    await loadDepensesPerso()
    await calculerMontantDispoEpargne()
    await loadTotalMouvementVariableMensuelDashboard()
    await loadTotalVirementVariableDashboard()
    alert('Virement enregistré !')
  } catch (error) {
    alert('Erreur lors du virement : ' + error.message)
  } finally {
    loadingVirement.value = false
  }
}

const note = ref("");
const notesList = ref([]);
const loadingNote = ref(false);
const noteForm = ref(null);
const editNoteId = ref(null);
const editNoteContent = ref("");

const loadNotes = async () => {
  const { data, error } = await client
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (!error && data) {
    notesList.value = data;
  }
};

onMounted(() => {
  loadNotes();
});

const sauvegarderNote = async () => {
  if (!note.value) return;
  loadingNote.value = true;
  try {
    const { error } = await client
      .from('notes')
      .insert({ notes: note.value });
    if (error) throw error;
    note.value = "";
    await loadNotes();
  } catch (error) {
    alert('Erreur lors de la sauvegarde de la note');
  } finally {
    loadingNote.value = false;
  }
};

const startEditNote = (n) => {
  editNoteId.value = n.id;
  editNoteContent.value = n.notes;
};
const cancelEditNote = () => {
  editNoteId.value = null;
  editNoteContent.value = "";
};
const updateNote = async (id) => {
  if (!editNoteContent.value) return;
  loadingNote.value = true;
  try {
    const { error } = await client
      .from('notes')
      .update({ notes: editNoteContent.value })
      .eq('id', id);
    if (error) throw error;
    editNoteId.value = null;
    editNoteContent.value = "";
    await loadNotes();
  } catch (error) {
    alert('Erreur lors de la modification de la note');
  } finally {
    loadingNote.value = false;
  }
};
const deleteNote = async (id) => {
  if (!confirm('Supprimer cette note ?')) return;
  loadingNote.value = true;
  try {
    const { error } = await client
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await loadNotes();
  } catch (error) {
    alert('Erreur lors de la suppression de la note');
  } finally {
    loadingNote.value = false;
  }
};
</script>

<style scoped>
.montant-input {
  max-width: 120px;
}

.v-table {
  width: 100%;
}

/* Cacher les flèches des inputs number */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
