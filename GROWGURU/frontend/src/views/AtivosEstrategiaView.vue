<template>
  <ion-page>
    <ion-header class="bg-[#111827] text-[#F9FAFB]">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/estrategias" text="Voltar" class="text-[#F59E0B]"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ estrategiaNome }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="carregarDados" class="text-[#F59E0B]">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="bg-[#111827] text-[#F9FAFB] p-4">
      <div v-if="loading" class="flex flex-col items-center justify-center h-64 gap-4">
        <ion-spinner class="text-[#F59E0B]"></ion-spinner>
        <ion-text>Carregando ativos...</ion-text>
      </div>

      <div v-else-if="ativos.length === 0" class="flex flex-col items-center justify-center h-64 gap-4 text-[#374151]">
        <ion-icon :icon="alertCircleOutline" size="large"></ion-icon>
        <ion-text>Nenhum ativo encontrado nesta estratégia</ion-text>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="(ativo, index) in ativos" :key="index">
          <ion-item class="mb-4 bg-[#374151] rounded-lg shadow-md p-4">
            <ion-label class="w-full">
              <div class="flex justify-between items-center mb-2">
                <h2 class="flex items-center text-lg font-bold">
                  <ion-icon :icon="trendingUpOutline" class="mr-2 text-[#F59E0B]"></ion-icon>
                  {{ ativo.ativos.nome }}
                </h2>
                <ion-badge class="bg-[#F59E0B] text-[#F9FAFB] px-2 py-1 rounded-full">#{{ ativo.posicao }}</ion-badge>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-[#F9FAFB]">
                <p class="flex items-center">
                  <ion-icon :icon="ticketOutline" class="mr-1"></ion-icon>
                  {{ ativo.ativos.codigo }}
                </p>
                <p class="flex items-center">
                  <ion-icon :icon="pricetagOutline" class="mr-1"></ion-icon>
                  R$ {{ ativo.ativos.preco_atual.toFixed(2) }}
                </p>
                <ion-badge class="bg-[#374151] text-[#F9FAFB] px-2 py-1 rounded">{{ ativo.ativos.tipo }}</ion-badge>
              </div>
            </ion-label>

            <div class="bg-[#1F2937] p-4 rounded-lg mt-4">
              <ion-item lines="none" class="bg-[#374151] rounded mb-2">
                <ion-input
                  :value="ativo.valorCompra"
                  @ionChange="onValorChange($event, ativo)"
                  type="number"
                  label="Valor Unitário"
                  label-placement="floating"
                  :placeholder="ativo.ativos.preco_atual.toFixed(2)"
                  step="0.01"
                  class="text-[#F9FAFB] p-2"
                ></ion-input>
              </ion-item>

              <ion-item lines="none" class="bg-[#374151] rounded mb-2">
                <ion-input
                  :value="ativo.quantidade"
                  @ionChange="onQuantidadeChange($event, ativo)"
                  type="number"
                  label="Quantidade"
                  label-placement="floating"
                  min="1"
                  class="text-[#F9FAFB] p-2"
                ></ion-input>
              </ion-item>

              <!-- Update the buy button -->
              <ion-button 
                @click="adicionarCarteira(ativo)" 
                expand="block" 
                class="bg-[#22C55E] hover:bg-green-600 text-[#F9FAFB] mt-2 transition-colors"
                fill="clear"
              >
                <ion-icon :icon="addCircle" slot="start"></ion-icon>
                Comprar
              </ion-button>
            </div>
          </ion-item>
        </ion-item-sliding>
      </ion-list>
    </ion-content>
  </ion-page>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBackButton, IonButtons,
  IonButton, IonIcon, IonBadge, IonSpinner, IonRefresher,
  IonRefresherContent, IonItemSliding, IonInput
} from '@ionic/vue';
import { toastController } from '@ionic/vue';
import {
  addCircle, refreshOutline, alertCircleOutline,
  trendingUpOutline, ticketOutline, pricetagOutline
} from 'ionicons/icons';

const route = useRoute();
const estrategiaNome = ref('');
const ativos = ref([]);
const loading = ref(true);

const handleRefresh = async (event) => {
  await carregarDados();
  event.target.complete();
};

// Update carregarDados to handle loading state
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

    // Enviar dados para a API
    await api.post('/carteira', {
      codigo_ativo: ativo.ativos.codigo,
      quantidade: qtd,
      valor_compra: valor,
      estrategia_id: estrategiaId // Adicionar ID da estratégia
    });

    // Exibir mensagem de sucesso e resetar os valores para os padrões
    mostrarMensagem(`${qtd} unidade(s) compradas!`, 'success');
    ativo.valorCompra = ativo.ativos.preco_atual;
    ativo.quantidade = 1;
  } catch (error) {
    console.error('Erro na compra:', error);
    mostrarMensagem(error.response?.data?.error || error.message, 'danger');
  }
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

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 1rem;
  color: var(--ion-color-medium);
}

.ativo-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.ativo-info {
  padding: 1rem;
}

.ativo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.ativo-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.ativo-icon {
  margin-right: 0.5rem;
  vertical-align: middle;
}

.compra-container {
  background: var(--ion-color-light);
  padding: 1rem;
  border-radius: 8px;
  margin: 0.5rem;
}

.input-item {
  --background: transparent;
  margin-bottom: 0.5rem;
}

.valor-input,
.quantidade-input {
  --background: var(--ion-color-light-shade);
  --padding-start: 8px;
  --padding-end: 8px;
  border-radius: 4px;
}

.comprar-button {
  margin-top: 1rem;
}

ion-badge {
  padding: 4px 8px;
  border-radius: 4px;
}

@media (max-width: 576px) {
  .ativo-details {
    flex-direction: column;
    align-items: flex-start;
  }

  .compra-container {
    width: 100%;
  }
}
</style>
