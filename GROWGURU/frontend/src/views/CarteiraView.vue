<template>
  <ion-page class="carteira-page">
    <ion-header>
      <ion-toolbar>
        <ion-title>Sua Carteira</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Gráfico de Distribuição -->
      <div v-if="carteira.length > 0" class="chart-container">
        <canvas ref="chartRef"></canvas>
      </div>

      <div v-else class="empty-state">
        <ion-icon name="wallet-outline" size="large"></ion-icon>
        <p>Nenhum investimento encontrado</p>
      </div>

      <!-- Lista de Estratégias -->
      <ion-list v-if="carteira.length > 0" class="estrategias-list">
        <ion-item-group v-for="estrategia in carteira" :key="estrategia.id" class="estrategia-card">
          <ion-item>
            <ion-label>
              <h2>{{ estrategia.nome }}</h2>
              <p>Total Investido: {{ formatarMoeda(estrategia.total_investido) }}</p>
              <p>Porcentagem: {{ estrategia.porcentagem }}%</p>
            </ion-label>
            <ion-button 
              @click="toggleDetalhes(estrategia.id)" 
              class="toggle-button"
              fill="clear"
            >
              <ion-icon 
                :icon="estrategia.aberto ? chevronDown : chevronForward" 
              ></ion-icon>
            </ion-button>
          </ion-item>

          <div v-if="estrategia.aberto" class="ativos-container">
            <ion-item v-for="ativo in estrategia.ativos" :key="ativo.codigo" class="ativo-card">
              <ion-label>
                <h3>{{ ativo.codigo }} - {{ ativo.nome }}</h3>
                <p>Quantidade: {{ ativo.quantidade }}</p>
                <p>Valor Médio: {{ formatarMoeda(ativo.valor_medio) }}</p>
              </ion-label>

              <div class="venda-container">
                <ion-input 
                  v-model="ativo.quantidadeVenda" 
                  type="number" 
                  placeholder="Qtd. Venda" 
                  min="0" 
                  :max="ativo.quantidade"
                ></ion-input>
                <ion-button 
                  @click="venderAtivo(ativo, estrategia.id)" 
                  class="venda-button"
                  fill="clear"
                  :disabled="!ativo.quantidadeVenda || ativo.quantidadeVenda <= 0"
                >
                  Vender
                </ion-button>
              </div>
            </ion-item>
          </div>
        </ion-item-group>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Chart, registerables } from 'chart.js';
import { chevronDown, chevronForward } from 'ionicons/icons';
import { toastController } from '@ionic/vue';
import { api } from '@/api';

import {
  IonButton,
  IonInput,
  IonLabel,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonItemGroup,
  IonIcon
} from '@ionic/vue';

const router = useRouter();
const carteira = ref([]);
const chartRef = ref(null);
const status = ref('Iniciando...');
const token = ref('');
let chartInstance = null;

Chart.register(...registerables);

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const toggleDetalhes = (id) => {
  carteira.value = carteira.value.map(e => ({
    ...e,
    aberto: e.id === id ? !e.aberto : e.aberto
  }));
};

const venderAtivo = async (ativo, estrategiaId) => {
  try {
    status.value = 'Processando venda...';
    await api.post('/vender', {
      codigo_ativo: ativo.codigo,
      quantidade: ativo.quantidadeVenda,
      // Use ativo.estrategia_id se existir; caso contrário, use o estratégiaId passado
      estrategia_id: ativo.estrategia_id || estrategiaId
    });

    await mostrarMensagem('Venda realizada com sucesso!', 'success');
    await carregarCarteira();
  } catch (error) {
    console.error('Erro na venda:', error);
    mostrarMensagem(error.response?.data?.error || 'Erro na venda', 'danger');
  }
};


const carregarCarteira = async () => {
  try {
    console.log('Token:', localStorage.getItem('token'));
    console.log('Iniciando carregamento da carteira...');

    const response = await api.get('/carteira');
    console.log('Response completa:', response);

    carteira.value = response.data.map(e => ({ ...e, aberto: false }));
    console.log('Carteira processada:', carteira.value);

    // Aguarda o DOM atualizar antes de renderizar o gráfico
    await nextTick();

    if (carteira.value.length > 0) {
      atualizarGrafico();
    }
  } catch (error) {
    console.error('Erro detalhado:', error);
    console.error('Response de erro:', error.response);
    mostrarMensagem('Erro ao carregar carteira', 'danger');
  }
};

const atualizarGrafico = () => {
  if (!chartRef.value) {
    console.warn('Canvas não encontrado');
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartRef.value.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: carteira.value.map(e => e.nome),
      datasets: [{
        data: carteira.value.map(e => e.porcentagem),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FFCD56', '#C9CBCF'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
};

const mostrarMensagem = async (mensagem, cor) => {
  const toast = await toastController.create({
    message: mensagem,
    duration: 3000,
    color: cor,
    position: 'top'
  });
  await toast.present();
};

onMounted(() => {
  carregarCarteira();
});
</script>

<style lang="scss">
@import '@/theme/carteira.scss';
</style>
