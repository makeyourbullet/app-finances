import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
    },
    theme: {
      defaultTheme: 'myCustomTheme',
      themes: {
        myCustomTheme: {
          dark: false,
          colors: {
            primary: '#f691a9',   // Bubblegum
            secondary: '#f7d4d8', // Baby pink
            accent: '#f86d68',    // Fuschia
            warning: '#f4863e',   // Tangerine
            info: '#e3b055',      // Sunshine
            error: '#f43662',     // Hot pink
            background: '#f7e6e8' // Rose pastel
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
