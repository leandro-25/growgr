import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';
import { toastController } from '@ionic/vue';

export const useCarteiraStore = defineStore('carteira', () => {
  const carteira = ref([]);
  const loading = ref(false);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const fetchCarteira = async () => {
    loading.value = true;
    try {
      const { data } = await api.get('/carteira');
      carteira.value = data.map(e => ({ ...e, aberto: false }));
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
      const toast = await toastController.create({
        message: 'Erro ao carregar carteira',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      loading.value = false;
    }
  };

  const venderAtivo = async (ativo, estrategiaId) => {
    try {
      await api.post('/vender', {
        codigo_ativo: ativo.codigo,
        quantidade: ativo.quantidadeVenda,
        estrategia_id: ativo.estrategia_id || estrategiaId
      });
      await fetchCarteira();
      const toast = await toastController.create({
        message: 'Venda realizada com sucesso!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Erro na venda:', error);
      const toast = await toastController.create({
        message: error.response?.data?.error || 'Erro na venda',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  };

  const toggleDetalhes = (id) => {
    carteira.value = carteira.value.map(e => ({
      ...e,
      aberto: e.id === id ? !e.aberto : e.aberto
    }));
  };

  const buyAsset = async (assetData) => {
    try {
      await api.post('/carteira', assetData);
      await fetchCarteira();
    } catch (error) {
      console.error('Erro na compra:', error);
      throw error;
    }
  };

  return {
    carteira,
    loading,
    fetchCarteira,
    venderAtivo,
    buyAsset,
    toggleDetalhes,
    formatarMoeda
  };
});
