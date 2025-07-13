<template>
  <v-card class="mt-4" style="padding-left:3%;padding-right:3%;padding-bottom:3%;">
    <v-card-title>Autre 📈</v-card-title>
    <v-card-text>
      <v-row align="stretch" no-gutters>
        <!-- Colonne 1 : jauge + budget -->
        <v-col cols="12" md="4" class="d-flex flex-column align-center justify-center">
          <JaugeDemicercle
            :value="budgetDisponibleInitial > 0 ? (totalDepensesPerso / budgetDisponibleInitial) * 100 : 0"
            :max="100"
            unit="%"
            bgColor="#f7e6e8"
            progressColor="#f691a9"
            style="width:70%;"
          />
          <div class="text-center mt-2">
            <span style="font-size:2em;font-weight:bold;">{{ formatAmount(totalDepensesPerso) }} €</span>
            <span style="font-size:1.2em;color:#888;"> / {{ formatAmount(budgetDisponibleInitial) }} €</span>
          </div>
        </v-col>
        <!-- Colonne 2 : tableau, reste, formulaire -->
        <v-col cols="12" md="8" style="padding-left:5%;">
          <v-table class="mt-0">
            <tbody>
              <tr v-for="depense in depensesPerso" :key="depense.id">
                <td>{{ formatDate(depense.date) }}</td>
                <td>{{ depense.description }}</td>
                <td class="text-right">{{ formatAmount(depense.montant) }} €</td>
                <td class="text-right">
                  <v-btn
                    class="btn-danger"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    @click="supprimerDepensePerso(depense.id)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div style="border-top:1px solid #e0e0e0;margin:16px 0;"></div>
          <div class="mb-4 text-right">Reste à dépenser : {{ formatAmount(resteBudgetPerso) }} €</div>
          <v-form @submit.prevent="onSubmit" ref="depensePersoForm">
            <div class="d-flex align-center" style="width:100%; gap: 8px;">
              <v-text-field
                v-model="nouvelleDepensePerso.description"
                label="Description"
                type="text"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Description requise']"
                style="flex:1; min-width:0;"
              ></v-text-field>
              <v-text-field
                v-model="nouvelleDepensePerso.montant"
                label="Montant"
                type="text"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Montant requis', v => !isNaN(parseFloat(v.replace(',', '.'))) || 'Montant invalide']"
                style="flex:1; min-width:0;"
                suffix="€"
              ></v-text-field>
              <v-btn
                class="btn-principal"
                type="submit"
                :loading="loadingDepensePerso"
                style="height:40px; align-self:stretch;"
              >
                Je valide 💰
              </v-btn>
            </div>
          </v-form>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { ref, toRefs } from 'vue'
const depensePersoForm = ref(null)
const props = defineProps({
  budgetDisponibleInitial: Number,
  totalDepensesPerso: Number,
  depensesPerso: Array,
  resteBudgetPerso: Number,
  nouvelleDepensePerso: Object,
  loadingDepensePerso: Boolean,
  ajouterDepensePerso: Function,
  supprimerDepensePerso: Function,
  formatAmount: Function,
  formatDate: Function
})
const {
  budgetDisponibleInitial,
  totalDepensesPerso,
  depensesPerso,
  resteBudgetPerso,
  nouvelleDepensePerso,
  loadingDepensePerso,
  ajouterDepensePerso,
  supprimerDepensePerso,
  formatAmount,
  formatDate
} = toRefs(props)

async function onSubmit() {
  console.log('[DEBUG] depensePersoForm.value', depensePersoForm.value)
  const result = await depensePersoForm.value?.validate?.()
  console.log('[DEBUG] validate() result', result)
  if (result?.valid) {
    console.log('[DEBUG] Validation OK, appel ajouterDepensePerso')
    ajouterDepensePerso.value()
  } else {
    console.log('[DEBUG] Validation FAIL')
  }
}
</script> 