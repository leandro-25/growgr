<template>
  <ion-page class="estrategias-page">
    <ion-header>
      <ion-toolbar>
        <ion-title>Estratégias de Investimento</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshEstrategias" class="action-button clear">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <ion-text>Carregando estratégias...</ion-text>
      </div>

      <!-- Empty State -->
      <div v-else-if="estrategias.length === 0" class="empty-container">
        <ion-icon :icon="documentOutline" size="large"></ion-icon>
        <ion-text>Nenhuma estratégia encontrada</ion-text>
      </div>

      <!-- Lista de Cards -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="estrategias-grid">
        <ion-card v-for="estrategia in estrategias" :key="estrategia.id">
          <ion-ripple-effect></ion-ripple-effect>
          <ion-card-header>
            <div class="flex justify-between items-center">
              <ion-card-title>{{ estrategia.nome }}</ion-card-title>
              <ion-button 
                fill="clear" 
                @click="verDetalhes(estrategia.id)"
                class="action-button"
              >
                <ion-icon :icon="arrowForwardCircle"></ion-icon>
              </ion-button>
            </div>
            <ion-card-subtitle>
              <ion-icon :icon="calendarOutline"></ion-icon>
              {{ formatarData(estrategia.created_at) }}
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <ion-text class="text-description">
              <p>{{ estrategia.descricao }}</p>
            </ion-text>
            
            <div class="metrics-container">
              <div class="metric-item">
                <div class="metric-label">
                  <ion-icon :icon="trendingUpOutline" class="positive-value"></ion-icon>
                  <span>Rentabilidade Média</span>
                </div>
                <span :class="estrategia.rentabilidade_media >= 0 ? 'positive-value' : 'negative-value'">
                  {{ formatRentabilidade(estrategia.rentabilidade_media) }}
                </span>
              </div>
              
              <div class="metric-item">
                <div class="metric-label">
                  <ion-icon :icon="briefcaseOutline"></ion-icon>
                  <span>Ativos Relacionados</span>
                </div>
                <span class="badge">
                  {{ estrategia.ativos?.length || 0 }}
                </span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
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
  IonRefresher, IonRefresherContent, IonButtons, IonRippleEffect
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

<style lang="scss">
@import '@/theme/estrategias.scss';
</style>