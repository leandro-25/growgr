<template>
  <ion-page class="home-page">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="header-container">
          <ion-title class="welcome-title">Olá, {{ userName }}</ion-title>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="content" class="ion-padding">
      <div class="content-container">
        <!-- Card de Saldo -->
        <div class="balance-card">
          <div class="card-content">
            <div class="user-info">
              <h2 class="user-name">{{ userName }}</h2>
              <p class="account-date">Conta desde {{ formatDateShort(userCreatedAt) }}</p>
            </div>
            <div class="balance-info">
              <p class="balance-label">Saldo disponível</p>
              <p class="balance-value">R$ {{ saldo.toFixed(2) }}</p>
            </div>
          </div>
          <div class="card-decoration"></div>
          <img src="@/assets/imagem/visa.png" alt="Visa Logo" class="card-logo" />
        </div>

        <!-- Lista de Transações -->
        <div class="transactions-section">
          <h3 class="section-title">Transações recentes</h3>
          <div class="transactions-list">
            <div v-if="visibleTransactions.length === 0" class="empty-state">
              <p>Nenhuma transação encontrada</p>
            </div>
            <div v-for="transacao in visibleTransactions" 
                 :key="transacao.id" 
                 class="transaction-item">
              <div class="transaction-info">
                <h4 class="transaction-type">{{ transacao.tipo }}</h4>
                <p class="transaction-description">{{ transacao.descricao }}</p>
                <p class="transaction-date">{{ formatDate(transacao.data) }}</p>
              </div>
              <span :class="['transaction-amount', transacao.tipo === 'deposito' ? 'income' : 'expense']">
                R$ {{ transacao.valor.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
// Importar componentes Ionic usados no template
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';

const router = useRouter();
const content = ref(null);
const userName = ref('');
const saldo = ref(0);
const userCreatedAt = ref('');
const allTransactions = ref([]);
const currentPage = ref(1);
const limit = 5;
const windowStart = ref(0);

const visibleTransactions = computed(() => {
  return allTransactions.value.slice(windowStart.value, windowStart.value + limit);
});

const formatDate = (dataISO) => {
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dataISO) => {
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const loadInitialData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const { data: usuario } = await api.get('/usuarios', {
      headers: { Authorization: `Bearer ${token}` },
    });
    userName.value = usuario.nome;
    saldo.value = usuario.saldo;
    userCreatedAt.value = usuario.created_at;
    await loadTransactions(1);
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      router.push('/login');
    } else {
      console.error('Erro ao carregar dados:', error);
    }
  }
};

const loadTransactions = async (page) => {
  try {
    const token = localStorage.getItem('token');
    const { data: transacoesData } = await api.get('/transacoes', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });

    transacoesData.forEach((novaTransacao) => {
      if (!allTransactions.value.some((t) => t.id === novaTransacao.id)) {
        allTransactions.value.push(novaTransacao);
      }
    });
    allTransactions.value.sort((a, b) => new Date(b.data) - new Date(a.data));
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
  }
};

const handleScroll = async () => {
  const contentEl = content.value.$el;
  const scrollTop = contentEl.scrollTop;
  const scrollHeight = contentEl.scrollHeight;
  const clientHeight = contentEl.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 100 && allTransactions.value.length >= limit) {
    const nextPage = currentPage.value + 1;
    await loadTransactions(nextPage);
    currentPage.value = nextPage;
    if (windowStart.value + limit < allTransactions.value.length) {
      windowStart.value += 1;
    }
  }

  if (scrollTop <= 100 && windowStart.value > 0) {
    windowStart.value -= 1;
  }
};

onMounted(async () => {
  await loadInitialData();
  nextTick(() => {
    if (content.value && content.value.$el) {
      content.value.$el.addEventListener('scroll', handleScroll);
    }
  });
});

onUnmounted(() => {
  if (content.value && content.value.$el) {
    content.value.$el.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style lang="scss">
@use '@/theme/homepage.scss';
</style>
