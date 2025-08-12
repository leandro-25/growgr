const express = require('express');
const router = express.Router();
const { getTransactions, addTransaction } = require('../controllers/transactionController');
const authenticate = require('../middlewares/authMiddleware');

// @route   GET /api/transacoes
// @desc    Busca todas as transações do usuário
// @access  Private
router.get('/transacoes', authenticate, getTransactions);

// @route   POST /api/transacoes
// @desc    Registra uma nova transação
// @access  Private
router.post('/transacoes', authenticate, addTransaction);

module.exports = router;
