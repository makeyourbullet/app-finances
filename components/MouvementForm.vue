<template>
  <v-form ref="form" @submit.prevent="handleSubmit">
    <v-text-field
      v-model="formData.nom"
      label="Description"
      :rules="[v => !!v || 'La description est requise']"
      required
    ></v-text-field>

    <v-select
      v-model="formData.compte_id"
      :items="comptes"
      item-title="nom_compte"
      item-value="id"
      label="Compte"
      :rules="[v => !!v || 'Le compte est requis']"
      required
    ></v-select>

    <v-select
      v-model="formData.type"
      :items="['Rentrée', 'Dépense']"
      label="Type"
      :rules="[v => !!v || 'Le type est requis']"
      required
    ></v-select>

    <v-select
      v-if="type === 'variable'"
      v-model="formData.nature"
      :items="['Courant', 'Épargne']"
      label="Nature"
      :rules="[v => !!v || 'La nature est requise']"
      required
    ></v-select>

    <v-text-field
      v-model.number="formData.montant"
      label="Montant (€)"
      type="number"
      :rules="[
        v => !!v || v === 0 || 'Le montant est requis',
        v => v >= 0 || 'Le montant doit être positif ou nul'
      ]"
      required
    ></v-text-field>

    <v-card-actions class="mt-4">
      <v-spacer></v-spacer>
      <v-btn color="error" text @click="handleCancel">Annuler</v-btn>
      <v-btn color="primary" type="submit" :loading="loading">Enregistrer</v-btn>
    </v-card-actions>
  </v-form>
</template>

<script setup>
import { ref, watch, toRefs } from 'vue'
const props = defineProps({
  type: { type: String, required: true }, // 'fixe' ou 'variable'
  initialData: { type: Object, default: () => ({}) },
  comptes: { type: Array, required: true },
  loading: { type: Boolean, default: false }
})
const { type, initialData, comptes, loading } = toRefs(props)
const emit = defineEmits(['submit', 'cancel'])
const form = ref(null)
const formData = ref({
  nom: '',
  compte_id: null,
  type: null,
  montant: null,
  nature: null
})
console.log('[MouvementForm] mounted, props:', { type: type.value, initialData: initialData.value, comptes: comptes.value })
// Synchroniser initialData -> formData
watch(
  () => initialData.value,
  (val) => {
    formData.value = {
      nom: val.nom || '',
      compte_id: val.compte_id || null,
      type: val.type || null,
      montant: val.montant ?? null,
      nature: val.nature || null
    }
  },
  { immediate: true, deep: true }
)

const handleSubmit = async () => {
  const { valid } = await form.value.validate()
  console.log('[MouvementForm] submit called, valid:', valid, formData.value)
  if (!valid) return
  emit('submit', { ...formData.value })
}

const handleCancel = () => {
  console.log('[MouvementForm] cancel called')
  emit('cancel')
}
</script> 