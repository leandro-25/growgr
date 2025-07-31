import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'));
  const user = ref(null);

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const clearToken = () => {
    token.value = null;
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const login = async (credentials: any) => {
    const { data } = await api.post('/login', credentials);
    setToken(data.session.access_token);
    user.value = data.user;
    router.push('/home');
  };

  const signup = async (userData: any) => {
    const { data } = await api.post('/signup', userData);
    setToken(data.session.access_token);
    user.value = data.user;
    router.push('/home');
  };

  const logout = () => {
    clearToken();
    user.value = null;
    router.push('/login');
  };

  const fetchUser = async () => {
    if (token.value && !user.value) {
      try {
        const { data } = await api.get('/usuarios');
        user.value = data;
      } catch (error) {
        console.error('Failed to fetch user', error);
        logout();
      }
    }
  };

  if (token.value) {
    setToken(token.value);
    fetchUser();
  }

  return {
    token,
    user,
    login,
    signup,
    logout,
    fetchUser
  };
});
