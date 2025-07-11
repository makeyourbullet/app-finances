<template>
    <svg
      viewBox="0 0 200 100"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Fond de la jauge -->
      <path
        d="M 10 100 A 90 90 0 0 1 190 100"
        :stroke="bgColor"
        stroke-width="20"
        fill="none"
      />
  
      <!-- Barre de progression -->
      <path
        :d="progressPath"
        :stroke="progressColor"
        stroke-width="20"
        fill="none"
        stroke-linecap="round"
      />
  
      <!-- Pas de texte au centre -->
    </svg>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    value: { type: Number, required: true },
    max: { type: Number, default: 100 },
    unit: { type: String, default: '%' },
    bgColor: { type: String, default: '#F7D4D8' },
    progressColor: { type: String, default: '#F86D68' },
  })
  
  const percentage = computed(() => Math.min(props.value / props.max, 1))
  
  const progressPath = computed(() => {
    const angle = Math.PI * percentage.value
    const x = 100 + 90 * Math.cos(Math.PI - angle)
    const y = 100 - 90 * Math.sin(Math.PI - angle)
    const largeArc = percentage.value > 0.5 ? 1 : 0
    return `M 10 100 A 90 90 0 ${largeArc} 1 ${x} ${y}`
  })
  </script>
  