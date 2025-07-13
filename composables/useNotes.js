import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export function useNotes() {
  const client = useSupabaseClient()
  const notesList = ref([])
  const note = ref('')
  const loadingNote = ref(false)
  const editNoteId = ref(null)
  const editNoteContent = ref('')

  // Charger les notes
  const loadNotes = async () => {
    const { data, error } = await client
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Erreur lors du chargement des notes:', error)
      return
    }
    notesList.value = data || []
  }

  // Sauvegarder une nouvelle note
  const sauvegarderNote = async (noteStr) => {
    if (!noteStr.trim()) return
    loadingNote.value = true
    try {
      const { error } = await client
        .from('notes')
        .insert({ notes: noteStr, created_at: new Date().toISOString() })
      if (error) throw error
      await loadNotes()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error)
      alert('Erreur lors de la sauvegarde de la note')
    } finally {
      loadingNote.value = false
    }
  }

  // Commencer l'édition d'une note
  const startEditNote = (n) => {
    editNoteId.value = n.id
    editNoteContent.value = n.notes
  }

  // Annuler l'édition
  const cancelEditNote = () => {
    editNoteId.value = null
    editNoteContent.value = ''
  }

  // Mettre à jour une note
  const updateNote = async (id) => {
    if (!editNoteContent.value.trim()) return
    loadingNote.value = true
    try {
      const { error } = await client
        .from('notes')
        .update({ notes: editNoteContent.value })
        .eq('id', id)
      if (error) throw error
      await loadNotes()
      cancelEditNote()
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error)
      alert('Erreur lors de la mise à jour de la note')
    } finally {
      loadingNote.value = false
    }
  }

  // Supprimer une note
  const deleteNote = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) return
    try {
      const { error } = await client
        .from('notes')
        .delete()
        .eq('id', id)
      if (error) throw error
      await loadNotes()
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error)
      alert('Erreur lors de la suppression de la note')
    }
  }

  return {
    notesList,
    note,
    loadingNote,
    editNoteId,
    editNoteContent,
    loadNotes,
    sauvegarderNote,
    startEditNote,
    cancelEditNote,
    updateNote,
    deleteNote
  }
} 