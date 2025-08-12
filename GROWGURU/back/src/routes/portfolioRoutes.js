const express = require('express');
const router = express.Router();
const {
  buyAsset,
  sellAsset,
  getPortfolio,
  getTotalInvested
} = require('../controllers/portfolioController');
const authenticate = require('../middlewares/authMiddleware');

// Middleware de autenticação para todas as rotas de portfólio
router.use(authenticate);

// @route   POST /api/carteira
// @desc    Registrar compra de ativo na carteira
// @access  Private
router.post('/carteira', buyAsset);

// @route   POST /api/vender
// @desc    Registrar venda de ativo na carteira
// @access  Private
router.post('/vender', sellAsset);

// @route   GET /api/carteira
// @desc    Buscar a carteira de investimentos do usuário
// @access  Private
router.get('/carteira', getPortfolio);

// @route   GET /api/total-investido
// @desc    Obter o total investido pelo usuário
// @access  Private
router.get('/total-investido', getTotalInvested);

module.exports = router;
