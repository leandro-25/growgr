<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Comprar Ativo</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="dismiss">Fechar</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-list>
      <ion-item>
        <ion-label>Ativo: {{ ativo.ativos.codigo }} - {{ ativo.ativos.nome }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-label>Preço atual: R$ {{ ativo.ativos.preco_atual.toFixed(2) }}</ion-label>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Quantidade</ion-label>
        <ion-input v-model="quantidade" type="number" min="1"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Valor da compra (unitário)</ion-label>
        <ion-input v-model="valorCompra" type="number" :placeholder="ativo.ativos.preco_atual.toFixed(2)"></ion-input>
      </ion-item>
    </ion-list>
    <ion-button expand="block" @click="confirmBuy" :disabled="!isValid">Comprar</ion-button>
  </ion-content>
</template>

<script setup>
import { ref, computed, toRefs } from 'vue';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonList, IonItem, IonLabel, IonInput, modalController, toastController
} from '@ionic/vue';
import { useCarteiraStore } from '@/stores';

const props = defineProps({
  ativo: Object,
  estrategiaId: [Number, String]
});

const { ativo, estrategiaId } = toRefs(props);
const carteiraStore = useCarteiraStore();
const quantidade = ref(1);
const valorCompra = ref(ativo.value.ativos.preco_atual);

const isValid = computed(() => {
  return quantidade.value > 0 && valorCompra.value > 0;
});

const dismiss = () => {
  modalController.dismiss();
};

const confirmBuy = async () => {
  try {
    await carteiraStore.buyAsset({
      codigo_ativo: ativo.value.ativos.codigo,
      quantidade: quantidade.value,
      valor_compra: valorCompra.value,
      estrategia_id: parseInt(estrategiaId.value, 10)
    });
    const toast = await toastController.create({
      message: 'Compra realizada com sucesso!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    dismiss();
  } catch (error) {
    console.error('Erro na compra:', error);
    const toast = await toastController.create({
      message: error.response?.data?.error || 'Erro ao processar compra',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
};
</script>
