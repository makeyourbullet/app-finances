export default defineNuxtRouteMiddleware(async (to, from) => {
  const client = useSupabaseClient()
  const { data } = await client.auth.getSession()
  if (!data.session && to.path !== '/login') {
    return navigateTo('/login')
  }
}) 