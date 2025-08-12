<template>
  <ion-page class="ativos-page" :class="{ 'menu-open': isMenuOpen }">
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-header>
      <ion-toolbar>
       <!--<ion-buttons slot="start">
          <ion-back-button default-href="/estrategias" text="Voltar"></ion-back-button>
        </ion-buttons>-->
        <ion-title>{{ estrategiaNome }}</ion-title>
       
      </ion-toolbar>
    </ion-header>

    <!-- Overlay de fundo - Só renderiza quando o menu está aberto -->
    <div 
      v-if="isMenuOpen"
      class="menu-overlay"
      @click="closeMenu"
    ></div>
    
    <ion-content>
      <!-- Botão do menu flutuante -->
      <div class="floating-menu">
        <button 
          class="menu-button"
          :class="{ 'menu-open': isMenuOpen }"
          @click="toggleMenu"
          @touchstart="handleTouchStart"
        >
          <span class="menu-icon">
            <span class="line line-1"></span>
            <span class="line line-2"></span>
            <span class="line line-3"></span>
          </span>
        </button>
        
        <!-- Itens do menu -->
        <div class="menu-items" :class="{ 'show': isMenuOpen }" @click.stop>
          <button class="menu-item ripple" @click="handleMenuAction('refresh')" @touchstart="handleTouchStart">
            <ion-icon :icon="refreshOutline" class="menu-icon"></ion-icon>
            <span>Atualizar</span>
          </button>
          <button class="menu-item ripple" @click="handleMenuAction('back')" @touchstart="handleTouchStart">
            <ion-icon :icon="arrowBackOutline" class="menu-icon"></ion-icon>
            <span>Voltar</span>
          </button>
        </div>
      </div>
      
      <div class="content-container">
        <div v-if="loading" class="loading-state">
          <ion-spinner></ion-spinner>
          <p>Carregando ativos...</p>
        </div>

        <div v-else-if="ativos.length === 0" class="empty-state">
          <ion-icon :icon="alertCircleOutline" size="large"></ion-icon>
          <p>Nenhum ativo encontrado nesta estratégia</p>
        </div>

      <div class="cards-grid">
        <div v-for="(ativo, index) in ativos" :key="index" class="card-wrapper">
          <ion-card class="ativo-card">
            <div class="card-header">
              <div class="asset-info">
                <div class="asset-details">
                  <h3>{{ ativo.ativos.nome }}</h3>
                  <span class="asset-type">{{ formatAssetType(ativo.ativos.tipo) }}</span>
                </div>
              </div>
              <ion-badge class="position-badge">#{{ ativo.posicao }}</ion-badge>
            </div>
            <ion-card-content class="card-content">
              <div class="form-row">
                <ion-item class="form-input" style="--min-height: 80px;">
                  <ion-label position="floating" style="font-size: 16px; --color: #F9FAFB; transform: none !important; margin-left: 0.1em;">Valor Unitário</ion-label>
                  <ion-input
                    :value="ativo.valorCompra"
                    @ionChange="onValorChange($event, ativo)"
                    type="number"
                    :placeholder="ativo.ativos.preco_atual.toFixed(2)"
                    step="0.01"
                    class="custom-input"
                  ></ion-input>
                </ion-item>

                <ion-item class="form-input">
                  <ion-label position="floating">Quantidade</ion-label>
                  <ion-input
                    :value="ativo.quantidade"
                    @ionChange="onQuantidadeChange($event, ativo)"
                    type="number"
                    min="1"
                    class="custom-input"
                  ></ion-input>
                </ion-item>
              </div>

              <div class="total-section">
                <span>Total</span>
                <span class="total-amount">R$ {{ calculateTotal(ativo) }}</span>
              </div>

              <ion-button 
                @click="adicionarCarteira(ativo)" 
                expand="block"
                class="buy-button"
              >
                <ion-icon :icon="addCircle" slot="start"></ion-icon>
                Adicionar à Carteira
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>
        </div>
      </div>
    </ion-content>
    
    <ion-tab-bar slot="bottom" class="custom-tab-bar">
      <ion-tab-button tab="home" href="/tabs/home">
        <ion-icon :icon="homeOutline"></ion-icon>
        <ion-label>Início</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="estrategias" href="/tabs/estrategias" class="estrategias-tab-selected">
        <ion-icon :icon="analyticsOutline"></ion-icon>
        <ion-label>Estratégias</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="carteira" href="/tabs/carteira">
        <ion-icon :icon="cardOutline"></ion-icon>
        <ion-label>Carteira</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
    
  </ion-tabs>
  </ion-page>
