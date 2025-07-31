<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Olá, {{ userStore.user?.nome }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card class="balance-card">
        <ion-card-header>
          <ion-card-subtitle>Saldo disponível</ion-card-subtitle>
          <ion-card-title>{{ userStore.balance.toFixed(2) }} BRL</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Conta desde: {{ formatDateShort(userStore.user?.created_at) }}</p>
        </ion-card-content>
      </ion-card>

      <ion-list-header>
        <h2>Transações recentes</h2>
      </ion-list-header>

      <ion-list v-if="userStore.transactions.length > 0">
        <ion-item v-for="transacao in userStore.transactions" :key="transacao.id">
          <ion-label>
            <h2>{{ transacao.descricao }}</h2>
            <p>{{ formatDate(transacao.data) }}</p>
          </ion-label>
          <ion-note slot="end" :color="transacao.tipo === 'deposito' ? 'success' : 'danger'">
            {{ transacao.tipo === 'deposito' ? '+' : '-' }} {{ transacao.valor.toFixed(2) }}
          </ion-note>
        </ion-item>
      </ion-list>
      <div v-else class="empty-state">
        <p>Nenhuma transação encontrada</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore, useAuthStore } from '@/stores';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonCardContent, IonList, IonListHeader, IonItem,
  IonLabel, IonNote
} from '@ionic/vue';

const userStore = useUserStore();
const authStore = useAuthStore();

const formatDate = (dataISO) => {
  if (!dataISO) return '';
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dataISO) => {
  if (!dataISO) return '';
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

onMounted(async () => {
  if (authStore.token) {
    await userStore.fetchUser();
    await userStore.fetchTransactions();
  }
});
</script>

<style scoped>
.balance-card {
  margin-bottom: 20px;
}
.empty-state {
  text-align: center;
  margin-top: 50px;
  color: var(--ion-color-medium);
}
</style>
