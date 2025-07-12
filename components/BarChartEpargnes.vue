<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  labels: { type: Array, required: true }, // noms des épargnes
  data: { type: Array, required: true }    // montants disponibles
})

const canvas = ref(null)
let chartInstance = null

const renderChart = () => {
  console.log('[BarChartEpargnes] renderChart labels:', props.labels, 'data:', props.data)
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Épargne disponible (€)',
          data: props.data,
          backgroundColor: '#1976d2',
          borderRadius: 8,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: '#eee' },
          ticks: { callback: v => v + ' €' }
        }
      }
    }
  })
}

onMounted(() => {
  console.log('[BarChartEpargnes] mounted, labels:', props.labels, 'data:', props.data)
  renderChart()
})
watch(() => [props.labels, props.data], renderChart, { deep: true })
onBeforeUnmount(() => { if (chartInstance) chartInstance.destroy() })
</script>

<style scoped>
canvas {
  max-width: 100%;
  max-height: 320px;
}
</style> 