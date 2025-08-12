<template>
  <ion-page class="carteira-page">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="header-container">
          <div class="logo-container">
            <img src="@/assets/imagem/logoPPP.png" alt="Logo" class="logo-image" />
            <div class="brand-text">
              <span class="brand-bold">Carteira</span>
            </div>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Estado de carregamento -->
      <div v-if="carregando" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Carregando sua carteira...</p>
      </div>

      <!-- Conteúdo principal -->
      <div v-else>
        <!-- Resumo da carteira -->
        <div class="resumo-container">
          <div class="valor-total">
            <h2>Valor Total</h2>
            <p class="valor">{{ formatarMoeda(valorTotalCarteira) }}</p>
          </div>
        </div>

        <!-- Gráfico de Distribuição -->
        <div v-if="carteira.length > 0" class="chart-section">
          <div class="chart-container">
            <canvas ref="chartRef" width="100%" height="100%"></canvas>
          </div>
          <!-- Carrossel de Legenda -->
          <div class="carousel-container" @mouseenter="pausarCarrossel" @mouseleave="retomarCarrossel" @touchstart="toqueInicio" @touchend="toqueFim">
            <div ref="legendCarousel" class="legend-container" :class="{ 'paused': carrosselPausado }">
              <div v-for="(item, index) in legendasDuplicadas" :key="`${index}-${item.nome}`" class="legend-item">
                <div class="legend-icon" :class="`legend-icon-${(carteira.findIndex(i => i.nome === item.nome) % 20) + 1}`" :style="{ backgroundColor: item.cor }"></div>
                <span class="legend-text">{{ item.nome }} ({{ item.porcentagem }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <!--<ion-icon name="wallet-outline" size="large"></ion-icon>-->
          <p>Nenhum investimento encontrado</p>
          <ion-button @click="irParaInvestir" class="add-button">
            Adicionar Investimento
          </ion-button>
        </div>

        <!-- Lista de Estratégias -->
        <!-- Modern Strategy List -->
        <div v-if="carteira.length > 0" class="modern-strategy-list">
          <div v-for="estrategia in carteira" :key="estrategia.id" class="strategy-card" :class="{ 'expanded': estrategia.aberto }">
            <!-- Strategy Header -->
            <div class="strategy-header" @click="toggleDetalhes(estrategia.id)">
              <div class="strategy-header-content">
                <!--<div class="strategy-icon">
                  <ion-icon :name="estrategia.aberto ? 'folder-open' : 'folder'" class="folder-icon"></ion-icon>
                </div>-->
                <div class="strategy-info">
                  <h3 class="strategy-name">{{ estrategia.nome }}</h3>
                  <div class="strategy-meta">
                    <span class="strategy-percentage">{{ estrategia.porcentagem }}%</span>
                    <span class="strategy-value">{{ formatarMoeda(estrategia.total_investido) }}</span>
                  </div>
                </div>
                <!--<ion-icon :icon="estrategia.aberto ? chevronDown : chevronForward" class="toggle-arrow"></ion-icon>-->
              </div>
              
              <!-- Progress Bar -->
              <div class="progress-container">
                <div class="progress-bar" :style="{ width: `${estrategia.porcentagem}%` }"></div>
              </div>
            </div>

            <!-- Assets List (Visible when expanded) -->
            <transition name="slide-fade">
              <div v-if="estrategia.aberto" class="assets-container">
                <div v-for="ativo in estrategia.ativos" :key="ativo.codigo" class="asset-card">
                  <!-- Asset Header -->
                  <div class="asset-header">
                    <div class="asset-symbol">
                      <span class="symbol-badge">{{ ativo.codigo }}</span>
                      <span class="profit-badge" :class="{ 'profit': calcularLucro(ativo) >= 0, 'loss': calcularLucro(ativo) < 0 }">
                        {{ calcularLucro(ativo) }}%
                      </span>
                    </div>
                    <div class="asset-value">
                      {{ formatarMoeda(ativo.quantidade * ativo.valor_medio) }}
                    </div>
                  </div>

                  <!-- Asset Details Grid -->
                  <div class="asset-details">
                    <!-- First Row -->
                    <div class="detail-item">
                      <!--<ion-icon name="calculator-outline" class="detail-icon"></ion-icon>-->
                      <div class="detail-content">
                        <span class="detail-label">Quantidade</span>
                        <span class="detail-value">{{ ativo.quantidade }} un</span>
                      </div>
                    </div>
                    <div class="detail-item">
                      <!--<ion-icon name="pricetag-outline" class="detail-icon"></ion-icon>-->
                      <div class="detail-content">
                        <span class="detail-label">Preço Médio</span>
                        <span class="detail-value">{{ formatarMoeda(ativo.valor_medio) }}</span>
                      </div>
                    </div>
                    <!-- Second Row -->
                    <div class="detail-item">
                      <!--<ion-icon name="trending-up-outline" class="detail-icon"></ion-icon>-->
                      <div class="detail-content">
                        <span class="detail-label">Valor Atual</span>
                        <span class="detail-value">{{ formatarMoeda(ativo.preco_atual || ativo.valor_medio) }}</span>
                      </div>
                    </div>
                    <div class="detail-item">
                      <!--<ion-icon name="wallet-outline" class="detail-icon"></ion-icon>-->
                      <div class="detail-content">
                        <span class="detail-label">Total Investido</span>
                        <span class="detail-value">{{ formatarMoeda(ativo.quantidade * ativo.valor_medio) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Sell Action -->
                  <div class="asset-actions">
                    <div class="action-inputs">
                      <div class="input-group">
                        <label>Quantidade</label>
                        <ion-input 
                          v-model="ativo.quantidadeVenda" 
                          type="number" 
                          :min="0" 
                          :max="ativo.quantidade" 
                          placeholder="0"
                          class="modern-input"
                        ></ion-input>
                      </div>
                      <div class="input-group">
                        <label>Preço Unitário</label>
                        <ion-input 
                          v-model.number="ativo.precoVenda" 
                          type="number" 
                          :min="0" 
                          step="0.01"
                          :placeholder="formatarMoeda(ativo.valor_medio || 0, true)"
                          class="modern-input"
                        ></ion-input>
                      </div>
                    </div>
                    <ion-button 
                      @click.stop="venderAtivo(ativo, estrategia.id)" 
                      expand="block" 
                      class="sell-button"
                      :disabled="!ativo.quantidadeVenda || ativo.quantidadeVenda <= 0"
                    >
                      <!--<ion-icon :icon="cashOutline" slot="start"></ion-icon>-->
                      Vender Ativo
                    </ion-button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { Chart, registerables } from 'chart.js';
import { chevronDown, chevronForward, refreshOutline } from 'ionicons/icons';
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
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSpinner
} from '@ionic/vue';

const router = useRouter();
const carteira = ref([]);
const chartRef = ref(null);
const legendCarousel = ref(null);
const carregando = ref(true);
let chartInstance = null;
let carrosselPausado = ref(false);
let touchStartX = 0;
let touchEndX = 0;

const coresGrafico = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#C9CB3F', '#FF6F61', '#6B7280', '#34D399',
  '#F472B6', '#10B981', '#60A5FA', '#FBBF24', '#EC4899',
  '#4ADE80', '#F87171', '#38BDF8', '#A78BFA', '#FCD34D'
];

const legendasDuplicadas = computed(() => {
  const legendas = [];
  // Duplica os itens para criar um efeito contínuo
  for (let i = 0; i < 3; i++) {
    legendas.push(...carteira.value.map((item, idx) => ({
      ...item,
      nome: item.nome,
      porcentagem: item.porcentagem,
      cor: getCorPorIndice(idx),
      originalIndex: idx // Mantém o índice original para referência
    })));
  }
  return legendas;
});

function getCorPorIndice(index) {
  return coresGrafico[index % coresGrafico.length];
}

function pausarCarrossel() {
  carrosselPausado.value = true;
}

function retomarCarrossel() {
  carrosselPausado.value = false;
}

function toqueInicio(e) {
  touchStartX = e.changedTouches[0].screenX;
  pausarCarrossel();
}

function toqueFim(e) {
  touchEndX = e.changedTouches[0].screenX;
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) { // Se o deslize for significativo
    if (diff > 0) {
      // Deslizou para a esquerda
    } else {
      // Deslizou para a direita
    }
  }
  setTimeout(retomarCarrossel, 1000);
}

Chart.register(...registerables);

// Valor total da carteira
const valorTotalCarteira = computed(() => {
  return carteira.value.reduce((total, estrategia) => total + estrategia.total_investido, 0);
});

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const calcularLucro = (ativo) => {
  if (!ativo?.valor_medio || !ativo?.preco_atual) return '0.00';
  const lucro = ((ativo.preco_atual - ativo.valor_medio) / ativo.valor_medio) * 100;
  return lucro.toFixed(2);
};

const toggleDetalhes = (id) => {
  carteira.value = carteira.value.map(e => ({
    ...e,
    aberto: e.id === id ? !e.aberto : e.aberto
  }));
};

const venderAtivo = async (ativo, estrategiaId) => {
  try {
    if (!confirm(`Confirmar venda de ${ativo.quantidadeVenda} unidade(s) de ${ativo.codigo} por ${formatarMoeda(ativo.precoVenda || ativo.valor_medio)} cada?`)) {
      return;
    }

    carregando.value = true;
    const response = await api.post('/vender', {
      codigo_ativo: ativo.codigo,
      quantidade: ativo.quantidadeVenda,
      preco_venda: ativo.precoVenda || ativo.valor_medio,
      estrategia_id: ativo.estrategia_id || estrategiaId
    });

    // Atualizar o saldo localmente se a resposta contiver novo_saldo
    if (response.data && response.data.data) {
      // Emitir evento para atualizar o saldo na HomePage
      if (response.data.data.novo_saldo !== undefined) {
        window.dispatchEvent(new CustomEvent('saldo-atualizado', {
          detail: { novo_saldo: response.data.data.novo_saldo }
        }));
      }

      // Emitir evento para atualizar a carteira
      window.dispatchEvent(new CustomEvent('carteira-atualizada'));
    }

    await mostrarMensagem('Venda realizada com sucesso!', 'success');
    await carregarCarteira();
  } catch (error) {
    console.error('Erro na venda:', error);
    mostrarMensagem(error.response?.data?.error || 'Erro na venda', 'danger');
  } finally {
    carregando.value = false;
  }
};

const atualizarDados = async () => {
  carregando.value = true;
  await carregarCarteira();
  mostrarMensagem('Dados atualizados!', 'success');
};

const irParaInvestir = () => {
  router.push('/investir');
};

const atualizarGrafico = () => {
  if (!chartRef.value) {
    console.warn('Canvas não encontrado');
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  try {
    const ctx = chartRef.value.getContext('2d');

    if (!ctx) {
      console.error('Não foi possível obter o contexto 2D do canvas');
      return;
    }

    console.log('Contexto do canvas obtido com sucesso, criando gráfico...');

    // Usando o mesmo esquema de cores do carrossel para consistência
    const colors = carteira.value.map((_, index) => getCorPorIndice(index));

    // Elemento para exibir a porcentagem no centro
    const centerText = document.createElement('div');
    centerText.className = 'chart-center-text';
    centerText.style.position = 'absolute';
    centerText.style.top = '50%';
    centerText.style.left = '50%';
    centerText.style.transform = 'translate(-50%, -50%)';
    centerText.style.fontSize = '24px';
    centerText.style.fontWeight = 'bold';
    centerText.style.color = '#FFFFFF';
    centerText.style.textAlign = 'center';
    centerText.style.pointerEvents = 'none';
    // Mostra o total da carteira por padrão
    centerText.textContent = '100%';
    
    // Adiciona o elemento ao container do gráfico
    const chartContainer = chartRef.value.parentElement;
    chartContainer.style.position = 'relative';
    chartContainer.appendChild(centerText);

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: carteira.value.map(e => e.nome),
        datasets: [{
          data: carteira.value.map(e => e.porcentagem),
          backgroundColor: colors,
          borderWidth: 0,
          borderRadius: 8,
          spacing: 2,
          hoverOffset: 0,
          hoverBorderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        radius: '100%',
        layout: {
          padding: 5
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false // Desabilita o tooltip padrão
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        },
        onHover: (event, chartElement) => {
          if (event.native) {
            event.native.target.style.cursor = 'default';
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const estrategia = carteira.value[index];
            if (estrategia) {
              // Atualiza o texto central com a porcentagem clicada
              centerText.textContent = `${estrategia.porcentagem}%`;
              centerText.style.fontSize = '28px';
              centerText.style.transition = 'font-size 0.3s ease';
              
              // Abre os detalhes da estratégia
              toggleDetalhes(estrategia.id);
            }
          }
        }
      }
    });

    console.log('Gráfico criado com sucesso');
  } catch (error) {
    console.error('Erro ao criar gráfico:', error);
  }
};

const carregarCarteira = async () => {
  try {
    console.log('Iniciando carregamento da carteira...');
    carregando.value = true;

    const response = await api.get('/carteira');
    console.log('Response completa:', response);

    carteira.value = response.data.map(e => ({ ...e, aberto: false }));
    console.log('Carteira processada:', carteira.value);

    carregando.value = false;

    // Importante: Aguardar a renderização do DOM antes de tentar acessar o canvas
    await nextTick();

    if (carteira.value.length > 0) {
      console.log('Verificando elemento canvas:', chartRef.value);
      // Adicionando um atraso maior para garantir que o DOM esteja completamente renderizado
      setTimeout(() => {
        atualizarGrafico();
      }, 300);
    }
  } catch (error) {
    console.error('Erro ao carregar carteira:', error);
    mostrarMensagem('Erro ao carregar carteira', 'danger');
    carregando.value = false;
  }
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
  // Inicializar o carrossel após o carregamento
  nextTick(() => {
    if (legendCarousel.value) {
      // Ajusta a largura do container para o carrossel fluir corretamente
      const itemWidth = 200; // Largura aumentada para acomodar fonte maior
      const totalWidth = legendasDuplicadas.value.length * itemWidth / 3; // Divide por 3 porque duplicamos 3x
      legendCarousel.value.style.width = `${totalWidth}px`;
    }
  });
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style lang="scss">
@import '@/theme/carteira.scss';

.chart-center-text {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.chart-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  max-width: 500px;
  height: 500px;
  margin: 0 auto 10px;
  position: relative;
  padding: 0;
}

.carousel-container {
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  position: relative;
  margin: 1px auto 0;
  padding: 15px 0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-container {
  display: flex;
  gap: 12px;
  width: max-content;
  animation: slide 40s linear infinite;
  padding: 0 10px;
  
  &.paused {
    animation-play-state: paused;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  min-width: 180px;
  white-space: nowrap;
  color: #F9FAFB;
  font-weight: 600;
  padding: 12px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.12);
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  margin: 0 10px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

.legend-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.legend-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

@keyframes slide {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-100% / 3)); } /* Divide por 3 devido à triplicação */
}

/* Estilos para os ícones de legenda */
.legend-icon-1 { background-color: #FF6384; border-radius: 50%; }
.legend-icon-2 { background-color: #36A2EB; border-radius: 4px; }
.legend-icon-3 { background-color: #FFCE56; border-radius: 2px; border: 1px solid #333; }
.legend-icon-4 { background-color: #4BC0C0; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
.legend-icon-5 { background-color: #9966FF; border-radius: 50%; opacity: 0.9; }
.legend-icon-6 { background-color: #FF9F40; border: 1px dashed #fff; }
.legend-icon-7 { background-color: #C9CB3F; transform: rotate(45deg); }
.legend-icon-8 { background-color: #FF6F61; border-radius: 50%; box-shadow: 0 0 3px #000; }
.legend-icon-9 { background-color: #6B7280; clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }
.legend-icon-10 { background-color: #34D399; border: 1px dashed #fff; }
.legend-icon-11 { background-color: #F472B6; border-radius: 50%; opacity: 0.9; }
.legend-icon-12 { background-color: #10B981; border: 1px solid #fff; }
.legend-icon-13 { background-color: #60A5FA; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
.legend-icon-14 { background-color: #FBBF24; border-radius: 0; }
.legend-icon-15 { background-color: #EC4899; border-radius: 50%; box-shadow: 0 0 2px #fff; }
.legend-icon-16 { background-color: #4ADE80; border: 1px solid #fff; }
.legend-icon-17 { background-color: #F87171; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }
.legend-icon-18 { background-color: #38BDF8; border-radius: 50%; opacity: 0.9; }
.legend-icon-19 { background-color: #A78BFA; border: 1px dashed #fff; }
.legend-icon-20 { background-color: #FCD34D; clip-path: circle(50% at 50% 50%); }

@media (max-width: 600px) {
  .chart-container {
    max-width: 360px;
    height: 350px;
  }
  
  .carousel-container {
    max-width: 380px;
    padding: 10px 0;
  }
  
  .legend-item {
    font-size: 14px;
    min-width: 160px;
    padding: 10px 14px;
    margin: 0 6px;
  }
  
  .legend-icon {
    width: 16px;
    height: 16px;
  }
  
  .legend-text {
    max-width: 120px;
    font-size: 13px;
  }
}
</style>
