export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return // Ne rien faire côté SSR

  const client = useSupabaseClient()
  const { data } = await client.auth.getSession()
  if (!data.session && to.path !== '/login') {
    return navigateTo('/login')
  }
}) 