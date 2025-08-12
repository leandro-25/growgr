require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importar rotas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const strategyRoutes = require('./src/routes/strategyRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const debugRoutes = require('./src/routes/debugRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:8100', // Substitua pelo seu domínio do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middlewares globais
app.use(express.json());

// Montar as rotas da API
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', transactionRoutes);
app.use('/api', strategyRoutes);
app.use('/api', portfolioRoutes);
app.use('/api', debugRoutes); // Rota de debug

// Rota de health check
app.get('/', (req, res) => {
  res.send('API do GrowGuru está no ar!');
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
