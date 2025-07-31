<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Sua Carteira</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="carteiraStore.carteira.length === 0" class="empty-state">
        <ion-icon :icon="walletOutline" size="large"></ion-icon>
        <p>Nenhum investimento encontrado</p>
      </div>

      <ion-card v-for="estrategia in carteiraStore.carteira" :key="estrategia.id" class="strategy-card">
        <ion-card-header>
          <ion-card-title>{{ estrategia.nome }}</ion-card-title>
          <ion-card-subtitle>
            Total Investido: {{ carteiraStore.formatarMoeda(estrategia.total_investido) }} |
            Porcentagem: {{ estrategia.porcentagem }}%
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item v-for="ativo in estrategia.ativos" :key="ativo.codigo">
              <ion-label>
                <h2>{{ ativo.codigo }} - {{ ativo.nome }}</h2>
                <p>Quantidade: {{ ativo.quantidade }}</p>
                <p>Valor Médio: {{ carteiraStore.formatarMoeda(ativo.valor_medio) }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" @click="openSellModal(ativo, estrategia.id)">
                <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCarteiraStore, useAuthStore } from '@/stores';
import { walletOutline, ellipsisVertical } from 'ionicons/icons';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonList, IonItem, IonLabel,
  IonButton, IonIcon, modalController
} from '@ionic/vue';
import SellAssetModal from './SellAssetModal.vue';

const carteiraStore = useCarteiraStore();
const authStore = useAuthStore();

const openSellModal = async (ativo, estrategiaId) => {
  const modal = await modalController.create({
    component: SellAssetModal,
    componentProps: {
      ativo: { ...ativo },
      estrategiaId: estrategiaId
    }
  });
  await modal.present();

  const { data, role } = await modal.onWillDismiss();
  if (role === 'confirm') {
    await carteiraStore.venderAtivo(data.ativo, data.estrategiaId);
  }
};

onMounted(() => {
  if (authStore.token) {
    carteiraStore.fetchCarteira();
  }
});
</script>

<style scoped>
.strategy-card {
  margin-bottom: 20px;
}
.empty-state {
  text-align: center;
  margin-top: 50px;
  color: var(--ion-color-medium);
}
</style>
