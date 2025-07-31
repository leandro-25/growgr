import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';
import { toastController } from '@ionic/vue';

export const useEstrategiasStore = defineStore('estrategias', () => {
  const estrategias = ref([]);
  const loading = ref(false);

  const fetchEstrategias = async () => {
    loading.value = true;
    try {
      const { data } = await api.get('/estrategias');
      estrategias.value = data;
    } catch (error) {
      console.error('Erro ao carregar estratégias:', error);
      const toast = await toastController.create({
        message: 'Erro ao carregar estratégias',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      loading.value = false;
    }
  };

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

  const ativos = ref([]);

  const fetchAtivosByEstrategia = async (idEstrategia) => {
    loading.value = true;
    try {
      const { data } = await api.get(`/estrategias/${idEstrategia}/ativos`);
      ativos.value = data.map(a => ({
        ...a,
        valorCompra: a.ativos.preco_atual,
        quantidade: 1
      }));
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
      const toast = await toastController.create({
        message: 'Erro ao carregar ativos da estratégia',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      loading.value = false;
    }
  };

  return {
    estrategias,
    loading,
    ativos,
    fetchEstrategias,
    fetchAtivosByEstrategia,
    formatarData,
    formatRentabilidade
  };
});
