<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const items = [
  { to: '/dashboard', icon: 'mdi-home-analytics', key: 'dashboard' },
  { to: '/epargnes', icon: 'mdi-piggy-bank', key: 'epargnes' },
  { to: '/projets', icon: 'mdi-rocket-launch-outline', key: 'projets' },
  { to: '/flux', icon: 'mdi-swap-horizontal', key: 'flux' },
  { to: '/comptes', icon: 'mdi-bank-outline', key: 'comptes' },
  { to: '/logout', icon: 'mdi-logout', key: 'logout', isLogout: true },
]

function go(to, isLogout) {
  if (isLogout) {
    // await client.auth.signOut()
    router.push('/login')
  } else if (route.path !== to) {
    router.push(to)
  }
}
</script>

<template>
  <div class="d-flex flex-column align-center" style="margin-top: 24px;">
    <div
      v-for="item in items"
      :key="item.key"
      class="custom-icon-btn mb-4"
      :class="{ 'active': route.path === item.to }"
      @click="go(item.to, item.isLogout)"
      tabindex="0"
      role="button"
    >
      <v-icon
        size="48"
        :color="route.path === item.to ? '#ffa726' : 'primary'"
      >
        {{ item.icon }}
      </v-icon>
    </div>
  </div>
</template>

<style scoped>
.custom-icon-btn {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s, border 0.2s, transform 0.18s cubic-bezier(.4,2,.6,1);
  outline: none;
  border: 2px solid transparent;
}
.custom-icon-btn.active {
  box-shadow: 0 2px 0px rgba(255,167,38,0.18);
  border: 2px solid #ffa726;
}
.custom-icon-btn:focus {
  border: 2px solid #1976d2;
}
.custom-icon-btn:hover {
  background: rgba(255,105,180,0.12);
  transform: scale(1.15);
}
.v-icon {
  transition: transform 0.18s cubic-bezier(.4,2,.6,1);
}
</style> 