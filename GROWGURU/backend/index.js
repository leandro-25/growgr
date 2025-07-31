require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/error');

// Route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const transactionRoutes = require('./routes/transaction.routes');
const strategyRoutes = require('./routes/strategy.routes');
const carteiraRoutes = require('./routes/carteira.routes');

const app = express();
const port = 3000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:8100',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Mount routers
app.use('/api', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/transacoes', transactionRoutes);
app.use('/api/estrategias', strategyRoutes);
app.use('/api/carteira', carteiraRoutes);

// Error handler middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