</template>


<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons,
  IonButton, IonIcon, IonBadge, IonSpinner, IonRefresher,
  IonRefresherContent, IonItemSliding, IonInput,
  IonTabs, IonTabBar, IonTabButton
} from '@ionic/vue';
import { toastController } from '@ionic/vue';
import {
  addCircle, refreshOutline, alertCircleOutline,
  trendingUpOutline, trendingDownOutline, ticketOutline,
  pricetagOutline, businessOutline, cardOutline,
  homeOutline, analyticsOutline, arrowBackOutline,
  menuOutline, closeOutline
} from 'ionicons/icons';

const route = useRoute();
const router = useRouter();
const estrategiaNome = ref('');
const ativos = ref([]);
const loading = ref(true);
const isMenuOpen = ref(false);

// Funções do menu flutuante
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

// Fechar menu ao clicar fora
const handleClickOutside = (event) => {
  const menu = document.querySelector('.floating-menu');
  if (menu && !menu.contains(event.target)) {
    closeMenu();
  }
};

// Adicionar e remover listener de clique global
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleMenuAction = (action) => {
  if (action === 'refresh') {
    handleRefreshAction();
  } else if (action === 'back') {
    // Usa o router.go(-1) para voltar para a página anterior no histórico
    router.go(-1);
  }
  isMenuOpen.value = false;
};

