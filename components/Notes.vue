<template>
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
        <v-btn class="btn-principal" type="submit" :loading="loadingNote">Sauvegarder</v-btn>
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
                <v-btn size="small" class="btn-principal" @click="updateNote(n.id)">Enregistrer</v-btn>
                <v-btn size="small" @click="cancelEditNote">Annuler</v-btn>
              </div>
            </div>
            <template #append>
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="startEditNote(n)"></v-btn>
              <v-btn icon="mdi-delete" size="small" class="btn-danger" variant="text" @click="deleteNote(n.id)"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { toRefs } from 'vue'
const props = defineProps({
  notesList: Array,
  note: String,
  loadingNote: Boolean,
  sauvegarderNote: Function,
  editNoteId: [String, Number, null],
  editNoteContent: String,
  updateNote: Function,
  cancelEditNote: Function,
  startEditNote: Function,
  deleteNote: Function,
  formatDate: Function
})
const {
  notesList,
  note,
  loadingNote,
  sauvegarderNote,
  editNoteId,
  editNoteContent,
  updateNote,
  cancelEditNote,
  startEditNote,
  deleteNote,
  formatDate
} = toRefs(props)
</script> 