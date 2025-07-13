<template>
  <v-card style="padding-left:3%;padding-right:3%;padding-bottom:3%;">
    <v-card-title>Courses 🍓</v-card-title>
    <v-card-text>
      <v-row align="stretch" no-gutters>
        <!-- Colonne 1 : demi-cercle progression + budget -->
        <v-col cols="12" md="4" class="d-flex flex-column align-center justify-center">
          <JaugeDemicercle
            :value="budgetCoursesTotal > 0 ? (totalDepensesCourses / budgetCoursesTotal) * 100 : 0"
            :max="100"
            unit="%"
            bgColor="#f7e6e8"
            progressColor="#f4863e"
            style="width:70%;"
          />
          <div class="text-center mt-2">
            <span style="font-size:2em;font-weight:bold; color: #f4863e;">{{ formatAmount(totalDepensesCourses) }} €</span>
            <span style="font-size:1.2em;color:#888;"> / {{ formatAmount(budgetCoursesTotal) }} €</span>
          </div>
        </v-col>
        <!-- Colonne 2 : tableau, total, reste, formulaire -->
        <v-col cols="12" md="8" style="padding-left:5%;">
          <v-table class="mt-0">
            <tbody>
              <tr v-for="depense in depensesCourses" :key="depense.id">
                <td>{{ formatDate(depense.date) }}</td>
                <td>{{ depense.description }}</td>
                <td class="text-right">{{ formatAmount(depense.montant) }} €</td>
                <td class="text-right">
                  <v-btn
                    class="btn-danger"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="supprimerDepenseCourses(depense.id)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div style="border-top:1px solid #e0e0e0;margin:16px 0;"></div>
          <div class="mb-4 text-right">Reste à dépenser : {{ formatAmount(resteBudgetCourses) }} €</div>
          <v-form @submit.prevent="onSubmit" ref="localFormRef">
            <div class="d-flex align-center" style="width:100%; gap: 8px;">
              <v-text-field
                v-model="nouvelleDepenseCourses.description"
                label="Description"
                type="text"
                density="compact"
                variant="outlined"
                :rules="[v => !!v || 'Description requise']"
                style="flex:1; min-width:0;"
              ></v-text-field>
              <v-text-field
                v-model="nouvelleDepenseCourses.montant"
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
                :loading="loadingDepenseCourses"
                style="height:40px; align-self:stretch;"
                color="primary"
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
import { ref, toRefs, defineExpose } from 'vue'
const props = defineProps({
  budgetCoursesTotal: Number,
  totalDepensesCourses: Number,
  depensesCourses: Array,
  resteBudgetCourses: Number,
  nouvelleDepenseCourses: Object,
  loadingDepenseCourses: Boolean,
  ajouterDepenseCourses: Function,
  supprimerDepenseCourses: Function,
  formatAmount: Function,
  formatDate: Function
})
const {
  budgetCoursesTotal,
  totalDepensesCourses,
  depensesCourses,
  resteBudgetCourses,
  nouvelleDepenseCourses,
  loadingDepenseCourses,
  ajouterDepenseCourses,
  supprimerDepenseCourses,
  formatAmount,
  formatDate
} = toRefs(props)

const localFormRef = ref(null)
defineExpose({
  validate: () => localFormRef.value?.validate?.(),
  reset: () => localFormRef.value?.reset?.()
})

function onSubmit() {
  if (localFormRef.value?.validate?.()) {
    ajouterDepenseCourses.value()
  }
}
</script> 