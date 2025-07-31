import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const balance = ref(0);
  const transactions = ref([]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/usuarios');
      user.value = data;
      balance.value = data.saldo;
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transacoes');
      transactions.value = data;
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    }
  };

  const createTransaction = async (transactionData) => {
    try {
      const { data } = await api.post('/transacoes', transactionData);
      await fetchUser();
      await fetchTransactions();
      return data;
    } catch (error) {
      console.error('Failed to create transaction', error);
      throw error;
    }
  };

  return {
    user,
    balance,
    transactions,
    fetchUser,
    fetchTransactions,
    createTransaction
  };
});
