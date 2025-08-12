<template>
  <ion-page class="login-page bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <ion-content class="h-screen overflow-hidden">
      <div class="h-full flex items-center justify-center">
        <div class="w-full max-w-md px-6">
          <div class="logo-wrapper flex justify-center mb-6 -mt-20">
            <img 
              src="@/assets/imagem/logo.png" 
              alt="DeepSeekk Think Logo" 
              class="h-40 w-auto"
            />
          </div>
          <!-- Continue com o resto do template mantendo as classes Tailwind originais -->
          <h2 class="text-xl sm:text-2xl font-bold text-gray-100 mb-6 text-center">Entre na sua conta</h2>

          <form @submit.prevent="handleLogin" @keyup.enter="handleLogin" class="login-form">
            <!-- Email Input -->
            <div class="form-group">
              <label>Endereço de email</label>
              <div class="input-wrapper">
                <ion-input
                  v-model="email"
                  type="email"
                  placeholder="Insira seu e-mail..."
                  @blur="validateEmail"
                  autocomplete="email"
                  inputmode="email"
                  required
                ></ion-input>
              </div>
              <ion-text v-if="emailError" class="error-message">{{ emailError }}</ion-text>
            </div>

            <!-- Password Input -->
            <div class="form-group">
              <label>Senha</label>
              <div class="input-wrapper">
                <ion-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Insira sua senha..."
                  @blur="validatePassword"
                  autocomplete="current-password"
                  required
                ></ion-input>
                <div 
                  @click="showPassword = !showPassword"
                  class="toggle-password"
                >
                  <ion-icon 
                    :icon="showPassword ? eyeOffOutline : eyeOutline" 
                    class="w-5 h-5"
                  ></ion-icon>
                </div>
              </div>
              <ion-text v-if="passwordError" class="error-message">{{ passwordError }}</ion-text>
            </div>

            <!-- Remember Me -->
            <div class="remember-section">
              <div class="remember-checkbox">
                <ion-checkbox v-model="rememberMe"></ion-checkbox>
                <span>Lembrar</span>
              </div>

              <router-link to="/forgot-password" class="forgot-link">
                Esqueceu sua senha?
              </router-link>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              :disabled="loading || !isValidForm"
              class="submit-button"
            >
              <ion-spinner 
                v-if="loading"
                name="crescent"
              ></ion-spinner>
              <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
            </button>

            <!-- Sign Up Link -->
            <div class="signup-container">
              <p>
                Não tem uma conta? 
                <router-link to="/signup" class="signup-link">
                  Inscrever-se
                </router-link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style lang="scss">
@import '@/theme/login.scss';
</style>



<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText,
  IonSpinner, IonToast, IonCheckbox, IonIcon
} from '@ionic/vue';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

const email = ref('');
const password = ref('');
const loading = ref(false);
const emailError = ref('');
const passwordError = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const toast = reactive({
  show: false,
  message: '',
  color: 'primary'
});
const router = useRouter();

// Load saved email if remember me was used
onMounted(() => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    email.value = savedEmail;
    rememberMe.value = true;
  }
});

// Form validation
const isValidForm = computed(() => {
  return email.value && 
         password.value && 
         !emailError.value && 
         !passwordError.value;
});

// Enhanced login handler
const handleLogin = async () => {
  validateEmail();
  validatePassword();
  
  if (!isValidForm.value) {
    toast.show = true;
    toast.message = 'Please correct the errors above.';
    toast.color = 'danger';
    return;
  }
  
  loading.value = true;
  try {
    const { data } = await api.post('/login', {
      email: email.value.trim().toLowerCase(),
      password: password.value
    });
  
    if (rememberMe.value) {
      localStorage.setItem('rememberedEmail', email.value);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  
    localStorage.setItem('token', data.session.access_token);
    
    toast.show = true;
    toast.message = 'Login successful!';
    toast.color = 'success';
    
    // Pequeno atraso para garantir que o token seja processado
    setTimeout(() => {
      router.push('/home');
    }, 500); // Aumentado de 300ms a 500ms
  } catch (error: any) {
    toast.show = true;
    toast.message = 'Login failed';
    toast.color = 'danger';
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
