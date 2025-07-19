<template>
  <v-table>
    <thead>
      <tr>
        <td :colspan="type === 'variable' ? 6 : 4" class="mvt-row-td">
          <div class="mvt-row-pastille mvt-header-row-pastille mvt-center">
            <div class="mvt-row-flex mvt-header-flex mvt-center">
              <span class="mvt-col mvt-col-desc">Description</span>
              <span class="mvt-col mvt-col-compte">Compte</span>
              <span class="mvt-col mvt-col-montant text-right">Montant</span>
              <span v-if="type === 'variable'" class="mvt-col mvt-col-type">Type</span>
              <span v-if="type === 'variable'" class="mvt-col mvt-col-nature">Nature</span>
              <span class="mvt-col mvt-col-actions">Actions</span>
            </div>
          </div>
        </td>
      </tr>
    </thead>
    <tbody>
      <template v-for="(mouvement, idx) in mouvements" :key="mouvement.id">
        <tr>
          <td :colspan="type === 'variable' ? 6 : 4" class="mvt-row-td">
            <div class="mvt-row-pastille mvt-row-white mvt-center">
              <div class="mvt-row-flex mvt-center">
                <span class="mvt-col mvt-col-desc">{{ mouvement.nom }}</span>
                <span class="mvt-col mvt-col-compte">{{ mouvement.compte_nom }}</span>
                <span class="mvt-col mvt-col-montant" :class="{ 'text-success': mouvement.type === 'Rentrée', 'text-error': mouvement.type === 'Dépense' }">
                  {{ formatAmount(mouvement.montant, mouvement.type) }}€
                </span>
                <span v-if="type === 'variable'" class="mvt-col mvt-col-type">{{ mouvement.type }}</span>
                <span v-if="type === 'variable'" class="mvt-col mvt-col-nature">{{ mouvement.nature }}</span>
                <span class="mvt-col mvt-col-actions">
                  <div class="d-flex gap-2">
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      color="warning"
                      variant="text"
                      @click="$emit('edit', mouvement)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      variant="text"
                      @click="$emit('delete', mouvement.id)"
                    ></v-btn>
                  </div>
                </span>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </v-table>
</template>

<script setup>
const props = defineProps({
  mouvements: { type: Array, required: true },
  type: { type: String, required: true } // 'fixe' ou 'variable'
})
const formatAmount = (amount, type) => {
  const prefix = type === 'Dépense' ? '-' : '+'
  return `${prefix}${Math.abs(amount).toLocaleString('fr-FR')}`
}
</script>

<style scoped>
.text-success {
  color: green !important;
}
.text-error {
  color: red !important;
}
.gap-2 {
  gap: 8px;
}
.text-right {
  text-align: right;
}
.mvt-header-row {
  background: #f691a9 !important;
  color: #fff !important;
  font-weight: 700;
  font-size: 1.08em;
}
.mvt-row {
  border-radius: 32px;
  margin-bottom: 18px;
  overflow: hidden;
  transition: background 0.18s;
  padding-left: 12px;
  padding-right: 12px;
}
.mvt-row-white {
  background: #fff !important;
}
tbody .mvt-row td {
  border-bottom: none !important;
}
.mvt-row-td {
  padding: 0 !important;
  border: none !important;
}
.mvt-row-pastille {
  border-radius: 32px;
  margin-bottom: 18px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px 0 rgba(244,54,98,0.04);
  transition: background 0.18s;
  max-width: 1000px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.mvt-row-white {
  background: #fff !important;
}
.mvt-row-flex {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}
.mvt-col {
  flex: 1 1 0;
  min-width: 0;
  text-align: left;
}
.mvt-col-montant {
  text-align: right;
  min-width: 90px;
}
.mvt-col-actions {
  flex: 0 0 auto;
  min-width: 80px;
  text-align: right;
}
.v-table {
  background: transparent !important;
  box-shadow: none !important;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}
.mvt-header-row-pastille {
  background: #f691a9 !important;
  color: #fff !important;
  font-weight: 700;
  font-size: 1.08em;
  margin-bottom: 18px;
}
.mvt-header-flex span {
  color: #fff !important;
}
.mvt-center {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.mvt-row-flex,
.mvt-header-flex {
  width: 100%;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.mvt-col {
  text-align: center !important;
  justify-content: center;
  align-items: center;
}
</style> 