<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Estratégias</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="estrategiasStore.loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Carregando estratégias...</p>
      </div>

      <div v-else-if="estrategiasStore.estrategias.length === 0" class="empty-state">
        <ion-icon :icon="documentOutline" size="large"></ion-icon>
        <p>Nenhuma estratégia encontrada</p>
      </div>

      <ion-card v-for="estrategia in estrategiasStore.estrategias" :key="estrategia.id" @click="verDetalhes(estrategia.id)">
        <ion-card-header>
          <ion-card-title>{{ estrategia.nome }}</ion-card-title>
          <ion-card-subtitle>{{ estrategiasStore.formatarData(estrategia.created_at) }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>{{ estrategia.descricao }}</p>
          <div class="metrics-container">
            <div class="metric-item">
              <span>Rentabilidade Média</span>
              <ion-note :color="estrategia.rentabilidade_media >= 0 ? 'success' : 'danger'">
                {{ estrategiasStore.formatRentabilidade(estrategia.rentabilidade_media) }}
              </ion-note>
            </div>
            <div class="metric-item">
              <span>Ativos</span>
              <ion-badge>{{ estrategia.ativos?.length || 0 }}</ion-badge>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEstrategiasStore, useAuthStore } from '@/stores';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonIcon, IonRefresher,
  IonRefresherContent, IonNote, IonBadge
} from '@ionic/vue';
import { documentOutline } from 'ionicons/icons';

const router = useRouter();
const estrategiasStore = useEstrategiasStore();
const authStore = useAuthStore();

const verDetalhes = (id) => {
  router.push({
    name: 'AtivosEstrategia',
    params: { id }
  });
};

const handleRefresh = async (event) => {
  await estrategiasStore.fetchEstrategias();
  event.target.complete();
};

onMounted(() => {
  if (authStore.token) {
    estrategiasStore.fetchEstrategias();
  }
});
</script>

<style scoped>
.loading-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ion-color-medium);
}
.metrics-container {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
