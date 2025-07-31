<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/estrategias"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ estrategiaNome }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="estrategiasStore.loading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Carregando ativos...</p>
      </div>

      <div v-else-if="estrategiasStore.ativos.length === 0" class="empty-state">
        <ion-icon :icon="alertCircleOutline" size="large"></ion-icon>
        <p>Nenhum ativo encontrado nesta estratégia</p>
      </div>

      <ion-card v-for="ativo in estrategiasStore.ativos" :key="ativo.id">
        <ion-card-header>
          <ion-card-title>{{ ativo.ativos.nome }}</ion-card-title>
          <ion-card-subtitle>{{ ativo.ativos.codigo }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>Preço: R$ {{ ativo.ativos.preco_atual.toFixed(2) }}</p>
          <p>Posição no ranking: #{{ ativo.posicao }}</p>
          <ion-button expand="block" @click="openBuyModal(ativo)" class="ion-margin-top">
            Comprar
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useEstrategiasStore, useAuthStore } from '@/stores';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonIcon, IonRefresher,
  IonRefresherContent, IonButtons, IonBackButton, IonButton, modalController
} from '@ionic/vue';
import { alertCircleOutline } from 'ionicons/icons';
import BuyAssetModal from './BuyAssetModal.vue';

const route = useRoute();
const estrategiasStore = useEstrategiasStore();
const authStore = useAuthStore();

const estrategiaId = computed(() => route.params.id);
const estrategiaNome = computed(() => {
  const estrategia = estrategiasStore.estrategias.find(e => e.id == estrategiaId.value);
  return estrategia ? estrategia.nome : 'Estratégia';
});

const openBuyModal = async (ativo) => {
  const modal = await modalController.create({
    component: BuyAssetModal,
    componentProps: {
      ativo: { ...ativo },
      estrategiaId: estrategiaId.value
    }
  });
  await modal.present();
};

const handleRefresh = async (event) => {
  await estrategiasStore.fetchAtivosByEstrategia(estrategiaId.value);
  event.target.complete();
};

onMounted(() => {
  if (authStore.token) {
    estrategiasStore.fetchAtivosByEstrategia(estrategiaId.value);
    if (estrategiasStore.estrategias.length === 0) {
      estrategiasStore.fetchEstrategias();
    }
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
</style>
