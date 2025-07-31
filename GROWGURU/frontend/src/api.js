import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('Token being sent:', token); // Log do token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Full Authorization header:', config.headers.Authorization); 
  } else {
    console.warn('No token found in localStorage');
  }
  return config;
});

// Adicione no frontend/src/api.js
//api.post('/carteira', data, config) // Já existe na configuração base

export { api };