<template>
  <v-container>
    <v-form @submit.prevent="login">
      <v-text-field v-model="email" label="Email" required />
      <v-text-field v-model="password" label="Mot de passe" type="password" required />
      <v-btn type="submit" color="primary" :loading="loading">Se connecter</v-btn>
      <div v-if="error" class="text-error">{{ error }}</div>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

const client = useSupabaseClient()
const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const login = async () => {
  loading.value = true
  error.value = ''
  const { error: loginError } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  loading.value = false
  if (loginError) {
    error.value = loginError.message
  } else {
    router.push('/dashboard')
  }
}
</script> 