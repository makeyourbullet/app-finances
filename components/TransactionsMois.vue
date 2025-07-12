<template>
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
              <div :class="{ 'text-success': transaction.solde > 0, 'text-error': transaction.solde < 0 }">
                {{ transaction.message }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { toRefs } from 'vue'
const props = defineProps({
  transactionsFiltered: Array
})
const { transactionsFiltered } = toRefs(props)
</script> 