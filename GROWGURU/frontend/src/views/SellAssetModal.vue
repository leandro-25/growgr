<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Vender Ativo</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss">Fechar</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-list>
      <ion-item>
        <ion-label>Ativo: {{ ativo.codigo }} - {{ ativo.nome }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-label>Quantidade disponível: {{ ativo.quantidade }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Quantidade para vender</ion-label>
        <ion-input v-model="quantidadeVenda" type="number" min="0" :max="ativo.quantidade"></ion-input>
      </ion-item>
    </ion-list>
    <ion-button expand="block" @click="confirmSell" :disabled="!isValid">Vender</ion-button>
  </ion-content>
</template>

<script setup>
import { ref, computed, toRefs } from 'vue';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonList, IonItem, IonLabel, IonInput, modalController
} from '@ionic/vue';

const props = defineProps({
  ativo: Object,
  estrategiaId: Number
});

const { ativo, estrategiaId } = toRefs(props);
const quantidadeVenda = ref(0);

const isValid = computed(() => {
  return quantidadeVenda.value > 0 && quantidadeVenda.value <= ativo.value.quantidade;
});

const dismiss = () => {
  modalController.dismiss();
};

const confirmSell = () => {
  modalController.dismiss({
    ativo: { ...ativo.value, quantidadeVenda: quantidadeVenda.value },
    estrategiaId: estrategiaId.value
  }, 'confirm');
};
</script>
