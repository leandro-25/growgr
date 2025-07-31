<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Operações Financeiras</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Saldo Atual</ion-card-subtitle>
          <ion-card-title>R$ {{ userStore.balance.toFixed(2) }}</ion-card-title>
        </ion-card-header>
      </ion-card>

      <ion-item>
        <ion-label position="stacked">Valor (R$)</ion-label>
        <ion-input v-model="valor" type="number" step="0.01"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label>Tipo de Operação</ion-label>
        <ion-select v-model="tipo">
          <ion-select-option value="deposito">Depósito</ion-select-option>
          <ion-select-option value="saque">Saque</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Descrição</ion-label>
        <ion-textarea v-model="descricao" rows="2"></ion-textarea>
      </ion-item>

      <ion-button
        expand="block"
        @click="executarTransacao"
        :disabled="!valor || valor <= 0"
        class="ion-margin-top"
      >
        Confirmar Operação
      </ion-button>

      <ion-list-header>
        <ion-label>Últimas Transações</ion-label>
      </ion-list-header>

      <ion-list>
        <ion-item v-for="transacao in userStore.transactions" :key="transacao.id">
          <ion-label>
            <h3>{{ formatarData(transacao.data) }}</h3>
            <p>{{ transacao.descricao }}</p>
          </ion-label>
          <ion-note slot="end" :color="transacao.tipo === 'deposito' ? 'success' : 'danger'">
            R$ {{ transacao.valor.toFixed(2) }}
          </ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore, useAuthStore } from '@/stores';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonSelect, IonSelectOption, IonTextarea, IonCard,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonList, IonListHeader, IonNote,
  toastController
} from '@ionic/vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const valor = ref('');
const tipo = ref('deposito');
const descricao = ref('');

const executarTransacao = async () => {
  try {
    await userStore.createTransaction({
      valor: parseFloat(valor.value),
      tipo: tipo.value,
      descricao: descricao.value
    });

    valor.value = '';
    descricao.value = '';

    const toast = await toastController.create({
      message: 'Transação realizada com sucesso!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  } catch (error) {
    console.error('Erro na transação:', error);
    const toast = await toastController.create({
      message: error.response?.data?.error || 'Erro ao processar operação',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
};

const formatarData = (dataISO) => {
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  if (authStore.token) {
    userStore.fetchUser();
    userStore.fetchTransactions();
  }
});
</script>