const handleTouchStart = (e) => {
  // Adiciona feedback háptico se disponível
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
  
  // Efeito de ripple
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
  const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
  
  const ripple = document.createElement('span');
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.pointerEvents = 'none';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.background = 'rgba(255, 255, 255, 0.7)';
  ripple.style.width = '10px';
  ripple.style.height = '10px';
  ripple.style.top = `${y}px`;
  ripple.style.left = `${x}px`;
  
  button.appendChild(ripple);
  
  setTimeout(() => {
    ripple.style.transition = 'all 0.6s ease-out';
    ripple.style.width = '200px';
    ripple.style.height = '200px';
    ripple.style.opacity = '0';
  }, 10);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

const handleRefresh = async (event) => {
  await carregarDados();
  if (event && event.target) {
    event.target.complete();
  }
};

const handleRefreshAction = async () => {
  await carregarDados();
};

const carregarDados = async () => {
  loading.value = true;
  try {
    const estrategiaId = route.params.id;
    
    // Buscar estratégia e ativos
    const estrategiaResponse = await api.get(`/estrategias?id=eq.${estrategiaId}`);
    const ativosResponse = await api.get(`/estrategias/${estrategiaId}/ativos`);

    estrategiaNome.value = estrategiaResponse.data[0]?.nome || 'Estratégia';
    
    // Inicializar com valores editáveis
    ativos.value = ativosResponse.data.map(a => ({
      ...a,
      valorCompra: a.ativos.preco_atual, // Valor padrão editável
      quantidade: 1                       // Quantidade padrão editável
    }));
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Falha ao carregar dados', 'danger');
  } finally {
    loading.value = false;
  }
};

const onValorChange = (event, ativo) => {
  // event.detail.value contém o valor digitado (em string)
  const novoValor = parseFloat(event.detail.value);
  // Atualiza somente se o valor for um número válido
  ativo.valorCompra = isNaN(novoValor) ? ativo.ativos.preco_atual : novoValor;
};

const onQuantidadeChange = (event, ativo) => {
  const novaQtd = parseInt(event.detail.value, 10);
  ativo.quantidade = isNaN(novaQtd) ? 1 : novaQtd;
};

const adicionarCarteira = async (ativo) => {
  try {
    // Utilize os valores que já estão no objeto ativo
    const estrategiaId = parseInt(route.params.id); 
    
    // Validação do ID
    if (isNaN(estrategiaId)) {
      throw new Error('ID da estratégia inválido');
    }

    const valor = ativo.valorCompra;
    const qtd = ativo.quantidade;

    if (isNaN(valor) || valor <= 0) throw new Error('Valor inválido');
    if (isNaN(qtd) || qtd <= 0) throw new Error('Quantidade inválida');

    // Enviar dados para a API e capturar a resposta
    const response = await api.post('/carteira', {
      codigo_ativo: ativo.ativos.codigo,
      quantidade: qtd,
      valor_compra: valor,
      estrategia_id: estrategiaId // Adicionar ID da estratégia
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

    // Exibir mensagem de sucesso e resetar os valores para os padrões
    mostrarMensagem(`${qtd} unidade(s) compradas!`, 'success');
    ativo.valorCompra = ativo.ativos.preco_atual;
    ativo.quantidade = 1;
  } catch (error) {
    console.error('Erro na compra:', error);
    mostrarMensagem(error.response?.data?.error || error.message, 'danger');
  }
};

  // Métodos auxiliares para formatação
  const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2).replace('.', ',');
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${parseFloat(value).toFixed(2)}%`;
  };

  const formatAssetType = (type) => {
    const types = {
      'acao': 'Ação',
      'fii': 'Fundo Imobiliário',
      'bdr': 'BDR',
      'etf': 'ETF',
      'stock': 'Ação',
      'reit': 'FII',
      'crypto': 'Criptomoeda'
    };
    return types[type.toLowerCase()] || type;
  };

  const getAssetIcon = (type) => {
    const icons = {
      'acao': businessOutline,
      'fii': businessOutline,
      'bdr': cardOutline,
      'etf': trendingUpOutline,
      'stock': businessOutline,
      'reit': businessOutline,
      'crypto': pricetagOutline
    };
    return icons[type.toLowerCase()] || pricetagOutline;
  };

  const getPriceChangeIcon = (value) => {
    return value >= 0 ? trendingUpOutline : trendingDownOutline;
  };

  const calculateTotal = (ativo) => {
    const total = ativo.valorCompra * ativo.quantidade;
    return isNaN(total) ? '0,00' : formatCurrency(total);
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
  carregarDados();
});
</script>

<style lang="scss" scoped>
@import '@/theme/ativos-estrategia.scss';

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.ativo-card {
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  
  /* Glassmorphism overlay effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
    z-index: -1;
    border-radius: 16px;
  }
  
  /* Hover effect */
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  ion-card-header {
    padding-bottom: 8px;
    
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .titulo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        
        ion-icon {
          color: var(--ion-color-primary);
        }
      }
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      
      .tipo-badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
      }
      
      .preco-atual {
        font-weight: 600;
        color: var(--ion-color-primary);
      }
    }
  }
  
  ion-card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: 0;
    
    .compra-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      ion-item {
        --background: transparent;
        --padding-start: 0;
        --inner-padding-end: 0;
        margin-bottom: 8px;
      }
      
      .comprar-btn {
        margin-top: auto;
      }
    }
    margin: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
  
  /* Subtle shine effect */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
    transition: 0.6s;
  }
  
  &:hover::after {
    left: 100%;
  }
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.asset-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-icon ion-icon {
  font-size: 20px;
  color: var(--ion-color-primary);
}

.asset-details h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

.asset-type {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
  display: block;
}

.position-badge {
  --background: var(--ion-color-primary);
  --color: white;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.price-section {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.1);
}

.current-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.current-price .label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.current-price .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ion-text-color);
}

.price-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
}

.price-change .up {
  color: #10b981;
}

.price-change .down {
  color: #ef4444;
}

.card-content {
  padding: 16px 20px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Responsividade */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
.custom-tab-bar {
  --background: #111827;
  --color: #F9FAFB;
  --border-color: #374151;
  padding: 5px 0;
  height: 60px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.custom-tab-bar ion-tab-button {
  --color: #a0aec0;
  --color-selected: #10dc60; /* Verde neon para a aba selecionada */
  --background-focused: rgba(16, 220, 96, 0.1);
  position: relative;
  overflow: visible;
}

.custom-tab-bar ion-tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 50%;
  height: 3px;
  background: #10dc60; /* Verde neon para a barra de seleção */
  transition: transform 0.3s ease;
  border-radius: 0 0 4px 4px;
}

.custom-tab-bar ion-tab-button.tab-selected {
  color: #10dc60; /* Cor do ícone e texto quando selecionado */
}

.custom-tab-bar ion-tab-button.tab-selected::before {
  transform: translateX(-50%) scaleX(1);
}

.custom-tab-bar ion-label {
  font-size: 0.75rem;
  margin-top: 4px;
}

.custom-tab-bar ion-icon {
  font-size: 1.25rem;
}

/* Estilo especial para a aba de Estratégias apenas nesta tela */
.custom-tab-bar .estrategias-tab-selected {
  --color: #10dc60; /* Verde neon */
  --color-selected: #10dc60;
}

.custom-tab-bar .estrategias-tab-selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 3px;
  background: #10dc60; /* Verde neon */
  border-radius: 0 0 4px 4px;
}

/* Garante que o conteúdo não fique escondido atrás da tab bar */
ion-content {
  --padding-bottom: 70px; /* Aumentado para acomodar a tab bar fixa */
  --background: linear-gradient(135deg, rgba(11, 15, 26, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%);
  background: var(--background);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
}
</style>
