<template>
  <ion-page class="signup-page">
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="8" size-lg="6" size-xl="4">
            <div class="ion-text-center ion-margin-bottom">
              <img src="@/assets/imagem/logo.png" alt="Logo" class="logo" />
              <h1>Crie sua conta</h1>
              <p>É rápido e fácil</p>
            </div>

            <ion-list>
              <ion-item>
                <ion-label position="floating">Nome Completo</ion-label>
                <ion-input v-model="nome" type="text" required></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Email</ion-label>
                <ion-input v-model="email" type="email" required></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Senha</ion-label>
                <ion-input v-model="password" :type="showPassword ? 'text' : 'password'" required></ion-input>
                <ion-icon slot="end" :icon="showPassword ? eyeOffOutline : eyeOutline" @click="showPassword = !showPassword"></ion-icon>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Confirmar Senha</ion-label>
                <ion-input v-model="confirmarSenha" :type="showConfirmPassword ? 'text' : 'password'" required></ion-input>
                <ion-icon slot="end" :icon="showConfirmPassword ? eyeOffOutline : eyeOutline" @click="showConfirmPassword = !showConfirmPassword"></ion-icon>
              </ion-item>
            </ion-list>

            <ion-button expand="block" @click="handleSignUp" :disabled="loading" class="ion-margin-top">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Criar Conta</span>
            </ion-button>

            <div class="ion-text-center ion-margin-top">
              <p>Já tem uma conta? <router-link to="/login">Faça login</router-link></p>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.logo {
  max-width: 150px;
  margin-bottom: 1rem;
}
ion-item {
  --background: transparent;
}
</style>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  toastController
} from '@ionic/vue';

const authStore = useAuthStore();
const nome = ref('');
const email = ref('');
const password = ref('');
const confirmarSenha = ref('');
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const showToast = async (message, color = 'success') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top'
  });
  await toast.present();
};

const handleSignUp = async () => {
  if (!nome.value || !email.value || !password.value) {
    return showToast('Preencha todos os campos!', 'warning');
  }

  if (password.value !== confirmarSenha.value) {
    return showToast('As senhas não coincidem!', 'warning');
  }

  loading.value = true;
  try {
    await authStore.signup({
      nome: nome.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value
    });

    await showToast('Cadastro realizado com sucesso!');
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Erro ao cadastrar';
    showToast(errorMessage, 'danger');
  } finally {
    loading.value = false;
  }
};
</script>
