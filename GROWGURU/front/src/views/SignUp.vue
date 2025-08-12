<template>
  <ion-page class="bg-gradient-to-br from-[#111827] via-gray-900 to-[#111827]">
    <ion-content class="h-screen overflow-hidden" :scroll-y="false">
      <div class="absolute inset-0 flex items-center justify-center p-6">
        <div class="w-full max-w-md">
          <h1 class="text-3xl sm:text-4xl font-bold text-[#F9FAFB] mb-8 text-center">Criar Conta</h1>
          
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-[#F9FAFB]">Nome Completo</label>
              <ion-item class="rounded-lg">
                <ion-input 
                  v-model="nome" 
                  type="text"
                  class="w-full px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-100"
                  placeholder="Digite seu nome completo"
                ></ion-input>
              </ion-item>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-[#F9FAFB]">Email</label>
              <ion-item class="rounded-lg bg-gray-800/50 border border-[#374151]">
                <ion-input 
                  v-model="email" 
                  type="email"
                  class="text-[#F9FAFB]"
                  placeholder="Digite seu email"
                ></ion-input>
              </ion-item>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-[#F9FAFB]">Senha</label>
              <ion-item class="rounded-lg bg-gray-800/50 border border-[#374151]">
                <div class="relative w-full">
                  <ion-input 
                    v-model="senha" 
                    :type="showPassword ? 'text' : 'password'"
                    class="text-[#F9FAFB]"
                    placeholder="Digite sua senha"
                  ></ion-input>
                  <div 
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 text-gray-400 hover:text-[#F59E0B]"
                  >
                    <ion-icon 
                      :icon="showPassword ? eyeOffOutline : eyeOutline" 
                      class="w-5 h-5"
                    ></ion-icon>
                  </div>
                </div>
              </ion-item>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-[#F9FAFB]">Confirmar Senha</label>
              <ion-item class="rounded-lg bg-gray-800/50 border border-[#374151]">
                <div class="relative w-full">
                  <ion-input 
                    v-model="confirmarSenha" 
                    :type="showConfirmPassword ? 'text' : 'password'"
                    class="text-[#F9FAFB]"
                    placeholder="Confirme sua senha"
                  ></ion-input>
                  <div 
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 text-gray-400 hover:text-[#F59E0B]"
                  >
                    <ion-icon 
                      :icon="showConfirmPassword ? eyeOffOutline : eyeOutline" 
                      class="w-5 h-5"
                    ></ion-icon>
                  </div>
                </div>
              </ion-item>
            </div>
            <button 
              @click="handleSignUp"
              class="w-full py-3.5 px-4 bg-[#FB923C] hover:bg-orange-500 text-[#111827] font-semibold rounded-lg transition-all transform hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 h-12"
              :disabled="loading"
            >
              <ion-spinner 
                v-if="loading" 
                class="w-5 h-5" 
                name="crescent"
              ></ion-spinner>
              <span>{{ loading ? 'Criando conta...' : 'Criar Conta' }}</span>
            </button>
            <div class="text-center mt-6">
              <p class="text-[#F9FAFB]">
                Já tem uma conta? 
                <router-link to="/login" class="text-[#EC4899] hover:text-pink-400 font-medium">
                  Faça login
                </router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
ion-item {
  --background: transparent;
  --border-color: transparent;
  --highlight-height: 0;
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 0;
  margin-bottom: 1rem;
}

ion-item::part(native) {
  padding: 0;
  background: transparent;
}

ion-input {
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
  --placeholder-color: #9CA3AF;
  --background: rgba(31, 41, 55, 0.5);
}

ion-input.ion-focused {
  --background: rgba(31, 41, 55, 0.5);
}
</style>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { api } from '@/api';
  import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    toastController
  } from '@ionic/vue';
  
  // Add these refs
  const showPassword = ref(false);
  const showConfirmPassword = ref(false);
  
  const router = useRouter();
  const nome = ref('');
  const email = ref('');
  const senha = ref('');
  const confirmarSenha = ref('');
  
  const showToast = async (message, color = 'success') => {
    const toast = await toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  };
  
  // Add loading state
  const loading = ref(false);
  
  // Update handleSignUp to use loading state
  const handleSignUp = async () => {
    try {
      loading.value = true;
      // Validação básica
      if (!nome.value || !email.value || !senha.value) {
        return showToast('Preencha todos os campos!', 'warning');
      }
  
      if (senha.value !== confirmarSenha.value) {
        return showToast('As senhas não coincidem!', 'warning');
      }
  
      const { data } = await api.post('/signup', {
        nome: nome.value.trim(),
        email: email.value.trim().toLowerCase(),
        password: senha.value
      });
  
      if (data.user) {
        await showToast('Cadastro realizado com sucesso!');
        router.push('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao cadastrar';
      showToast(errorMessage, 'danger');
      console.error('Signup error:', error);
    }
  };
  </script>