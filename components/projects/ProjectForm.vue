<template>
  <v-form ref="form" @submit.prevent>
    <v-text-field
      v-model="projectData.nom_projet"
      label="Nom du projet"
      required
      :rules="[v => !!v || 'Le nom est requis']"
    ></v-text-field>

    <v-text-field
      v-model="projectData.objectif"
      label="Objectif (€)"
      type="number"
      :rules="[
        v => (!!v || !!projectData.mensualite) || 'Objectif ou mensualité requis',
        v => !v || v > 0 || 'L\'objectif doit être positif'
      ]"
      @update:model-value="handleObjectifChange"
    ></v-text-field>

    <v-text-field
      v-model="projectData.mensualite"
      label="Mensualité (€)"
      type="number"
      :rules="[
        v => (!!v || !!projectData.objectif) || 'Objectif ou mensualité requis',
        v => !v || v > 0 || 'La mensualité doit être positive'
      ]"
      :readonly="!!projectData.objectif"
      @update:model-value="handleMensualiteChange"
    ></v-text-field>

    <v-text-field
      v-model="projectData.date_debut"
      label="Date de début"
      type="date"
      required
      :rules="[v => !!v || 'La date de début est requise']"
      @update:model-value="handleDateChange"
    ></v-text-field>

    <v-text-field
      v-model="projectData.date_fin"
      label="Date de fin"
      type="date"
      :rules="[
        v => !projectData.objectif || !!v || 'La date de fin est requise avec un objectif',
        v => !v || !projectData.date_debut || new Date(v) > new Date(projectData.date_debut) || 'La date de fin doit être après la date de début'
      ]"
      :hint="projectData.objectif ? 'Requis avec un objectif' : 'Optionnel avec une mensualité'"
      persistent-hint
      @update:model-value="handleDateChange"
    ></v-text-field>

    <v-select
      v-model="projectData.compte_id"
      :items="comptes"
      item-title="nom_compte"
      item-value="id"
      label="Compte associé"
      required
      :rules="[v => !!v || 'Le compte est requis']"
    ></v-select>

    <div class="d-flex justify-end gap-2">
      <v-btn
        color="grey-darken-1"
        variant="text"
        @click="$emit('cancel')"
      >
        Annuler
      </v-btn>
      <v-btn
        color="primary"
        variant="text"
        @click="handleSubmit"
        :disabled="!isFormValid"
      >
        Enregistrer
      </v-btn>
    </div>
  </v-form>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  comptes: {
    type: Array,
    required: true
  },
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const form = ref(null)
const projectData = ref({
  nom_projet: '',
  objectif: null,
  mensualite: null,
  date_debut: getTodayDate(),
  date_fin: '',
  compte_id: null
})

// Initialiser les données si initialData est fourni
if (props.initialData) {
  projectData.value = { ...props.initialData }
}

// Fonction pour obtenir la date du jour au format YYYY-MM-DD
function getTodayDate() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Calcul du nombre de mois entre deux dates
function getMonthDifference(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
}

// Calcul de la mensualité en fonction de l'objectif et des dates
function calculateMensualite() {
  if (projectData.value.objectif && projectData.value.date_debut && projectData.value.date_fin) {
    const months = getMonthDifference(projectData.value.date_debut, projectData.value.date_fin)
    if (months > 0) {
      projectData.value.mensualite = Math.ceil(projectData.value.objectif / months)
    }
  }
}

// Gestion du changement de l'objectif
function handleObjectifChange(value) {
  if (value) {
    projectData.value.mensualite = null
    calculateMensualite()
  }
}

// Gestion du changement de la mensualité
function handleMensualiteChange(value) {
  if (value) {
    projectData.value.objectif = null
    projectData.value.date_fin = ''
  }
}

// Gestion du changement des dates
function handleDateChange() {
  if (projectData.value.objectif) {
    calculateMensualite()
  }
}

// Validation du formulaire
const isFormValid = computed(() => {
  const project = projectData.value
  
  // Vérification des champs obligatoires de base
  if (!project.nom_projet || !project.compte_id || !project.date_debut) {
    return false
  }

  // Cas 1: Projet avec mensualité
  if (project.mensualite > 0) {
    // Si une date de fin est spécifiée, elle doit être après la date de début
    if (project.date_fin && new Date(project.date_fin) <= new Date(project.date_debut)) {
      return false
    }
    return true
  }

  // Cas 2: Projet avec objectif
  if (project.objectif > 0) {
    if (!project.date_fin) return false
    if (new Date(project.date_fin) <= new Date(project.date_debut)) return false
    return true
  }

  return false
})

// Soumission du formulaire
function handleSubmit() {
  console.log('Submit clicked')
  console.log('Form data:', projectData.value)
  console.log('Form valid:', isFormValid.value)

  if (!isFormValid.value) {
    console.log('Form is not valid')
    return
  }

  // Préparer les données à envoyer
  const dataToSubmit = {
    nom_projet: projectData.value.nom_projet,
    objectif: projectData.value.objectif || null,
    mensualite: projectData.value.mensualite || null,
    date_debut: projectData.value.date_debut,
    date_fin: projectData.value.date_fin || null,
    compte_id: projectData.value.compte_id
  }

  // Si on a une mensualité sans objectif, s'assurer que la date de fin est null
  if (dataToSubmit.mensualite && !dataToSubmit.objectif) {
    dataToSubmit.date_fin = null
  }

  console.log('Data to submit:', dataToSubmit)
  emit('submit', dataToSubmit)
}

// Réinitialisation du formulaire
function resetForm() {
  if (props.initialData) {
    projectData.value = { ...props.initialData }
  } else {
    projectData.value = {
      nom_projet: '',
      objectif: null,
      mensualite: null,
      date_debut: getTodayDate(),
      date_fin: '',
      compte_id: null
    }
  }
  if (form.value) {
    form.value.resetValidation()
  }
}

// Exposer la méthode resetForm pour le composant parent
defineExpose({ resetForm })
</script> 