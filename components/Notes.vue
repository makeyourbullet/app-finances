<template>
  <v-card class="mb-4 notes-shadow" style="padding-left:7%;padding-right:7%;padding-bottom:7%;background:#f6b2c0;">
    <v-card-title class="text-center w-100" style="margin-bottom:0;">Notes</v-card-title>
    <v-card-text>
      <v-form class="form-notes big-margin-bottom" @submit.prevent="onSubmit" ref="noteForm">
        <textarea
          v-model="localNote"
          class="textarea-notes mb-2"
          rows="4"
          placeholder="Écrire une note..."
          style="width:100%; resize:vertical;"
        ></textarea>
        <div class="text-center">
          <v-btn class="btn-principal" type="submit" :loading="loadingNote" color="warning">Sauvegarder</v-btn>
        </div>
      </v-form>
      <div v-if="notesList.length > 0" class="mt-4 notes-list-no-bg">
        <v-list class="no-bg">
          <v-list-item v-for="n in notesList" :key="n.id" class="align-start note-item">
            <div class="d-flex flex-column w-100">
              <div v-if="editNoteId !== n.id">
                <div class="note-text">{{ n.notes }}</div>
              </div>
              <div v-else>
                <v-textarea v-model="localEditNoteContent" rows="2" auto-grow outlined></v-textarea>
                <v-btn size="small" class="btn-principal" @click="onUpdateNote(n.id)">Enregistrer</v-btn>
                <v-btn size="small" @click="cancelEditNote">Annuler</v-btn>
              </div>
            </div>
            <template #append>
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="startEditNoteLocal(n)"></v-btn>
              <v-btn icon="mdi-delete" size="small" class="btn-danger" variant="text" @click="deleteNote(n.id)" color="error"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { ref, toRefs } from 'vue'
defineEmits([])
const noteForm = ref(null)
const props = defineProps({
  notesList: Array,
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

const localNote = ref('')
const localEditNoteContent = ref('')

function startEditNoteLocal(n) {
  localEditNoteContent.value = n.notes
  startEditNote.value(n)
}

async function onSubmit() {
  if (!localNote.value.trim()) return
  await sauvegarderNote.value(localNote.value)
  localNote.value = ''
}

async function onUpdateNote(id) {
  if (!localEditNoteContent.value.trim()) return
  await updateNote.value(id, localEditNoteContent.value)
}
</script>

<style scoped>
.textarea-notes {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  background: #fff;
  border: none;
  border-radius: 16px;
  font-size: 1.1em;
  color: #333;
  box-shadow: none;
  outline: none;
  transition: box-shadow 0.2s;
}
.textarea-notes:focus {
  box-shadow: 0 0 0 2px #f691a9;
}

.form-notes .v-field__overlay,
.form-notes .v-field__outline,
.form-notes .v-field__outline__start,
.form-notes .v-field__outline__end,
.form-notes .v-field__outline::before,
.form-notes .v-field__outline::after {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  opacity: 0 !important;
}

.form-notes .v-field--variant-filled .v-field__overlay {
  background: transparent !important;
  opacity: 0 !important;
}
.big-margin-bottom {
  margin-bottom: 32px !important;
}
.note-item {
  background: #fff;
  border-radius: 32px !important;
  margin-bottom: 18px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  overflow: hidden;
}
.notes-list-no-bg, .no-bg {
  background: transparent !important;
}
.note-text {
  white-space: pre-line;
  text-align: left;
  width: 100%;
  padding-left: 20px;
}

</style> 