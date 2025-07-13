<template>
<!-- Menu supprimé, ce composant est maintenant vide -->
</template>

<script setup>
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

const client = useSupabaseClient()
const router = useRouter()

const logout = async () => {
  await client.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.logout-item {
  color: #e53935;
}
</style> 