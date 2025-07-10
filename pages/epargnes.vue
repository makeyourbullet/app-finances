<template>
  <v-container>
    <h1 class="text-h4 mb-4">Mes Épargnes</h1>

    <v-tabs v-model="activeTab" color="primary" align-tabs="center">
      <v-tab v-for="compte in comptesEpargne" :key="compte.id" :value="compte.id">
        {{ compte.nom_compte }}
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <v-window-item v-for="compte in comptesEpargne" :key="compte.id" :value="compte.id">
        <v-card flat>
          <v-card-text>
            <!-- Somme totale -->
            <div class="text-h5 mb-4">
              Total du compte: {{ formatAmount(getTotalCompte(compte.id)) }}€
            </div>

            <v-row>
              <!-- Tableau récapitulatif des projets -->
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>Récapitulatif</v-card-title>
                  <v-card-text>
                    <v-table>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th class="text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        <!-- Projets -->
                        <template v-for="projet in getProjetsCompte(compte.id)" :key="'projet-'+projet.id">
                          <tr>
                            <td>{{ projet.nom_projet }}</td>
                            <td class="text-right">{{ formatAmount(getProjetMontant(projet.id)) }}€</td>
                          </tr>
                        </template>
                        <!-- Séparateur -->
                        <tr v-if="getProjetsCompte(compte.id).length > 0 && getMouvementsSummary(compte.id).length > 0">
                          <td colspan="2" class="border-t border-gray-300"></td>
                        </tr>
                        <!-- Mouvements groupés par description -->
                        <template v-for="(total, description) in getMouvementsSummary(compte.id)" :key="'mouv-'+description">
                          <tr>
                            <td>{{ description }}</td>
                            <td class="text-right" :class="{ 'text-error': total < 0 }">
                              {{ formatAmount(total) }}€
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Graphique camembert -->
              <v-col cols="12" md="6">
                <v-card height="100%">
                  <v-card-title>Répartition des projets</v-card-title>
                  <v-card-text class="d-flex justify-center">
                    <div style="width: 300px; height: 300px;">
                      <canvas :id="'pieChart' + compte.id"></canvas>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Tableau des mouvements -->
            <v-card class="mt-4">
              <v-card-title>Historique des mouvements</v-card-title>
              <v-card-text>
                <v-table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th class="text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mouvement in getMouvementsCompte(compte.id)" :key="mouvement.id">
                      <td>{{ formatDate(mouvement.date) }}</td>
                      <td>{{ mouvement.nom }}</td>
                      <td class="text-right" :class="{ 'text-error': mouvement.montant < 0 }">
                        {{ formatAmount(mouvement.montant) }}€
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import Chart from 'chart.js/auto'

const client = useSupabaseClient()
const activeTab = ref(null)
const comptesEpargne = ref([])
const projets = ref([])
const mouvements = ref([])
const charts = ref({})
const montantsProjets = ref({})

// Charger les comptes d'épargne et PEA
const loadComptes = async () => {
  const { data, error } = await client
    .from('comptes')
    .select('*')
    .in('type_compte', ['Épargne', 'PEA'])
    .order('nom_compte')

  if (error) {
    console.error('Erreur lors du chargement des comptes:', error)
    return
  }
  comptesEpargne.value = data
  if (data.length > 0 && !activeTab.value) {
    activeTab.value = data[0].id
  }
}

// Charger les projets
const loadProjets = async () => {
  const { data, error } = await client
    .from('projets')
    .select('*')
    .in('compte_id', comptesEpargne.value.map(c => c.id))

  if (error) {
    console.error('Erreur lors du chargement des projets:', error)
    return
  }
  projets.value = data
}

// Charger les mouvements variables
const loadMouvements = async () => {
  const { data, error } = await client
    .from('mouvements_variables')
    .select('*')
    .in('compte_id', comptesEpargne.value.map(c => c.id))
    .order('date', { ascending: false })

  if (error) {
    console.error('Erreur lors du chargement des mouvements:', error)
    return
  }
  mouvements.value = data
}

// Charger les montants des projets
const loadMontantsProjets = async () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  
  const { data, error } = await client
    .from('epargne_projet')
    .select('*')
    .gte('date', firstDayOfMonth.toISOString())
    .order('date', { ascending: false })

  if (error) {
    console.error('Erreur lors du chargement des montants des projets:', error)
    return
  }

  // Garder uniquement le montant le plus récent pour chaque projet
  montantsProjets.value = data.reduce((acc, curr) => {
    if (!acc[curr.projet_id] || new Date(curr.date) > new Date(acc[curr.projet_id].date)) {
      acc[curr.projet_id] = curr
    }
    return acc
  }, {})
}

// Obtenir les projets d'un compte
const getProjetsCompte = (compteId) => {
  return projets.value.filter(p => p.compte_id === compteId)
}

// Obtenir les mouvements d'un compte
const getMouvementsCompte = (compteId) => {
  return mouvements.value.filter(m => m.compte_id === compteId)
}

// Calculer le montant total d'un compte
const getTotalCompte = (compteId) => {
  // Somme des montants des projets
  const totalProjets = getProjetsCompte(compteId)
    .reduce((sum, projet) => sum + getProjetMontant(projet.id), 0)

  // Somme des mouvements variables
  const totalMouvements = Object.values(getMouvementsSummary(compteId))
    .reduce((sum, montant) => sum + montant, 0)

  return totalProjets + totalMouvements
}

// Calculer le montant disponible pour un projet
const getProjetMontant = (projetId) => {
  return montantsProjets.value[projetId]?.montant_cumul || 0
}

// Formater les montants
const formatAmount = (amount) => {
  return amount.toLocaleString('fr-FR')
}

// Formater les dates
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

// Créer le graphique camembert
const createPieChart = (compteId) => {
  const projetsList = getProjetsCompte(compteId)
  const mouvementsSummary = getMouvementsSummary(compteId)
  const ctx = document.getElementById('pieChart' + compteId)
  
  // Préparer toutes les données (projets + mouvements)
  const allData = [
    ...projetsList.map(p => ({
      label: p.nom_projet,
      value: getProjetMontant(p.id)
    })),
    ...Object.entries(mouvementsSummary).map(([description, montant]) => ({
      label: description,
      value: montant
    }))
  ]

  // Calculer le total pour les pourcentages
  const total = allData.reduce((sum, item) => sum + item.value, 0)
  
  if (charts.value[compteId]) {
    charts.value[compteId].destroy()
  }

  charts.value[compteId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: allData.map(item => item.label),
      datasets: [{
        data: allData.map(item => item.value),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF99CC',
          '#99CCFF',
          '#FFCC99',
          '#99FF99'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw
              const percentage = ((value / total) * 100).toFixed(1)
              return `${context.label}: ${formatAmount(value)}€ (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// Mettre à jour les graphiques quand l'onglet change
watch(activeTab, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      createPieChart(newValue)
    }, 0)
  }
})

// Charger les données au montage du composant
onMounted(async () => {
  await loadComptes()
  await loadProjets()
  await loadMouvements()
  await loadMontantsProjets()
  if (activeTab.value) {
    setTimeout(() => {
      createPieChart(activeTab.value)
    }, 0)
  }
})

// Ajouter cette nouvelle fonction après getMouvementsCompte
const getMouvementsSummary = (compteId) => {
  const mouvementsCompte = getMouvementsCompte(compteId)
  return mouvementsCompte.reduce((acc, mouvement) => {
    const description = mouvement.nom
    acc[description] = (acc[description] || 0) + mouvement.montant
    return acc
  }, {})
}
</script>

<style scoped>
.v-table {
  width: 100%;
}
</style>
  