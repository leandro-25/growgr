const express = require('express');
const router = express.Router();
const { getStrategies, getStrategyAssets } = require('../controllers/strategy.controller');

router.get('/', getStrategies);
router.get('/:id/ativos', getStrategyAssets);

module.exports = router;
