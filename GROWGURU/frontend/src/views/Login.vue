<template>
  <ion-page class="login-page">
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="8" size-lg="6" size-xl="4">
            <div class="ion-text-center ion-margin-bottom">
              <img src="@/assets/imagem/logo.png" alt="Logo" class="logo" />
              <h1>Bem-vindo de volta!</h1>
              <p>Faça login para continuar</p>
            </div>

            <ion-list>
              <ion-item>
                <ion-label position="floating">Email</ion-label>
                <ion-input v-model="email" type="email" @ionBlur="validateEmail" required></ion-input>
              </ion-item>
              <ion-text color="danger" v-if="emailError">{{ emailError }}</ion-text>

              <ion-item>
                <ion-label position="floating">Senha</ion-label>
                <ion-input v-model="password" :type="showPassword ? 'text' : 'password'" @ionBlur="validatePassword" required></ion-input>
                <ion-icon slot="end" :icon="showPassword ? eyeOffOutline : eyeOutline" @click="showPassword = !showPassword"></ion-icon>
              </ion-item>
              <ion-text color="danger" v-if="passwordError">{{ passwordError }}</ion-text>
            </ion-list>

            <ion-row class="ion-align-items-center ion-margin-top">
              <ion-col size="6">
                <ion-item lines="none">
                  <ion-label>Lembrar-me</ion-label>
                  <ion-checkbox v-model="rememberMe" slot="start"></ion-checkbox>
                </ion-item>
              </ion-col>
              <ion-col size="6" class="ion-text-end">
                <router-link to="/forgot-password">Esqueceu a senha?</router-link>
              </ion-col>
            </ion-row>

            <ion-button expand="block" @click="handleLogin" :disabled="loading || !isValidForm" class="ion-margin-top">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Entrar</span>
            </ion-button>

            <div class="ion-text-center ion-margin-top">
              <p>Não tem uma conta? <router-link to="/signup">Inscrever-se</router-link></p>
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores';
import {
  IonPage, IonContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel, IonInput, IonButton,
  IonText, IonSpinner, IonCheckbox, IonIcon, toastController
} from '@ionic/vue';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const loading = ref(false);
const emailError = ref('');
const passwordError = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);

onMounted(() => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    email.value = savedEmail;
    rememberMe.value = true;
  }
});

const isValidForm = computed(() => {
  return email.value &&
         password.value &&
         !emailError.value &&
         !passwordError.value;
});

const handleLogin = async () => {
  validateEmail();
  validatePassword();

  if (!isValidForm.value) {
    const toast = await toastController.create({
      message: 'Please correct the errors above.',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
    return;
  }

  loading.value = true;
  try {
    await authStore.login({
      email: email.value.trim().toLowerCase(),
      password: password.value
    });

    if (rememberMe.value) {
      localStorage.setItem('rememberedEmail', email.value);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const toast = await toastController.create({
      message: 'Login successful!',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

  } catch (error: any) {
    const toast = await toastController.create({
      message: 'Login failed',
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};

const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailError.value = !email.value ? 'Email is required' : !emailPattern.test(email.value) ? 'Invalid email' : '';
};

const validatePassword = () => {
  passwordError.value = !password.value ? 'Password is required' : password.value.length < 6 ? 'Password must be at least 6 characters' : '';
};
</script>
