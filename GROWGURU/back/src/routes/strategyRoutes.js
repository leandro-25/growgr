const express = require('express');
const router = express.Router();
const { getStrategies, getStrategyAssets } = require('../controllers/strategyController');

// @route   GET /api/estrategias
// @desc    Busca todas as estratégias de investimento
// @access  Public
router.get('/estrategias', getStrategies);

// @route   GET /api/estrategias/:id/ativos
// @desc    Busca os ativos de uma estratégia específica
// @access  Public
router.get('/estrategias/:id/ativos', getStrategyAssets);

module.exports = router;
