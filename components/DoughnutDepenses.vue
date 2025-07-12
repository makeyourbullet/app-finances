<template>
  <v-card elevation="0" color="transparent" rounded="0">
    <v-card-text class="pa-0">
      <div class="d-flex flex-column align-center" style="width:100%;">
        <canvas
          ref="doughnutDepenses"
          style="width:100%;max-width:100%;aspect-ratio:1.5/1;display:block;"
        ></canvas>
      </div>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  Title,
  CategoryScale,
  LinearScale
} from 'chart.js';

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  Title,
  CategoryScale,
  LinearScale
);

const props = defineProps({
  totalDepensesProjets: Number,
  totalDepensesFixes: Number,
  totalDepensesVariables: Number
})

const doughnutDepenses = ref(null)
let chartInstance = null

const getData = () => {
  return {
    labels: [
      'Projets',
      'Fixes',
      'Variables'
    ],
    datasets: [
      {
        data: [
          props.totalDepensesProjets || 0,
          props.totalDepensesFixes || 0,
          props.totalDepensesVariables || 0
        ],
        backgroundColor: [
          '#f86d68', // projets
          '#f691a9', // fixes
          '#f4863e'  // variables
        ],
        borderWidth: 0
      }
    ]
  }
}

const getOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    radius: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || ''
            const value = context.raw || 0
            return `${label}: ${value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`
          }
        }
      },
      datalabels: false // on gère les labels à la main
    },
    animation: false
  }
}

function drawCalloutLabels(chart) {
  const { ctx, chartArea, data } = chart
  if (!ctx || !chartArea) return
  ctx.save()
  const meta = chart.getDatasetMeta(0)
  const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
  meta.data.forEach((arc, i) => {
    const model = arc;
    const angle = (model.startAngle + model.endAngle) / 2
    const radius = model.outerRadius
    const x = chart.width / 2 + Math.cos(angle) * (radius + 20)
    const y = chart.height / 2 + Math.sin(angle) * (radius + 20)
    // Draw line
    ctx.beginPath()
    ctx.moveTo(
      chart.width / 2 + Math.cos(angle) * (radius - 10),
      chart.height / 2 + Math.sin(angle) * (radius - 10)
    )
    ctx.lineTo(x, y)
    ctx.strokeStyle = data.datasets[0].backgroundColor[i]
    ctx.lineWidth = 2
    ctx.stroke()
    // Draw label and value (no percent, value below label, no unnecessary decimals)
    const label = data.labels[i]
    const value = data.datasets[0].data[i]
    const alignX = x + (x < chart.width / 2 ? -10 : 10)
    ctx.font = 'bold 1em sans-serif'
    ctx.fillStyle = '#333'
    ctx.textAlign = x < chart.width / 2 ? 'right' : 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, alignX, y - 10)
    ctx.font = '1em sans-serif'
    ctx.fillText(`${value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`, alignX, y + 10)
  })
  ctx.restore()
}

function renderChart() {
  if (chartInstance) {
    chartInstance.destroy()
  }
  chartInstance = new Chart(doughnutDepenses.value, {
    type: 'doughnut',
    data: getData(),
    options: getOptions(),
    plugins: [
      {
        id: 'calloutLabels',
        afterDraw: drawCalloutLabels
      },
      {
        id: 'centerText',
        afterDraw: (chart) => {
          const { ctx, chartArea, data } = chart
          if (!ctx || !chartArea) return
          ctx.save()
          const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
          ctx.font = 'bold 1.5em sans-serif'
          ctx.fillStyle = '#333'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          // Montant total
          ctx.fillText(
            `${total.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`,
            chart.width / 2,
            chart.height / 2 - 10
          )
          // Libellé "Dépenses"
          ctx.font = '1em sans-serif'
          ctx.fillText(
            'Dépenses',
            chart.width / 2,
            chart.height / 2 + 18
          )
          ctx.restore()
        }
      }
    ]
  })
}

onMounted(() => {
  renderChart()
})

watch(
  () => [props.totalDepensesProjets, props.totalDepensesFixes, props.totalDepensesVariables],
  () => {
    renderChart()
  }
)
</script> 