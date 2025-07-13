<template>
  <v-card>
    <v-card-title class="text-center w-100">Transactions du mois</v-card-title>
    <v-card-text>
      <ol class="transactions-list">
        <li v-for="(transaction, i) in transactionsFiltered" :key="transaction.compte.id" class="transaction-item">
          <v-checkbox
            v-model="checkedTransactions[transaction.compte.id]"
            :id="'tx-' + transaction.compte.id"
            color="warning"
            hide-details
            density="compact"
            class="transaction-checkbox"
            style="margin-right: 8px;"
          />
          <label :for="'tx-' + transaction.compte.id" class="transaction-label">
            <span>
              <template v-if="transaction.solde > 0">
                Prendre
                <span class="transaction-amount">
                  {{ Math.abs(transaction.solde) }}€
                </span>
                sur le
                <span class="transaction-compte">
                  {{ transaction.compte.nom_compte }}
                </span>
              </template>
              <template v-else>
                Retirer
                <span class="transaction-amount">
                  {{ Math.abs(transaction.solde) }}€
                </span>
                du
                <span class="transaction-compte">
                  {{ transaction.compte.nom_compte }}
                </span>
              </template>
            </span>
          </label>
        </li>
      </ol>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { ref, toRefs, watch, onMounted } from 'vue'
const STORAGE_KEY = 'transactions_checked';
const props = defineProps({
  transactionsFiltered: Array
})
const { transactionsFiltered } = toRefs(props)

const checkedTransactions = ref({})

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    checkedTransactions.value = JSON.parse(saved)
  }
})

watch(checkedTransactions, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

watch(transactionsFiltered, (newList) => {
  newList.forEach(tx => {
    if (!(tx.compte.id in checkedTransactions.value)) {
      checkedTransactions.value[tx.compte.id] = false
    }
  })
}, { immediate: true })
</script>
<style scoped>
.transactions-list {
  padding-left: 10em;
  list-style-position: inside;
  font-size: 1.1em;
  font-family: inherit;
  color: #222;
}
.transaction-item {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.transaction-checkbox {
  min-width: 18px;
  min-height: 18px;
  padding: 0 !important;
  margin: 0 !important;
}
.transaction-label {
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
}
.transaction-amount {
  color: #f691a9;
  margin: 0 4px;
}
.transaction-compte {
  margin-left: 2px;
}
</style> 