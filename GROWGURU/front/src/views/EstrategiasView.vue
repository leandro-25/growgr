<template>
  <ion-page class="estrategias-page">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="header-container">
          <div class="logo-container">
            <img src="@/assets/imagem/logoP.png" alt="Logo" class="logo-image" />
            <div class="brand-text">
              <span class="brand-bold">Estratégias</span>
            </div>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content 
      ref="content" 
      class="ion-padding"
      :scroll-events="true"
    >
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content
          pulling-icon="chevron-down-circle-outline"
          refreshing-spinner="circles"
        ></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div v-if="loading" class="loading-indicator">
        <ion-spinner></ion-spinner>
        <p>Carregando...</p>
      </div>

      <div class="content-container" :class="{ 'content-loading': loading }">
        <!-- Empty State -->
        <div v-if="!loading && !estrategias.length" class="empty-state">
          <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
          <p>Nenhuma estratégia encontrada</p>
        </div>
        <div class="estrategias-grid">
        <div 
          v-for="estrategia in estrategias" 
          :key="estrategia.id"
          class="estrategia-card"
        >
          <div class="card-header">
            <div class="header-content">
              <h3 class="estrategia-nome">{{ estrategia.nome }}</h3>
            </div>
            <div class="estrategia-data">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span>{{ formatarData(estrategia.created_at) }}</span>
            </div>
          </div>

          <div class="card-content">
            <div class="descricao-container">
              <p class="estrategia-descricao">
                {{ estrategia.descricao || 'Nenhuma descrição fornecida' }}
              </p>
            </div>
            
            <div class="detalhes-container">
              <div class="metrica">
                <div class="metrica-rotulo">
                  <div class="metrica-icone" :class="getRentabilidadeClass(estrategia.rentabilidade_media)">
                    <ion-icon :icon="trendingUpOutline"></ion-icon>
                  </div>
                  <span>Rentabilidade Média</span>
                </div>
                <span class="metrica-valor" :class="getRentabilidadeClass(estrategia.rentabilidade_media, true)">
                  {{ formatRentabilidade(estrategia.rentabilidade_media) }}
                </span>
              </div>
              
              <div class="metrica">
                <div class="metrica-rotulo">
                  <div class="metrica-icone">
                    <ion-icon :icon="briefcaseOutline"></ion-icon>
                  </div>
                  <span>Ativos Relacionados</span>
                </div>
                <span class="badge-ativos">
                  {{ estrategia.total_ativos || 0 }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <button 
              class="botao-acao"
              @click.stop="verDetalhes(estrategia.id)"
            >
              <span>Ver Detalhes</span>
              
            </button>
          </div>
        </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonText, IonList, IonItem, IonLabel,
  IonNote, IonButton, IonIcon, IonSpinner, IonBadge,
  IonRefresher, IonRefresherContent, IonButtons
} from '@ionic/vue';
import {
  arrowForwardCircle,
  calendarOutline,
  trendingUpOutline,
  briefcaseOutline,
  refreshOutline,
  documentOutline
} from 'ionicons/icons';

const router = useRouter();
const estrategias = ref([]);
const loading = ref(true);

// Format functions
const formatarData = (dataISO) => {
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatRentabilidade = (valor) => {
  if (!valor) return 'N/A';
  return `${valor.toFixed(2)}%`;
};

const getRentabilidadeColor = (valor) => {
  if (!valor) return 'medium';
  return valor >= 0 ? 'success' : 'danger';
};

const getRentabilidadeClass = (valor, isValue = false) => {
  if (isValue) {
    return valor >= 0 ? 'positive-value' : 'negative-value';
  }
  return valor >= 0 ? 'positive-value' : 'negative-value';
};

// Actions
const verDetalhes = (id) => {
  router.push({ 
    name: 'AtivosEstrategia',
    params: { id }
  });
};

const handleRefresh = async (event) => {
  await carregarEstrategias();
  event.target.complete();
};

const refreshEstrategias = () => {
  loading.value = true;
  carregarEstrategias();
};

const carregarEstrategias = async () => {
  try {
    const { data } = await api.get('/estrategias');
    estrategias.value = data;
  } catch (error) {
    console.error('Erro ao carregar estratégias:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  carregarEstrategias();
});
</script>

<style lang="scss" scoped>
@import '@/theme/estrategias.scss';

/* Estilos para os cards */
.estrategia-card {
  margin-bottom: 0; /* Removido pois o espaçamento é controlado pelo gap do grid */
  
  .card-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-footer {
    padding: 0 16px 16px;
  }
}

/* Espaçamento entre as métricas */
.metrica {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

/* Container de conteúdo */
.content-container {
  padding: 16px 0;
}

/* Ajuste para telas menores */
@media (max-width: 768px) {
  .content-container {
    padding: 16px 0;
  }
  
  .estrategia-card {
    .card-header,
    .card-content,
    .card-footer {
      padding: 12px;
    }
  }
}

// Container de conteúdo
.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 0;
}

// Grid de estratégias
.estrategias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

// Estilos do header
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: transparent !important;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: transparent !important;
}

.logo-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.brand-text {
  font-size: 24px;
  color: #FFFFFF;
  background-color: transparent !important;
}

.brand-bold {
  font-weight: 700;
  background-color: transparent !important;
}
</style>